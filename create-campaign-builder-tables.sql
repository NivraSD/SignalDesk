-- Create Campaign Builder Tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create campaign_builder_sessions table
CREATE TABLE IF NOT EXISTS campaign_builder_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  user_id text,

  -- Session State
  current_stage text NOT NULL, -- 'intent', 'research', 'positioning', 'approach', 'blueprint', 'execution'
  status text NOT NULL, -- 'active', 'completed', 'abandoned'

  -- Campaign Data
  campaign_goal text NOT NULL,
  research_findings jsonb,
  selected_positioning jsonb,
  selected_approach text, -- 'PR_CAMPAIGN' or 'VECTOR_CAMPAIGN'
  blueprint jsonb,

  -- Conversation
  conversation_history jsonb DEFAULT '[]'::jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create campaign_blueprints table
CREATE TABLE IF NOT EXISTS campaign_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES campaign_builder_sessions(id),
  org_id text NOT NULL,

  -- Blueprint Type
  campaign_type text NOT NULL, -- 'PR_CAMPAIGN' or 'VECTOR_CAMPAIGN'
  pattern_used text, -- For VECTOR campaigns

  -- Core Data
  positioning text NOT NULL,
  blueprint_data jsonb NOT NULL,
  research_data jsonb NOT NULL,

  -- Metadata for Learning
  goal_category text,
  industry text,
  stakeholder_groups text[],
  timeline_weeks integer,

  -- Status
  status text DEFAULT 'draft', -- 'draft', 'approved', 'in_execution', 'completed'

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_content table
CREATE TABLE IF NOT EXISTS campaign_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id uuid REFERENCES campaign_blueprints(id),
  org_id text NOT NULL,

  -- Content Details
  content_type text NOT NULL, -- 'press_release', 'social_post', 'media_pitch', etc.
  target_stakeholder text,
  phase text, -- 'awareness', 'consideration', 'conversion', 'advocacy'
  channel text,

  -- Content
  content_data text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Context Used for Generation
  generation_context jsonb,

  -- Performance Tracking
  performance_metrics jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_org ON campaign_builder_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_status ON campaign_builder_sessions(status);

CREATE INDEX IF NOT EXISTS idx_blueprints_org ON campaign_blueprints(org_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_type ON campaign_blueprints(campaign_type);
CREATE INDEX IF NOT EXISTS idx_blueprints_industry ON campaign_blueprints(industry);

CREATE INDEX IF NOT EXISTS idx_content_blueprint ON campaign_content(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_content_org ON campaign_content(org_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON campaign_content(content_type);

-- Enable RLS (Row Level Security)
ALTER TABLE campaign_builder_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaign_builder_sessions
CREATE POLICY "Users can view their org's sessions"
  ON campaign_builder_sessions FOR SELECT
  USING (true); -- Adjust based on your auth strategy

CREATE POLICY "Users can insert their org's sessions"
  ON campaign_builder_sessions FOR INSERT
  WITH CHECK (true); -- Adjust based on your auth strategy

CREATE POLICY "Users can update their org's sessions"
  ON campaign_builder_sessions FOR UPDATE
  USING (true); -- Adjust based on your auth strategy

-- Create RLS policies for campaign_blueprints
CREATE POLICY "Users can view their org's blueprints"
  ON campaign_blueprints FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their org's blueprints"
  ON campaign_blueprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their org's blueprints"
  ON campaign_blueprints FOR UPDATE
  USING (true);

-- Create RLS policies for campaign_content
CREATE POLICY "Users can view their org's content"
  ON campaign_content FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their org's content"
  ON campaign_content FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their org's content"
  ON campaign_content FOR UPDATE
  USING (true);

-- Grant permissions to service role
GRANT ALL ON campaign_builder_sessions TO service_role;
GRANT ALL ON campaign_blueprints TO service_role;
GRANT ALL ON campaign_content TO service_role;

-- Grant permissions to authenticated users
GRANT ALL ON campaign_builder_sessions TO authenticated;
GRANT ALL ON campaign_blueprints TO authenticated;
GRANT ALL ON campaign_content TO authenticated;

-- Grant permissions to anon role for reading
GRANT SELECT ON campaign_builder_sessions TO anon;
GRANT SELECT ON campaign_blueprints TO anon;
GRANT SELECT ON campaign_content TO anon;
