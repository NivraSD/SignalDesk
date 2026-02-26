-- Crisis Management Tables
-- Created: October 3, 2025
-- Purpose: Support Crisis Command Center functionality

-- =============================================
-- CRISIS EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- Crisis Details
  crisis_type TEXT NOT NULL, -- data_breach, product_recall, executive_scandal, financial_crisis, environmental_incident, safety_incident, legal_issues, regulatory_investigation, social_media_crisis, natural_disaster
  severity TEXT NOT NULL, -- low, medium, high, critical
  status TEXT NOT NULL, -- monitoring, active, resolved
  title TEXT NOT NULL,
  description TEXT,

  -- Timeline
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Auto-calculated on resolve

  -- Documentation (JSONB arrays for flexibility)
  timeline JSONB DEFAULT '[]'::jsonb, -- [{time, type, content, actor}]
  decisions JSONB DEFAULT '[]'::jsonb, -- [{time, decision, rationale, actor}]
  communications JSONB DEFAULT '[]'::jsonb, -- [{time, stakeholder, content, status}]
  ai_interactions JSONB DEFAULT '[]'::jsonb, -- [{time, user_msg, ai_response}]

  -- Team Management
  team_status JSONB DEFAULT '{}'::jsonb, -- {user_id: {status, role, tasks, contact}}
  tasks JSONB DEFAULT '[]'::jsonb, -- [{id, title, assignee, status, deadline, completed_at}]

  -- Context & Triggers
  trigger_source TEXT, -- social_spike, observer_alert, manual, opportunity_detector
  trigger_data JSONB, -- Source data (social signals, observer change, etc.)
  crisis_plan_id UUID, -- Reference to crisis plan in content_library

  -- Metrics & Monitoring
  social_signals JSONB DEFAULT '[]'::jsonb, -- Social signals during crisis
  media_coverage JSONB DEFAULT '[]'::jsonb, -- Media coverage tracked
  stakeholder_sentiment JSONB DEFAULT '{}'::jsonb, -- {employees: score, investors: score, etc.}

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crisis_events
CREATE INDEX IF NOT EXISTS idx_crisis_events_org ON crisis_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_crisis_events_status ON crisis_events(status);
CREATE INDEX IF NOT EXISTS idx_crisis_events_severity ON crisis_events(severity);
CREATE INDEX IF NOT EXISTS idx_crisis_events_started ON crisis_events(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_events_trigger ON crisis_events(trigger_source);

-- =============================================
-- CRISIS COMMUNICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS crisis_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crisis_event_id UUID REFERENCES crisis_events(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,

  -- Communication Details
  stakeholder_type TEXT NOT NULL, -- employees, media, investors, customers, regulators, partners, government
  stakeholder_name TEXT, -- Specific person/outlet if applicable
  subject TEXT,
  content TEXT NOT NULL,

  -- Status & Workflow
  status TEXT NOT NULL, -- draft, approved, sent, responded, archived
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_via TEXT, -- email, phone, social, press_release, internal_memo, meeting

  -- Response Tracking
  response_received BOOLEAN DEFAULT false,
  response_content TEXT,
  response_at TIMESTAMPTZ,
  response_sentiment TEXT, -- positive, neutral, negative

  -- Version Control
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES crisis_communications(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for crisis_communications
CREATE INDEX IF NOT EXISTS idx_crisis_comms_event ON crisis_communications(crisis_event_id);
CREATE INDEX IF NOT EXISTS idx_crisis_comms_org ON crisis_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_crisis_comms_status ON crisis_communications(status);
CREATE INDEX IF NOT EXISTS idx_crisis_comms_stakeholder ON crisis_communications(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_crisis_comms_sent ON crisis_communications(sent_at DESC);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crisis_events_updated_at BEFORE UPDATE ON crisis_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crisis_communications_updated_at BEFORE UPDATE ON crisis_communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate duration when crisis is resolved
CREATE OR REPLACE FUNCTION calculate_crisis_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_crisis_duration_trigger BEFORE UPDATE ON crisis_events
  FOR EACH ROW EXECUTE FUNCTION calculate_crisis_duration();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on crisis_events
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view crisis events
CREATE POLICY "Users can view crisis events" ON crisis_events
  FOR SELECT
  USING (true);

-- Allow all authenticated users to insert crisis events
CREATE POLICY "Users can create crisis events" ON crisis_events
  FOR INSERT
  WITH CHECK (true);

-- Allow all authenticated users to update crisis events
CREATE POLICY "Users can update crisis events" ON crisis_events
  FOR UPDATE
  USING (true);

-- Allow all authenticated users to delete crisis events
CREATE POLICY "Users can delete crisis events" ON crisis_events
  FOR DELETE
  USING (true);

-- Enable RLS on crisis_communications
ALTER TABLE crisis_communications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view crisis communications
CREATE POLICY "Users can view crisis communications" ON crisis_communications
  FOR SELECT
  USING (true);

-- Allow all authenticated users to insert crisis communications
CREATE POLICY "Users can create crisis communications" ON crisis_communications
  FOR INSERT
  WITH CHECK (true);

-- Allow all authenticated users to update crisis communications
CREATE POLICY "Users can update crisis communications" ON crisis_communications
  FOR UPDATE
  USING (true);

-- Allow all authenticated users to delete crisis communications
CREATE POLICY "Users can delete crisis communications" ON crisis_communications
  FOR DELETE
  USING (true);

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE crisis_events IS 'Stores crisis events with timeline, team, and documentation';
COMMENT ON TABLE crisis_communications IS 'Stakeholder communications during crisis with approval workflow';
COMMENT ON COLUMN crisis_events.timeline IS 'Chronological event log: [{time, type, content, actor}]';
COMMENT ON COLUMN crisis_events.decisions IS 'Major decisions with rationale: [{time, decision, rationale, actor}]';
COMMENT ON COLUMN crisis_events.ai_interactions IS 'AI assistant chat history: [{time, user_msg, ai_response}]';
COMMENT ON COLUMN crisis_events.team_status IS 'Team member status and roles: {user_id: {status, role, contact}}';
COMMENT ON COLUMN crisis_events.tasks IS 'Crisis tasks: [{id, title, assignee, status, deadline}]';
