-- Target-Centric Embedding Architecture Schema
-- Adds embedding columns and matching tables for semantic article-target matching

-- ============================================================================
-- STEP 1: Enable pgvector extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- STEP 2: Add embedding columns to raw_articles
-- ============================================================================
ALTER TABLE raw_articles
ADD COLUMN IF NOT EXISTS embedding vector(1024),
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

-- Index for fast similarity search (using ivfflat for large datasets)
-- Note: ivfflat requires at least 1000 rows to build, will be created after data exists
-- For now, create a basic btree index on embedded_at
CREATE INDEX IF NOT EXISTS idx_raw_articles_embedded_at
ON raw_articles(embedded_at);

-- Index for finding articles that need embedding
CREATE INDEX IF NOT EXISTS idx_raw_articles_needs_embedding
ON raw_articles(scrape_status)
WHERE embedding IS NULL AND scrape_status = 'completed';

-- ============================================================================
-- STEP 3: Add embedding columns to intelligence_targets
-- ============================================================================
ALTER TABLE intelligence_targets
ADD COLUMN IF NOT EXISTS embedding vector(1024),
ADD COLUMN IF NOT EXISTS embedding_context TEXT,
ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 4: Create target_article_matches table
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_article_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES raw_articles(id) ON DELETE CASCADE,

  -- Match details
  similarity_score FLOAT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'semantic',
  match_reason TEXT,

  -- Signal categorization
  signal_strength TEXT,
  signal_category TEXT,

  -- Metadata
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Prevent duplicates
  UNIQUE(target_id, article_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_target_matches_org_time
ON target_article_matches(organization_id, matched_at DESC);

CREATE INDEX IF NOT EXISTS idx_target_matches_target
ON target_article_matches(target_id, similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_target_matches_article
ON target_article_matches(article_id);

CREATE INDEX IF NOT EXISTS idx_target_matches_strength
ON target_article_matches(organization_id, signal_strength);

-- ============================================================================
-- STEP 5: Create embedding_jobs table for tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS embedding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  items_total INTEGER,
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status
ON embedding_jobs(status, created_at DESC);

-- ============================================================================
-- STEP 6: Create vector similarity search function
-- ============================================================================
CREATE OR REPLACE FUNCTION match_articles_to_target(
  target_embedding vector(1024),
  similarity_threshold float DEFAULT 0.35,
  max_results int DEFAULT 50,
  since_time timestamptz DEFAULT NOW() - INTERVAL '24 hours'
)
RETURNS TABLE (
  id uuid,
  title text,
  source_name text,
  description text,
  url text,
  published_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ra.id,
    ra.title,
    ra.source_name,
    ra.description,
    ra.url,
    ra.published_at,
    1 - (ra.embedding <=> target_embedding) as similarity
  FROM raw_articles ra
  WHERE ra.embedding IS NOT NULL
    AND ra.embedded_at > since_time
    AND ra.scrape_status = 'completed'
    AND 1 - (ra.embedding <=> target_embedding) > similarity_threshold
  ORDER BY ra.embedding <=> target_embedding
  LIMIT max_results;
$$;

-- ============================================================================
-- STEP 7: Create function to find articles matching multiple targets (connections)
-- ============================================================================
CREATE OR REPLACE FUNCTION find_cross_target_articles(
  org_id uuid,
  min_targets int DEFAULT 2,
  since_time timestamptz DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE (
  article_id uuid,
  title text,
  source_name text,
  target_count bigint,
  targets jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ra.id as article_id,
    ra.title,
    ra.source_name,
    COUNT(DISTINCT m.target_id) as target_count,
    jsonb_agg(jsonb_build_object(
      'target_id', t.id,
      'target_name', t.name,
      'target_type', t.target_type,
      'similarity', m.similarity_score
    )) as targets
  FROM raw_articles ra
  JOIN target_article_matches m ON ra.id = m.article_id
  JOIN intelligence_targets t ON m.target_id = t.id
  WHERE m.organization_id = org_id
    AND m.matched_at > since_time
  GROUP BY ra.id, ra.title, ra.source_name
  HAVING COUNT(DISTINCT m.target_id) >= min_targets
  ORDER BY target_count DESC, ra.published_at DESC;
$$;

-- ============================================================================
-- STEP 8: Create function to get target signal summary
-- ============================================================================
CREATE OR REPLACE FUNCTION get_target_signal_summary(
  org_id uuid,
  since_time timestamptz DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE (
  target_id uuid,
  target_name text,
  target_type text,
  priority text,
  signal_count bigint,
  strong_signals bigint,
  avg_similarity float,
  latest_match timestamptz,
  top_sources text[]
)
LANGUAGE sql STABLE
AS $$
  SELECT
    t.id as target_id,
    t.name as target_name,
    t.target_type,
    t.priority,
    COUNT(*) as signal_count,
    COUNT(*) FILTER (WHERE m.signal_strength = 'strong') as strong_signals,
    AVG(m.similarity_score)::float as avg_similarity,
    MAX(m.matched_at) as latest_match,
    array_agg(DISTINCT ra.source_name ORDER BY ra.source_name) FILTER (WHERE ra.source_name IS NOT NULL) as top_sources
  FROM intelligence_targets t
  LEFT JOIN target_article_matches m ON t.id = m.target_id AND m.matched_at > since_time
  LEFT JOIN raw_articles ra ON m.article_id = ra.id
  WHERE t.organization_id = org_id
    AND t.is_active = true
  GROUP BY t.id, t.name, t.target_type, t.priority
  ORDER BY signal_count DESC, t.priority;
$$;

-- ============================================================================
-- STEP 9: Add RLS policies for target_article_matches
-- ============================================================================
ALTER TABLE target_article_matches ENABLE ROW LEVEL SECURITY;

-- Users can view matches for their organizations
CREATE POLICY "Users can view their org matches"
ON target_article_matches FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM org_users WHERE user_id = auth.uid()
  )
);

-- Service role can do everything
CREATE POLICY "Service role full access"
ON target_article_matches FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 10: Grant permissions
-- ============================================================================
GRANT SELECT ON target_article_matches TO authenticated;
GRANT ALL ON target_article_matches TO service_role;
GRANT SELECT ON embedding_jobs TO authenticated;
GRANT ALL ON embedding_jobs TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION match_articles_to_target TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION find_cross_target_articles TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_target_signal_summary TO authenticated, service_role;
