-- Migration: Campaign Attribution & Semantic Memory System
-- Purpose: Enable automatic campaign performance tracking and learning from outcomes
-- Based on Memory_Fingerprint architecture + OpenMemory multi-sector embeddings

-- =============================================================================
-- PART 1: ENABLE PGVECTOR (if not already enabled)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- PART 2: CAMPAIGN ATTRIBUTION TABLES
-- =============================================================================

-- Fingerprints created when content is exported
CREATE TABLE IF NOT EXISTS campaign_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  campaign_id UUID, -- References campaigns table (optional)
  content_id UUID NOT NULL, -- ID of generated content

  -- Fingerprint data for matching
  key_phrases TEXT[], -- Unique 3-7 word phrases from content
  semantic_embedding vector(768), -- Embedding of full content
  headline_embedding vector(768), -- Embedding of headline/key message
  unique_angles JSONB, -- Specific positioning/angles

  -- Content metadata
  content_type TEXT, -- 'press-release', 'blog-post', 'social-content', 'email', 'presentation'
  content_preview TEXT, -- First 500 chars for display

  -- Tracking info
  export_status TEXT DEFAULT 'exported', -- 'exported', 'matched', 'expired'
  exported_at TIMESTAMPTZ DEFAULT NOW(),
  expected_channels TEXT[], -- Where user said they'd post (optional)
  known_urls TEXT[], -- URLs user provided (optional)

  -- Attribution window (how long to actively search)
  tracking_start TIMESTAMPTZ DEFAULT NOW(),
  tracking_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track when content is exported
CREATE TABLE IF NOT EXISTS content_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  content_id UUID NOT NULL,
  fingerprint_id UUID REFERENCES campaign_fingerprints(id) ON DELETE CASCADE,

  export_format TEXT, -- 'pdf', 'docx', 'txt', 'html', 'pptx'
  exported_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional user-provided tracking info
  intended_channels TEXT[], -- User said they'll post to these channels
  intended_urls TEXT[], -- User said they'll post to these URLs
  notes TEXT -- User's notes about distribution plan
);

-- Attribution records (detected coverage)
CREATE TABLE IF NOT EXISTS campaign_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  fingerprint_id UUID REFERENCES campaign_fingerprints(id) ON DELETE CASCADE,
  campaign_id UUID,

  -- The detected content
  source_type TEXT NOT NULL, -- 'news', 'twitter', 'linkedin', 'blog', 'known_url'
  source_url TEXT NOT NULL,
  source_outlet TEXT, -- e.g., 'TechCrunch', '@journalist'
  content_title TEXT,
  content_text TEXT,
  published_at TIMESTAMPTZ,

  -- Attribution confidence
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  match_type TEXT NOT NULL, -- 'exact_phrase', 'semantic', 'contextual', 'user_verified'
  match_details JSONB, -- What matched (phrases, similarity scores, etc.)

  -- Impact metrics
  estimated_reach BIGINT, -- Estimated audience size
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  key_messages_present TEXT[], -- Which campaign messages appeared

  -- User verification
  user_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(fingerprint_id, source_url) -- Don't duplicate same coverage
);

COMMENT ON TABLE campaign_fingerprints IS 'Content fingerprints for automatic attribution tracking';
COMMENT ON TABLE content_exports IS 'Track when and how content is exported by users';
COMMENT ON TABLE campaign_attributions IS 'Detected media coverage matched to campaign fingerprints';

-- =============================================================================
-- PART 3: SEMANTIC MEMORY TABLES (Multi-Sector Embeddings)
-- =============================================================================

-- Multi-sector embeddings for strategies (enhances Memory Vault)
CREATE TABLE IF NOT EXISTS strategy_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID, -- References niv_strategies or content_library
  organization_id UUID NOT NULL,

  -- OpenMemory's 5-sector embeddings
  episodic_embedding vector(768), -- "What happened" - events, campaigns
  semantic_embedding vector(768), -- "What it means" - concepts, patterns
  procedural_embedding vector(768), -- "How to do it" - processes, workflows
  emotional_embedding vector(768), -- "Sentiment/tone" - stakeholder feelings
  reflective_embedding vector(768), -- "Meta insights" - patterns across strategies

  -- OpenMemory's HMD metadata
  salience FLOAT DEFAULT 1.0 CHECK (salience >= 0 AND salience <= 1.0),
  decay_rate FLOAT DEFAULT 0.02 CHECK (decay_rate >= 0 AND decay_rate <= 1.0),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sector classification
  primary_sectors TEXT[], -- Which sectors are most relevant

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waypoint graph for associative memory (how strategies relate)
CREATE TABLE IF NOT EXISTS strategy_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  from_strategy_id UUID NOT NULL,
  to_strategy_id UUID NOT NULL,

  weight FLOAT DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1.0), -- Connection strength
  link_type TEXT NOT NULL, -- 'similar_pattern', 'temporal', 'causal', 'stakeholder', 'successful_pattern'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(from_strategy_id, to_strategy_id, link_type)
);

