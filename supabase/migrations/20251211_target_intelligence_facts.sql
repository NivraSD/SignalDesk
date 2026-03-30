-- Target Intelligence Facts Schema
-- Stores structured facts extracted from articles per target
-- Enables accumulated intelligence and pattern detection

-- ============================================================================
-- 1. CREATE TARGET_INTELLIGENCE_FACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS target_intelligence_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES raw_articles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES target_article_matches(id) ON DELETE SET NULL,

  -- Fact details
  fact_type TEXT NOT NULL,              -- expansion, contraction, partnership, acquisition, etc.
  fact_summary TEXT NOT NULL,           -- One sentence describing what happened
  fact_details JSONB,                   -- Structured data specific to fact_type

  -- Entities and relationships
  entities_mentioned TEXT[],            -- Other companies, people, places involved
  relationships_detected JSONB,         -- [{entity, type, confidence}]

  -- Sentiment and scoring
  sentiment_score FLOAT,                -- -1.0 (negative) to 1.0 (positive)
  confidence_score FLOAT NOT NULL,      -- 0-1, confidence in extraction
  significance_score FLOAT,             -- 0-100, importance of fact

  -- Context
  geographic_region TEXT,               -- Latin America, Asia Pacific, Europe, etc.
  industry_sector TEXT,                 -- Mining, Energy, Finance, etc.

  -- Source tracking
  article_title TEXT,
  article_source TEXT,
  article_published_at TIMESTAMPTZ,

  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  extraction_model TEXT,                -- claude-sonnet-4, etc.

  -- Constraints
  UNIQUE(target_id, article_id),
  CONSTRAINT valid_fact_type CHECK (fact_type IN (
    'expansion', 'contraction', 'partnership', 'acquisition',
    'product_launch', 'leadership_change', 'financial',
    'legal_regulatory', 'crisis', 'strategy', 'hiring',
    'technology', 'market_position', 'other'
  )),
  CONSTRAINT valid_sentiment CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)),
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT valid_significance CHECK (significance_score IS NULL OR (significance_score >= 0 AND significance_score <= 100))
);

-- Add comment for documentation
COMMENT ON TABLE target_intelligence_facts IS 'Stores structured facts extracted from articles per intelligence target. Used for accumulated intelligence and pattern detection.

Fact types:
- expansion: Geographic or market expansion
- contraction: Market exit, downsizing, facility closure
- partnership: New or strengthened partnership/alliance
- acquisition: M&A activity (acquiring or being acquired)
- product_launch: New product, service, or offering
- leadership_change: Executive moves, board changes
- financial: Earnings, funding, financial performance
- legal_regulatory: Lawsuits, regulatory actions, compliance
- crisis: Negative events, scandals, PR issues
- strategy: Strategic announcements, pivots, restructuring
- hiring: Significant hiring, talent moves
- technology: Tech investments, digital transformation
- market_position: Market share changes, competitive moves
- other: Facts that do not fit other categories';

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_tif_target_time ON target_intelligence_facts(target_id, extracted_at DESC);
CREATE INDEX idx_tif_org_time ON target_intelligence_facts(organization_id, extracted_at DESC);
CREATE INDEX idx_tif_fact_type ON target_intelligence_facts(target_id, fact_type);

-- For finding facts by entities mentioned
CREATE INDEX idx_tif_entities ON target_intelligence_facts USING gin(entities_mentioned);

-- For joining back to articles
CREATE INDEX idx_tif_article ON target_intelligence_facts(article_id);

-- For finding unprocessed matches
CREATE INDEX idx_tif_match ON target_intelligence_facts(match_id) WHERE match_id IS NOT NULL;

-- ============================================================================
-- 3. ADD TRACKING COLUMNS TO INTELLIGENCE_TARGETS (if not exist)
-- ============================================================================

