-- Campaign Execution Items Table
-- Stores individual content items from blueprint execution inventory

-- Drop existing table if it exists (to handle schema changes)
DROP TABLE IF EXISTS campaign_execution_items CASCADE;

CREATE TABLE campaign_execution_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  session_id UUID REFERENCES campaign_builder_sessions(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,

  -- Stakeholder Info
  stakeholder_name TEXT NOT NULL,
  stakeholder_priority INTEGER NOT NULL CHECK (stakeholder_priority BETWEEN 1 AND 4),

  -- Lever Info
  lever_name TEXT NOT NULL,
  lever_priority INTEGER NOT NULL CHECK (lever_priority BETWEEN 1 AND 4),

  -- Content Details
  content_type TEXT NOT NULL CHECK (content_type IN ('media_pitch', 'social_post', 'thought_leadership', 'user_action')),
  topic TEXT NOT NULL,
  target TEXT,
  details JSONB,

  -- Execution Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'published', 'failed')),

  -- Generated Content
  generated_content TEXT,
  generation_error TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_execution_items_session ON campaign_execution_items(session_id);
CREATE INDEX idx_execution_items_org ON campaign_execution_items(organization_id);
CREATE INDEX idx_execution_items_stakeholder_priority ON campaign_execution_items(stakeholder_priority);
CREATE INDEX idx_execution_items_status ON campaign_execution_items(status);

-- RLS Policies
ALTER TABLE campaign_execution_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access all execution items
-- Application-level filtering by org_id handles multi-tenancy
CREATE POLICY "Authenticated users can view execution items"
  ON campaign_execution_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert execution items"
  ON campaign_execution_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update execution items"
  ON campaign_execution_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete execution items"
  ON campaign_execution_items FOR DELETE
  TO authenticated
  USING (true);

-- Service role bypass (for edge functions with anon key)
CREATE POLICY "Service role has full access to execution items"
  ON campaign_execution_items FOR ALL
  TO service_role
  USING (true);

-- Anon access (for unauthenticated edge function calls)
CREATE POLICY "Anon can access execution items"
  ON campaign_execution_items FOR ALL
  TO anon
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_execution_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_execution_items_timestamp
  BEFORE UPDATE ON campaign_execution_items
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_execution_items_updated_at();
