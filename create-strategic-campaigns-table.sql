-- Strategic Campaigns Table: Beautiful, organized campaign data
-- This replaces "boring files" with a structured, queryable campaign system

CREATE TABLE IF NOT EXISTS strategic_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  blueprint_id UUID REFERENCES campaign_builder_sessions(id) ON DELETE CASCADE,

  -- Core campaign info
  campaign_name TEXT NOT NULL,
  campaign_goal TEXT,
  industry TEXT,
  positioning TEXT,
  core_narrative TEXT,

  -- Timeline
  start_date DATE,
  end_date DATE,
  timeline JSONB DEFAULT '{}'::jsonb,

  -- Blueprint data (full strategic context)
  blueprint JSONB NOT NULL,

  -- Organized phase data
  phases JSONB DEFAULT '[]'::jsonb,
  -- Structure:
  -- [
  --   {
  --     "phase": "awareness",
  --     "phaseNumber": 1,
  --     "startDate": "2025-01-15",
  --     "endDate": "2025-02-15",
  --     "status": "planned|in-progress|completed",
  --     "objective": "...",
  --     "narrative": "...",
  --     "keyMessages": ["...", "..."],
  --     "content": [
  --       {
  --         "id": "uuid",
  --         "type": "blog-post",
  --         "stakeholder": "Aspiring Entrepreneurs",
  --         "brief": "Strategic brief...",
  --         "content": "Full content...",
  --         "status": "draft|approved|published",
  --         "folder": "campaigns/.../phase-1-awareness",
  --         "generatedAt": "2025-01-15T10:00:00Z",
  --         "performance": {
  --           "views": 1234,
  --           "engagement": 45,
  --           "conversions": 12
  --         }
  --       }
  --     ]
  --   }
  -- ]

  -- Requirements and dependencies
  requirements JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "resources": ["Designer", "Video editor", "Budget: $10k"],
  --   "dependencies": ["Q4 product launch", "CEO approval"],
  --   "approvals": ["CMO", "Legal", "Brand team"]
  -- }

  -- Campaign summary (synthesized intelligence)
  campaign_summary JSONB,

  -- Research and insights
  research_insights JSONB DEFAULT '[]'::jsonb,
  key_messages JSONB DEFAULT '[]'::jsonb,
  target_stakeholders JSONB DEFAULT '[]'::jsonb,

  -- Campaign metadata
  architecture TEXT, -- 'VECTOR_CAMPAIGN', 'SPECTRUM', etc
  status TEXT DEFAULT 'planning',
  -- Status values: planning, in-progress, paused, completed, archived

  -- Performance tracking
  total_content_pieces INTEGER DEFAULT 0,
  phases_completed INTEGER DEFAULT 0,
  overall_performance JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Indexes for performance
  CONSTRAINT strategic_campaigns_organization_id_fkey
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_strategic_campaigns_org ON strategic_campaigns(organization_id);
CREATE INDEX idx_strategic_campaigns_blueprint ON strategic_campaigns(blueprint_id);
CREATE INDEX idx_strategic_campaigns_status ON strategic_campaigns(status);
CREATE INDEX idx_strategic_campaigns_dates ON strategic_campaigns(start_date, end_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_strategic_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER strategic_campaigns_updated_at
BEFORE UPDATE ON strategic_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_strategic_campaigns_updated_at();

-- Enable RLS
ALTER TABLE strategic_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- For now, allow all authenticated users to access (you can refine this later based on your auth setup)
CREATE POLICY "Authenticated users can view strategic campaigns"
ON strategic_campaigns FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create strategic campaigns"
ON strategic_campaigns FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update strategic campaigns"
ON strategic_campaigns FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete strategic campaigns"
ON strategic_campaigns FOR DELETE
USING (auth.role() = 'authenticated');

-- Service role can do everything
CREATE POLICY "Service role can manage all strategic campaigns"
ON strategic_campaigns FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE strategic_campaigns IS 'Organized, queryable campaign data with beautiful structure. Replaces "boring files" with strategic planning system.';