-- Outcome tracking for learning (fed by attribution system)
CREATE TABLE IF NOT EXISTS strategy_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL,
  organization_id UUID NOT NULL,

  outcome_type TEXT NOT NULL, -- 'success', 'partial', 'minimal', 'failed', 'ongoing'
  effectiveness_score FLOAT CHECK (effectiveness_score >= 0 AND effectiveness_score <= 5),
  key_learnings TEXT[], -- What we learned from this campaign
  success_factors JSONB, -- What worked (e.g., coverage count, reach, patterns)
  failure_factors JSONB, -- What didn't work

  -- Link to attribution data
  total_coverage INTEGER DEFAULT 0,
  total_reach BIGINT DEFAULT 0,
  avg_confidence FLOAT,

  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE strategy_embeddings IS 'Multi-sector embeddings for semantic memory and intelligent retrieval';
COMMENT ON TABLE strategy_waypoints IS 'Graph connecting related strategies for associative memory';
COMMENT ON TABLE strategy_outcomes IS 'Campaign outcomes and learnings for future strategy generation';

-- =============================================================================
-- PART 4: INDEXES
-- =============================================================================

-- Attribution table indexes
CREATE INDEX IF NOT EXISTS idx_fingerprints_campaign ON campaign_fingerprints(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_org ON campaign_fingerprints(organization_id);
CREATE INDEX IF NOT EXISTS idx_fingerprints_status ON campaign_fingerprints(export_status, tracking_end);
CREATE INDEX IF NOT EXISTS idx_fingerprints_content ON campaign_fingerprints(content_id);

CREATE INDEX IF NOT EXISTS idx_exports_content ON content_exports(content_id);
CREATE INDEX IF NOT EXISTS idx_exports_fingerprint ON content_exports(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_exports_org ON content_exports(organization_id);

CREATE INDEX IF NOT EXISTS idx_attributions_campaign ON campaign_attributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attributions_fingerprint ON campaign_attributions(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_attributions_org ON campaign_attributions(organization_id);
CREATE INDEX IF NOT EXISTS idx_attributions_created ON campaign_attributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attributions_confidence ON campaign_attributions(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_attributions_published ON campaign_attributions(published_at DESC);

-- Vector indexes for semantic search (fingerprints)
CREATE INDEX IF NOT EXISTS idx_fingerprints_semantic
ON campaign_fingerprints USING ivfflat (semantic_embedding vector_cosine_ops)
WHERE semantic_embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fingerprints_headline
ON campaign_fingerprints USING ivfflat (headline_embedding vector_cosine_ops)
WHERE headline_embedding IS NOT NULL;

-- Semantic memory indexes
CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_strategy ON strategy_embeddings(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_org ON strategy_embeddings(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_salience ON strategy_embeddings(salience DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_waypoints_from ON strategy_waypoints(from_strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_waypoints_to ON strategy_waypoints(to_strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_waypoints_org ON strategy_waypoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_waypoints_weight ON strategy_waypoints(weight DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_outcomes_strategy ON strategy_outcomes(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_outcomes_org ON strategy_outcomes(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategy_outcomes_type ON strategy_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_strategy_outcomes_effectiveness ON strategy_outcomes(effectiveness_score DESC);

-- Vector indexes for multi-sector embeddings
CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_episodic
ON strategy_embeddings USING ivfflat (episodic_embedding vector_cosine_ops)
WHERE episodic_embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_semantic
ON strategy_embeddings USING ivfflat (semantic_embedding vector_cosine_ops)
WHERE semantic_embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_procedural
ON strategy_embeddings USING ivfflat (procedural_embedding vector_cosine_ops)
WHERE procedural_embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_strategy_embeddings_reflective
ON strategy_embeddings USING ivfflat (reflective_embedding vector_cosine_ops)
WHERE reflective_embedding IS NOT NULL;

-- =============================================================================
-- PART 5: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE campaign_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_outcomes ENABLE ROW LEVEL SECURITY;

-- Policies for attribution tables
CREATE POLICY fingerprints_org_isolation ON campaign_fingerprints
  FOR ALL USING (organization_id = auth.uid()::uuid);

CREATE POLICY exports_org_isolation ON content_exports
  FOR ALL USING (organization_id = auth.uid()::uuid);

CREATE POLICY attributions_org_isolation ON campaign_attributions
  FOR ALL USING (organization_id = auth.uid()::uuid);

-- Policies for semantic memory tables
CREATE POLICY strategy_embeddings_org_isolation ON strategy_embeddings
  FOR ALL USING (organization_id = auth.uid()::uuid);

CREATE POLICY strategy_waypoints_org_isolation ON strategy_waypoints
  FOR ALL USING (organization_id = auth.uid()::uuid);

CREATE POLICY strategy_outcomes_org_isolation ON strategy_outcomes
  FOR ALL USING (organization_id = auth.uid()::uuid);

-- =============================================================================
-- PART 6: POSTGRESQL FUNCTIONS
-- =============================================================================

-- Search fingerprints for attribution matching
CREATE OR REPLACE FUNCTION match_content_to_fingerprints(
  content_embedding vector(768),
  org_filter uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  fingerprint_id uuid,
  campaign_id uuid,
  similarity float,
  key_phrases text[],
  content_type text,
  exported_at timestamptz
)
LANGUAGE sql
AS $$
  SELECT
    id as fingerprint_id,
    campaign_id,
    1 - (semantic_embedding <=> content_embedding) as similarity,
    key_phrases,
    content_type,
    exported_at
  FROM campaign_fingerprints
  WHERE organization_id = org_filter
    AND export_status IN ('exported', 'matched')
    AND tracking_end > NOW()
    AND semantic_embedding IS NOT NULL
    AND 1 - (semantic_embedding <=> content_embedding) > match_threshold
  ORDER BY semantic_embedding <=> content_embedding
  LIMIT match_count;
$$;

-- Search strategies by semantic similarity across sectors
CREATE OR REPLACE FUNCTION search_strategy_embeddings(
  query_embedding vector(768),
  sector_name text,
  org_filter uuid,
  match_count int,
  match_threshold float
)
RETURNS TABLE (
  strategy_id uuid,
  similarity float,
  salience float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT
      e.strategy_id,
      1 - (e.%I <=> $1) as similarity,
      e.salience,
      e.created_at
    FROM strategy_embeddings e
    WHERE e.organization_id = $2
      AND e.%I IS NOT NULL
      AND 1 - (e.%I <=> $1) > $3
    ORDER BY e.%I <=> $1
    LIMIT $4
  ',
    sector_name || '_embedding',
    sector_name || '_embedding',
    sector_name || '_embedding',
    sector_name || '_embedding'
  )
  USING query_embedding, org_filter, match_threshold, match_count;
END;
$$;

-- Find similar strategies for creating waypoints
CREATE OR REPLACE FUNCTION find_similar_strategies(
  query_embedding vector(768),
  org_filter uuid,
  exclude_strategy uuid,
  match_count int,
  match_threshold float
)
RETURNS TABLE (
  strategy_id uuid,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    strategy_id,
    1 - (semantic_embedding <=> query_embedding) as similarity
  FROM strategy_embeddings
  WHERE organization_id = org_filter
    AND strategy_id != exclude_strategy
    AND semantic_embedding IS NOT NULL
    AND 1 - (semantic_embedding <=> query_embedding) > match_threshold
  ORDER BY semantic_embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Get campaign performance summary
CREATE OR REPLACE FUNCTION get_campaign_performance_summary(
  p_campaign_id uuid,
  p_org_id uuid
)
RETURNS TABLE (
  total_coverage bigint,
  high_confidence_matches bigint,
  total_reach bigint,
  avg_confidence float,
  sentiment_positive bigint,
  sentiment_neutral bigint,
  sentiment_negative bigint,
  verified_count bigint,
  pending_verification bigint
)
LANGUAGE sql
AS $$
  SELECT
    COUNT(*) as total_coverage,
    COUNT(*) FILTER (WHERE confidence_score > 0.8) as high_confidence_matches,
    COALESCE(SUM(estimated_reach), 0) as total_reach,
    COALESCE(AVG(confidence_score), 0) as avg_confidence,
    COUNT(*) FILTER (WHERE sentiment = 'positive') as sentiment_positive,
    COUNT(*) FILTER (WHERE sentiment = 'neutral') as sentiment_neutral,
    COUNT(*) FILTER (WHERE sentiment = 'negative') as sentiment_negative,
    COUNT(*) FILTER (WHERE user_verified = true) as verified_count,
    COUNT(*) FILTER (WHERE user_verified = false AND confidence_score < 0.9) as pending_verification
  FROM campaign_attributions
  WHERE campaign_id = p_campaign_id
    AND organization_id = p_org_id;
$$;

-- =============================================================================
-- PART 7: TRIGGERS
-- =============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fingerprints_updated_at BEFORE UPDATE ON campaign_fingerprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategy_embeddings_updated_at BEFORE UPDATE ON strategy_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION match_content_to_fingerprints IS 'Find campaign fingerprints matching detected content using semantic similarity';
COMMENT ON FUNCTION search_strategy_embeddings IS 'Search strategies by sector-specific embeddings (episodic, semantic, procedural, etc.)';
COMMENT ON FUNCTION find_similar_strategies IS 'Find similar strategies for creating waypoint connections';
COMMENT ON FUNCTION get_campaign_performance_summary IS 'Get aggregated performance metrics for a campaign';
