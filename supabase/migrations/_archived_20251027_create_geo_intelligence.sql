-- GEO Intelligence Signals Table
-- Stores AI visibility tests, competitor schema analysis, and GEO recommendations

CREATE TABLE IF NOT EXISTS geo_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Signal classification
  signal_type VARCHAR(50) NOT NULL, -- 'ai_visibility', 'visibility_gap', 'competitor_update', 'schema_gap'
  platform VARCHAR(50) NOT NULL, -- 'claude', 'gemini', 'chatgpt', 'perplexity', 'firecrawl'
  priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'

  -- Signal data
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- ai_visibility: { query, mentioned, position, context }
  -- visibility_gap: { query, mentioned: false, competitors_mentioned }
  -- competitor_update: { competitor_url, schemas_found, schema_types }
  -- schema_gap: { missing_field, competitor_has, impact }

  -- Recommendation
  recommendation JSONB DEFAULT '{}'::jsonb,
  -- { action, reasoning, expected_impact, auto_executable }

  -- Status tracking
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewed', 'actioned', 'dismissed'
  reviewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT geo_intelligence_signal_type_check CHECK (signal_type IN ('ai_visibility', 'visibility_gap', 'competitor_update', 'schema_gap', 'performance_drop', 'new_opportunity')),
  CONSTRAINT geo_intelligence_platform_check CHECK (platform IN ('claude', 'gemini', 'chatgpt', 'perplexity', 'firecrawl', 'all')),
  CONSTRAINT geo_intelligence_priority_check CHECK (priority IN ('critical', 'high', 'medium', 'low'))
);

-- Indexes
CREATE INDEX idx_geo_intelligence_org ON geo_intelligence(organization_id);
CREATE INDEX idx_geo_intelligence_signal_type ON geo_intelligence(signal_type);
CREATE INDEX idx_geo_intelligence_platform ON geo_intelligence(platform);
CREATE INDEX idx_geo_intelligence_priority ON geo_intelligence(priority);
CREATE INDEX idx_geo_intelligence_status ON geo_intelligence(status);
CREATE INDEX idx_geo_intelligence_created_at ON geo_intelligence(created_at DESC);

-- RLS Policies
ALTER TABLE geo_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's GEO intelligence"
  ON geo_intelligence FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert GEO intelligence"
  ON geo_intelligence FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their organization's GEO intelligence"
  ON geo_intelligence FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_geo_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER geo_intelligence_updated_at
  BEFORE UPDATE ON geo_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_geo_intelligence_updated_at();

-- Comment
COMMENT ON TABLE geo_intelligence IS 'Stores GEO (Generative Experience Optimization) intelligence signals from AI visibility tests and competitor schema monitoring';
