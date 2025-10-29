-- SCHEMA STORAGE SYSTEM FOR GEO
-- Stores schemas in Memory Vault with additional GEO-specific metadata

-- 1. Add schema-specific metadata to content_library (via intelligence JSONB)
-- No schema changes needed - we'll use the existing 'intelligence' JSONB field

-- 2. Create schema_recommendations table (like opportunities for schemas)
CREATE TABLE IF NOT EXISTS schema_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- What schema this recommendation is for
  schema_id UUID REFERENCES content_library(id) ON DELETE SET NULL, -- null if recommending new schema
  schema_type VARCHAR(100) NOT NULL, -- Organization, Product, FAQPage, etc.

  -- Recommendation details
  recommendation_type VARCHAR(50) NOT NULL, -- 'update_field', 'add_field', 'create_new', 'optimize_existing'
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- What platform detected this need
  source_platform VARCHAR(50), -- 'claude', 'gemini', 'chatgpt', 'perplexity', 'competitive_analysis'

  -- The recommendation
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT, -- Why this matters
  expected_impact TEXT, -- What will improve

  -- Specific changes to make
  changes JSONB NOT NULL, -- { field: 'description', old_value: '...', new_value: '...', action: 'update' }

  -- Auto-execute capability
  auto_executable BOOLEAN DEFAULT false,
  auto_execute_enabled BOOLEAN DEFAULT false,

  -- Execution tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'executed', 'failed'
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES auth.users(id),
  execution_result JSONB,

  -- Performance tracking
  before_metrics JSONB, -- Baseline metrics before change
  after_metrics JSONB, -- Metrics after change
  impact_measured_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schema_recs_org ON schema_recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_schema_recs_schema ON schema_recommendations(schema_id);
CREATE INDEX IF NOT EXISTS idx_schema_recs_status ON schema_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_schema_recs_priority ON schema_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_schema_recs_type ON schema_recommendations(recommendation_type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_schema_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schema_recommendations_updated_at
  BEFORE UPDATE ON schema_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_schema_recommendations_updated_at();

-- RLS Policies - Super permissive
ALTER TABLE schema_recommendations ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE schema_recommendations TO service_role;
GRANT ALL ON TABLE schema_recommendations TO postgres;
GRANT ALL ON TABLE schema_recommendations TO authenticated;
GRANT ALL ON TABLE schema_recommendations TO anon;

CREATE POLICY "Allow all for service_role"
  ON schema_recommendations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users"
  ON schema_recommendations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon"
  ON schema_recommendations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 3. Create schema_performance tracking table
CREATE TABLE IF NOT EXISTS schema_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  schema_id UUID REFERENCES content_library(id) ON DELETE CASCADE NOT NULL,

  -- Performance metrics
  platform VARCHAR(50) NOT NULL, -- 'claude', 'gemini', 'chatgpt', 'perplexity'
  query TEXT NOT NULL, -- The query that was tested
  mentioned BOOLEAN DEFAULT false,
  rank INTEGER, -- Position in response (1 = first mentioned)
  sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
  context_quality VARCHAR(20), -- 'strong', 'medium', 'weak'

  -- Response details
  response_snippet TEXT,
  full_response TEXT,

  -- Metadata
  tested_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(schema_id, platform, query, tested_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schema_perf_org ON schema_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_schema_perf_schema ON schema_performance(schema_id);
CREATE INDEX IF NOT EXISTS idx_schema_perf_platform ON schema_performance(platform);
CREATE INDEX IF NOT EXISTS idx_schema_perf_tested ON schema_performance(tested_at DESC);

-- RLS Policies
ALTER TABLE schema_performance ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE schema_performance TO service_role;
GRANT ALL ON TABLE schema_performance TO postgres;
GRANT ALL ON TABLE schema_performance TO authenticated;
GRANT ALL ON TABLE schema_performance TO anon;

CREATE POLICY "Allow all for service_role"
  ON schema_performance
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users"
  ON schema_performance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE schema_recommendations IS 'Auto-executable schema optimization recommendations generated by GEO monitoring';
COMMENT ON TABLE schema_performance IS 'Track schema performance across AI platforms over time';
COMMENT ON COLUMN schema_recommendations.auto_executable IS 'Can this recommendation be safely auto-applied without review';
COMMENT ON COLUMN schema_recommendations.changes IS 'Specific JSON patch operations to apply to schema';

-- Example schema storage in content_library:
-- INSERT INTO content_library (
--   organization_id,
--   content_type,
--   folder,
--   content,
--   metadata,
--   intelligence
-- ) VALUES (
--   'org-uuid',
--   'schema',
--   'Schemas/Active/',
--   '{"@context": "https://schema.org", "@type": "Organization", "name": "KARV", ...}',
--   '{"schema_type": "Organization", "platform_optimized": "all", "version": 1}',
--   '{"schemaType": "Organization", "fields": ["name", "description", "address"], "lastTested": "2025-10-27", "platforms": {"claude": {"mentioned": true, "rank": 1}, "gemini": {"mentioned": true, "rank": 2}}}'
-- );