-- Add fact_count for quick stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets' AND column_name = 'fact_count'
  ) THEN
    ALTER TABLE intelligence_targets ADD COLUMN fact_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add last_fact_at for recency tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets' AND column_name = 'last_fact_at'
  ) THEN
    ALTER TABLE intelligence_targets ADD COLUMN last_fact_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 4. ADD PROCESSED FLAG TO TARGET_ARTICLE_MATCHES
-- ============================================================================

-- Track which matches have had facts extracted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'target_article_matches' AND column_name = 'facts_extracted'
  ) THEN
    ALTER TABLE target_article_matches ADD COLUMN facts_extracted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'target_article_matches' AND column_name = 'facts_extracted_at'
  ) THEN
    ALTER TABLE target_article_matches ADD COLUMN facts_extracted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index for finding unprocessed matches
CREATE INDEX IF NOT EXISTS idx_tam_needs_extraction
ON target_article_matches(organization_id, matched_at DESC)
WHERE facts_extracted = FALSE OR facts_extracted IS NULL;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get fact summary for a target
CREATE OR REPLACE FUNCTION get_target_fact_summary(p_target_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_facts', COUNT(*),
    'facts_last_7d', COUNT(*) FILTER (WHERE extracted_at > NOW() - INTERVAL '7 days'),
    'facts_last_30d', COUNT(*) FILTER (WHERE extracted_at > NOW() - INTERVAL '30 days'),
    'avg_sentiment', ROUND(AVG(sentiment_score)::numeric, 2),
    'fact_types', jsonb_object_agg(fact_type, type_count) FILTER (WHERE fact_type IS NOT NULL),
    'top_entities', (
      SELECT jsonb_agg(entity)
      FROM (
        SELECT unnest(entities_mentioned) as entity, COUNT(*) as cnt
        FROM target_intelligence_facts
        WHERE target_id = p_target_id
        GROUP BY entity
        ORDER BY cnt DESC
        LIMIT 10
      ) e
    ),
    'geographic_distribution', (
      SELECT jsonb_object_agg(geographic_region, region_count)
      FROM (
        SELECT geographic_region, COUNT(*) as region_count
        FROM target_intelligence_facts
        WHERE target_id = p_target_id AND geographic_region IS NOT NULL
        GROUP BY geographic_region
      ) g
    )
  )
  INTO result
  FROM (
    SELECT
      fact_type,
      COUNT(*) as type_count,
      sentiment_score,
      extracted_at
    FROM target_intelligence_facts
    WHERE target_id = p_target_id
    GROUP BY fact_type, sentiment_score, extracted_at
  ) facts
  CROSS JOIN LATERAL (
    SELECT COUNT(*) as total FROM target_intelligence_facts WHERE target_id = p_target_id
  ) t;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to update target fact count
CREATE OR REPLACE FUNCTION update_target_fact_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE intelligence_targets
    SET
      fact_count = COALESCE(fact_count, 0) + 1,
      last_fact_at = NEW.extracted_at,
      updated_at = NOW()
    WHERE id = NEW.target_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE intelligence_targets
    SET
      fact_count = GREATEST(0, COALESCE(fact_count, 0) - 1),
      updated_at = NOW()
    WHERE id = OLD.target_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for fact count updates
DROP TRIGGER IF EXISTS trigger_update_target_fact_count ON target_intelligence_facts;
CREATE TRIGGER trigger_update_target_fact_count
AFTER INSERT OR DELETE ON target_intelligence_facts
FOR EACH ROW
EXECUTE FUNCTION update_target_fact_count();

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE target_intelligence_facts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view facts for their organization
CREATE POLICY "Users can view own org facts"
ON target_intelligence_facts
FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE user_id = auth.uid()
  )
);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access"
ON target_intelligence_facts
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON target_intelligence_facts TO authenticated;
GRANT ALL ON target_intelligence_facts TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check table was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'target_intelligence_facts') THEN
    RAISE NOTICE 'SUCCESS: target_intelligence_facts table created';
  ELSE
    RAISE EXCEPTION 'FAILED: target_intelligence_facts table not created';
  END IF;
END $$;
