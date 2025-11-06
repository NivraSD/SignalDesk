-- Strategic Planning Items Table
-- Stores execution tasks from campaign blueprints
-- Separate from content_library to avoid mixing pending tasks with executed content

CREATE TABLE IF NOT EXISTS strategic_planning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign Context
  session_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL, -- 'VECTOR_CAMPAIGN', 'GEO_VECTOR', etc.

  -- Item Details
  content_type TEXT NOT NULL, -- 'media_pitch', 'social_post', 'thought_leadership', 'geo_schema_update', etc.
  title TEXT NOT NULL,
  description TEXT,

  -- Blueprint Context
  stakeholder TEXT NOT NULL,
  stakeholder_priority INTEGER NOT NULL DEFAULT 1,
  lever_name TEXT NOT NULL,
  lever_priority INTEGER NOT NULL DEFAULT 1,
  target_audience TEXT,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'executing', 'generated', 'failed', 'published'

  -- Generation/Execution Results
  generated_content TEXT, -- Actual generated content (for content types)
  generated_at TIMESTAMPTZ,
  generation_error TEXT,

  -- Schema Execution Results (for geo_schema_update type)
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  execution_result JSONB, -- Schema update results

  -- Metadata
  details JSONB NOT NULL DEFAULT '{}', -- Full details from blueprint (pitch.what, post.platform, schema data, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategic_planning_items_session ON strategic_planning_items(session_id);
CREATE INDEX IF NOT EXISTS idx_strategic_planning_items_org ON strategic_planning_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_strategic_planning_items_status ON strategic_planning_items(status);
CREATE INDEX IF NOT EXISTS idx_strategic_planning_items_type ON strategic_planning_items(content_type);

-- RLS Policies - Disabled for now to avoid auth issues
-- Can be enabled later with proper organization-based policies
-- ALTER TABLE strategic_planning_items ENABLE ROW LEVEL SECURITY;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_strategic_planning_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_strategic_planning_items_updated_at
  BEFORE UPDATE ON strategic_planning_items
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_planning_items_updated_at();

-- Comments
COMMENT ON TABLE strategic_planning_items IS 'Strategic Planning execution tasks from campaign blueprints - separate from Memory Vault to avoid mixing pending tasks with executed content';
COMMENT ON COLUMN strategic_planning_items.session_id IS 'Links to campaign_sessions for blueprint context';
COMMENT ON COLUMN strategic_planning_items.content_type IS 'Type of tactical item: media_pitch, social_post, thought_leadership, geo_schema_update, etc.';
COMMENT ON COLUMN strategic_planning_items.status IS 'Execution status: pending (not started), executing (in progress), generated (completed), failed (error), published (pushed to Memory Vault)';
COMMENT ON COLUMN strategic_planning_items.generated_content IS 'The actual generated content for content types (media pitches, social posts, etc.)';
COMMENT ON COLUMN strategic_planning_items.executed IS 'True if schema update has been executed (only for geo_schema_update type)';
COMMENT ON COLUMN strategic_planning_items.execution_result IS 'Schema update results including schema_id, changes applied, before/after values';
COMMENT ON COLUMN strategic_planning_items.details IS 'Full blueprint details: pitch.what/who/where/why, post.platform/hook, schema.schemaType/implementation, etc.';
