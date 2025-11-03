-- GEO-VECTOR Content Type Selections Table
-- Stores the selected content types for each GEO campaign

CREATE TABLE IF NOT EXISTS geo_content_selections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  user_id TEXT,

  -- Selection criteria
  objective VARCHAR(50) NOT NULL CHECK (objective IN ('drive_sales', 'thought_leadership', 'technical_adoption')),
  industry TEXT,

  -- Selected content types
  automated_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_assisted_types JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Projections
  expected_impact TEXT,
  time_investment TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_geo_content_selections_session ON geo_content_selections(session_id);
CREATE INDEX idx_geo_content_selections_org ON geo_content_selections(organization_id);
CREATE INDEX idx_geo_content_selections_objective ON geo_content_selections(objective);
CREATE INDEX idx_geo_content_selections_updated ON geo_content_selections(updated_at DESC);

-- Comments
COMMENT ON TABLE geo_content_selections IS 'Stores selected content types for GEO-VECTOR campaigns based on objective and constraints';
COMMENT ON COLUMN geo_content_selections.objective IS 'Campaign objective: drive_sales, thought_leadership, or technical_adoption';
COMMENT ON COLUMN geo_content_selections.automated_types IS 'Array of automated content types SignalDesk will generate';
COMMENT ON COLUMN geo_content_selections.user_assisted_types IS 'Array of user-assisted content types SignalDesk will provide scripts/content for';
COMMENT ON COLUMN geo_content_selections.expected_impact IS 'Projected visibility increase (e.g., "35-50% visibility increase in 8-12 weeks")';
COMMENT ON COLUMN geo_content_selections.time_investment IS 'Required user time investment for user-assisted content';
COMMENT ON COLUMN geo_content_selections.recommendations IS 'Array of recommendations for future improvements';
