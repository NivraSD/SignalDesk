-- Fix Campaign Builder Table Permissions
-- This grants the anon role full access to campaign builder tables

-- Grant table permissions to anon role
GRANT ALL ON campaign_builder_sessions TO anon;
GRANT ALL ON campaign_blueprints TO anon;
GRANT ALL ON campaign_content TO anon;

-- Update RLS policies to allow anon access
-- These policies were too restrictive before

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their org's sessions" ON campaign_builder_sessions;
DROP POLICY IF EXISTS "Users can insert their org's sessions" ON campaign_builder_sessions;
DROP POLICY IF EXISTS "Users can update their org's sessions" ON campaign_builder_sessions;

DROP POLICY IF EXISTS "Users can view their org's blueprints" ON campaign_blueprints;
DROP POLICY IF EXISTS "Users can insert their org's blueprints" ON campaign_blueprints;
DROP POLICY IF EXISTS "Users can update their org's blueprints" ON campaign_blueprints;

DROP POLICY IF EXISTS "Users can view their org's content" ON campaign_content;
DROP POLICY IF EXISTS "Users can insert their org's content" ON campaign_content;
DROP POLICY IF EXISTS "Users can update their org's content" ON campaign_content;

-- Create permissive policies for anon role
CREATE POLICY "Allow all for campaign_builder_sessions"
  ON campaign_builder_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for campaign_blueprints"
  ON campaign_blueprints
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for campaign_content"
  ON campaign_content
  FOR ALL
  USING (true)
  WITH CHECK (true);
