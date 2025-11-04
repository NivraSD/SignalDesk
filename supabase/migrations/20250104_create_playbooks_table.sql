-- Create playbooks table for Memory Vault intelligence system
-- Playbooks are pre-synthesized guides for content creation

CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Identification
  content_type TEXT NOT NULL,  -- "media-pitch", "thought-leadership", etc.
  topic TEXT NOT NULL,         -- "energy", "aviation", "general"

  -- The playbook data (JSONB for flexibility)
  playbook JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,

  -- Unique constraint: one playbook per org + type + topic
  CONSTRAINT unique_playbook UNIQUE(organization_id, content_type, topic)
);

-- Index for fast lookups
CREATE INDEX idx_playbooks_org_type_topic
  ON playbooks(organization_id, content_type, topic);

-- Index for finding stale playbooks (for background refresh)
CREATE INDEX idx_playbooks_updated_at
  ON playbooks(updated_at);

-- Enable Row Level Security
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access (used by edge functions)
CREATE POLICY "Service role has full access"
  ON playbooks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can view all playbooks for now
-- TODO: Add proper org-level security when user_organizations table exists
CREATE POLICY "Authenticated users can view playbooks"
  ON playbooks
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment explaining the table
COMMENT ON TABLE playbooks IS 'Pre-synthesized content creation guides based on past successful patterns. Used by NIV Content for intelligent context without expensive real-time analysis.';

COMMENT ON COLUMN playbooks.playbook IS 'JSONB containing guidance, proven_hooks, brand_voice, proven_structure, success_patterns, audience, top_performers, and company_context';

COMMENT ON COLUMN playbooks.content_type IS 'Type of content this playbook guides: media-pitch, thought-leadership, press-release, social-post, etc.';

COMMENT ON COLUMN playbooks.topic IS 'Topic area: energy, aviation, technology, finance, general, etc.';

COMMENT ON COLUMN playbooks.version IS 'Playbook version number. Increments when regenerated with new data.';
