-- =====================================================
-- VECTOR Campaign Builder Database Schema
-- Phase 1: Core tables for campaign building workflow
-- =====================================================

-- Table: campaign_builder_sessions
-- Stores active campaign building sessions with conversation history
CREATE TABLE IF NOT EXISTS campaign_builder_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  user_id text,

  -- Session State
  current_stage text NOT NULL CHECK (current_stage IN ('intent', 'research', 'positioning', 'approach', 'blueprint', 'execution')),
  status text NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',

  -- Campaign Data
  campaign_goal text NOT NULL,
  research_findings jsonb,
  selected_positioning jsonb,
  selected_approach text CHECK (selected_approach IN ('PR_CAMPAIGN', 'VECTOR_CAMPAIGN')),
  blueprint jsonb,

  -- Conversation History
  conversation_history jsonb DEFAULT '[]'::jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for campaign_builder_sessions
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_org ON campaign_builder_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_status ON campaign_builder_sessions(status);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_stage ON campaign_builder_sessions(current_stage);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_created ON campaign_builder_sessions(created_at DESC);

-- Table: campaign_blueprints
-- Stores finalized campaign blueprints (both PR and VECTOR)
CREATE TABLE IF NOT EXISTS campaign_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES campaign_builder_sessions(id) ON DELETE SET NULL,
  org_id text NOT NULL,

  -- Blueprint Type
  campaign_type text NOT NULL CHECK (campaign_type IN ('PR_CAMPAIGN', 'VECTOR_CAMPAIGN')),
  pattern_used text, -- For VECTOR campaigns: CASCADE, MIRROR, CHORUS, TROJAN, NETWORK

  -- Core Data
  positioning text NOT NULL,
  blueprint_data jsonb NOT NULL,
  research_data jsonb NOT NULL,

  -- Metadata for Learning & Search
  goal_category text,
  industry text,
  stakeholder_groups text[],
  timeline_weeks integer,

  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_execution', 'completed')),

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for campaign_blueprints
CREATE INDEX IF NOT EXISTS idx_blueprints_org ON campaign_blueprints(org_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_type ON campaign_blueprints(campaign_type);
CREATE INDEX IF NOT EXISTS idx_blueprints_industry ON campaign_blueprints(industry);
CREATE INDEX IF NOT EXISTS idx_blueprints_pattern ON campaign_blueprints(pattern_used);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON campaign_blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprints_created ON campaign_blueprints(created_at DESC);

-- Table: campaign_content
-- Stores generated content pieces with rich context
CREATE TABLE IF NOT EXISTS campaign_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id uuid REFERENCES campaign_blueprints(id) ON DELETE CASCADE,
  org_id text NOT NULL,

  -- Content Details
  content_type text NOT NULL, -- 'press_release', 'social_post', 'media_pitch', 'blog_post', etc.
  target_stakeholder text,
  phase text CHECK (phase IN ('awareness', 'consideration', 'conversion', 'advocacy')),
  channel text,

  -- Content
  content_data text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Context Used for Generation (for learning)
  generation_context jsonb,

  -- Performance Tracking
  performance_metrics jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for campaign_content
CREATE INDEX IF NOT EXISTS idx_content_blueprint ON campaign_content(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_content_org ON campaign_content(org_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON campaign_content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_phase ON campaign_content(phase);
CREATE INDEX IF NOT EXISTS idx_content_stakeholder ON campaign_content(target_stakeholder);

-- Table: campaign_research_cache
-- Cache research results to avoid redundant API calls
CREATE TABLE IF NOT EXISTS campaign_research_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  org_id text NOT NULL,

  -- Cached Data
  research_type text NOT NULL, -- 'stakeholder', 'narrative', 'channel', 'historical', 'competitive'
  research_data jsonb NOT NULL,

  -- Cache Metadata
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for campaign_research_cache
CREATE INDEX IF NOT EXISTS idx_research_cache_key ON campaign_research_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_research_cache_org ON campaign_research_cache(org_id);
CREATE INDEX IF NOT EXISTS idx_research_cache_expires ON campaign_research_cache(expires_at);

-- Auto-cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_research_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM campaign_research_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_campaign_sessions_updated_at
  BEFORE UPDATE ON campaign_builder_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_blueprints_updated_at
  BEFORE UPDATE ON campaign_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_content_updated_at
  BEFORE UPDATE ON campaign_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE campaign_builder_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_research_cache ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_builder_sessions
CREATE POLICY "Users can view their org's sessions"
  ON campaign_builder_sessions FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can create sessions for their org"
  ON campaign_builder_sessions FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can update their org's sessions"
  ON campaign_builder_sessions FOR UPDATE
  USING (org_id = current_setting('app.current_org_id', true));

-- Policies for campaign_blueprints
CREATE POLICY "Users can view their org's blueprints"
  ON campaign_blueprints FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can create blueprints for their org"
  ON campaign_blueprints FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can update their org's blueprints"
  ON campaign_blueprints FOR UPDATE
  USING (org_id = current_setting('app.current_org_id', true));

-- Policies for campaign_content
CREATE POLICY "Users can view their org's content"
  ON campaign_content FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can create content for their org"
  ON campaign_content FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can update their org's content"
  ON campaign_content FOR UPDATE
  USING (org_id = current_setting('app.current_org_id', true));

-- Policies for campaign_research_cache
CREATE POLICY "Users can view their org's research cache"
  ON campaign_research_cache FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can manage their org's research cache"
  ON campaign_research_cache FOR ALL
  USING (org_id = current_setting('app.current_org_id', true));

-- Service role bypass (for edge functions)
CREATE POLICY "Service role has full access to sessions"
  ON campaign_builder_sessions FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to blueprints"
  ON campaign_blueprints FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to content"
  ON campaign_content FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role has full access to research cache"
  ON campaign_research_cache FOR ALL
  TO service_role
  USING (true);

-- =====================================================
-- Helpful Views
-- =====================================================

-- View: Active campaign sessions with summary
CREATE OR REPLACE VIEW active_campaign_sessions AS
SELECT
  s.id,
  s.org_id,
  s.current_stage,
  s.campaign_goal,
  s.selected_approach,
  s.created_at,
  s.updated_at,
  jsonb_array_length(s.conversation_history) as message_count,
  CASE
    WHEN s.selected_approach = 'VECTOR_CAMPAIGN' THEN b.pattern_used
    ELSE NULL
  END as pattern
FROM campaign_builder_sessions s
LEFT JOIN campaign_blueprints b ON b.session_id = s.id
WHERE s.status = 'active'
ORDER BY s.updated_at DESC;

-- View: Blueprint analytics
CREATE OR REPLACE VIEW campaign_blueprint_analytics AS
SELECT
  org_id,
  campaign_type,
  pattern_used,
  industry,
  COUNT(*) as total_blueprints,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  AVG(timeline_weeks) as avg_timeline_weeks,
  array_agg(DISTINCT unnest(stakeholder_groups)) as all_stakeholder_types
FROM campaign_blueprints
GROUP BY org_id, campaign_type, pattern_used, industry;

-- =====================================================
-- Initial Data / Seed
-- =====================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Campaign Builder tables created successfully';
  RAISE NOTICE 'Tables: campaign_builder_sessions, campaign_blueprints, campaign_content, campaign_research_cache';
  RAISE NOTICE 'Views: active_campaign_sessions, campaign_blueprint_analytics';
END $$;
