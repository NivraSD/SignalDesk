-- GEO TARGETS TABLE
-- Organization-specific GEO optimization targets (similar to intelligence_targets)
-- Defines what queries/positioning each organization cares about

CREATE TABLE IF NOT EXISTS geo_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

  -- Service Lines / Specializations
  -- What services/capabilities the organization wants to be found for
  -- Examples for KARV: ["Crisis Communications", "Litigation PR", "Middle East Expertise"]
  service_lines TEXT[] DEFAULT '{}',

  -- Geographic Focus Areas
  -- Regions/markets where the organization operates or wants visibility
  -- Examples: ["Middle East", "GCC", "Dubai", "Saudi Arabia", "UAE"]
  geographic_focus TEXT[] DEFAULT '{}',

  -- Industry Verticals
  -- Industries the organization serves or operates in
  -- Examples: ["Financial Services", "Technology", "Energy", "Government"]
  industry_verticals TEXT[] DEFAULT '{}',

  -- Priority Queries (Custom High-Value Queries)
  -- Specific queries the organization wants to rank for
  -- Examples: ["crisis PR agency Middle East", "litigation communications UAE", "best PR firm Dubai"]
  priority_queries TEXT[] DEFAULT '{}',

  -- Competitor Set (GEO Benchmarking)
  -- Competitors to compare against in AI visibility
  -- Examples: ["Brunswick", "FTI Consulting", "Finsbury Glover Hering"]
  geo_competitors TEXT[] DEFAULT '{}',

  -- Query Types to Focus On
  -- What types of queries matter most (comparison, transactional, informational, etc.)
  -- Examples: ["comparison", "competitive", "research"]
  query_types TEXT[] DEFAULT '{comparison,competitive,transactional}',

  -- Target Platforms
  -- Which AI platforms to prioritize
  -- Examples: ["claude", "gemini", "chatgpt", "perplexity"]
  target_platforms TEXT[] DEFAULT '{claude,gemini,chatgpt,perplexity}',

  -- Positioning Goals (JSONB for flexibility)
  -- Strategic positioning statements the organization wants to achieve
  -- Example: {"crisis_comms": "Leading crisis communications firm in Middle East", "litigation": "Top litigation PR specialists"}
  positioning_goals JSONB DEFAULT '{}'::jsonb,

  -- Negative Keywords (to avoid)
  -- Terms/associations the organization wants to avoid
  -- Examples: ["cheap", "discount", "amateur"]
  negative_keywords TEXT[] DEFAULT '{}',

  -- Active/Inactive
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_reviewed_at TIMESTAMPTZ,

  -- Ensure one active config per organization
  CONSTRAINT unique_active_geo_targets_per_org UNIQUE (organization_id, active)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_geo_targets_org ON geo_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_geo_targets_active ON geo_targets(active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_geo_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER geo_targets_updated_at
  BEFORE UPDATE ON geo_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_geo_targets_updated_at();

-- RLS Policies - Very permissive to avoid access issues
ALTER TABLE geo_targets ENABLE ROW LEVEL SECURITY;

-- Grant all permissions to all roles
GRANT ALL ON TABLE geo_targets TO service_role;
GRANT ALL ON TABLE geo_targets TO postgres;
GRANT ALL ON TABLE geo_targets TO authenticated;
GRANT ALL ON TABLE geo_targets TO anon;

-- Super permissive policies - allow everything
CREATE POLICY "Allow all for service_role"
  ON geo_targets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users"
  ON geo_targets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon"
  ON geo_targets
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE geo_targets IS 'Organization-specific GEO optimization targets - defines what queries, positioning, and visibility goals matter for each organization';

-- Example data for KARV
-- INSERT INTO geo_targets (organization_id, service_lines, geographic_focus, industry_verticals, priority_queries, geo_competitors, positioning_goals)
-- VALUES (
--   'KARV_ORG_ID',
--   ARRAY['Crisis Communications', 'Litigation Communications', 'Financial Communications', 'Middle East Expertise', 'Reputation Management'],
--   ARRAY['Middle East', 'GCC', 'Dubai', 'UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait'],
--   ARRAY['Financial Services', 'Energy', 'Technology', 'Government', 'Real Estate'],
--   ARRAY[
--     'crisis PR agency Middle East',
--     'litigation communications UAE',
--     'best PR firm Dubai',
--     'crisis management consultant GCC',
--     'Middle East communications advisory',
--     'financial communications Dubai',
--     'reputation management UAE'
--   ],
--   ARRAY['Brunswick', 'FTI Consulting', 'Finsbury Glover Hering', 'Teneo', 'Edelman'],
--   '{"crisis_leadership": "Leading crisis communications firm in the Middle East", "litigation_expertise": "Top litigation and legal communications specialists in GCC", "regional_authority": "Premier strategic communications advisory in the Middle East"}'::jsonb
-- );
