-- Niv Realtime Artifact System - Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS niv_workspace_edits CASCADE;
DROP TABLE IF EXISTS niv_conversations CASCADE;
DROP TABLE IF EXISTS niv_artifacts CASCADE;

-- Create artifacts table
CREATE TABLE niv_artifacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  mcp_sources TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE niv_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mcps_used TEXT[] DEFAULT '{}',
  artifact_id UUID REFERENCES niv_artifacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace edits table for tracking changes
CREATE TABLE niv_workspace_edits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artifact_id UUID REFERENCES niv_artifacts(id) ON DELETE CASCADE,
  user_id TEXT,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_artifacts_session ON niv_artifacts(session_id);
CREATE INDEX idx_artifacts_user ON niv_artifacts(user_id);
CREATE INDEX idx_artifacts_created ON niv_artifacts(created_at DESC);
CREATE INDEX idx_conversations_session ON niv_conversations(session_id);
CREATE INDEX idx_conversations_created ON niv_conversations(created_at);
CREATE INDEX idx_workspace_edits_artifact ON niv_workspace_edits(artifact_id);

-- Enable Row Level Security (RLS)
ALTER TABLE niv_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_workspace_edits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth strategy)
-- Allow authenticated users to read their own artifacts
CREATE POLICY "Users can read own artifacts" ON niv_artifacts
  FOR SELECT
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Allow authenticated users to create artifacts
CREATE POLICY "Users can create artifacts" ON niv_artifacts
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Allow authenticated users to update their own artifacts
CREATE POLICY "Users can update own artifacts" ON niv_artifacts
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Allow all authenticated users to read conversations (for now)
CREATE POLICY "Users can read conversations" ON niv_conversations
  FOR SELECT
  USING (TRUE);

-- Allow all authenticated users to create conversations
CREATE POLICY "Users can create conversations" ON niv_conversations
  FOR INSERT
  WITH CHECK (TRUE);

-- Allow users to read workspace edits for artifacts they can access
CREATE POLICY "Users can read workspace edits" ON niv_workspace_edits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM niv_artifacts 
      WHERE niv_artifacts.id = niv_workspace_edits.artifact_id 
      AND (niv_artifacts.user_id = auth.uid()::TEXT OR niv_artifacts.user_id IS NULL)
    )
  );

-- Allow users to create workspace edits for artifacts they can access
CREATE POLICY "Users can create workspace edits" ON niv_workspace_edits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM niv_artifacts 
      WHERE niv_artifacts.id = niv_workspace_edits.artifact_id 
      AND (niv_artifacts.user_id = auth.uid()::TEXT OR niv_artifacts.user_id IS NULL)
    )
  );

-- Enable Realtime for all tables
ALTER TABLE niv_artifacts REPLICA IDENTITY FULL;
ALTER TABLE niv_conversations REPLICA IDENTITY FULL;
ALTER TABLE niv_workspace_edits REPLICA IDENTITY FULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_niv_artifacts_updated_at 
  BEFORE UPDATE ON niv_artifacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for session summaries (optional but useful)
CREATE OR REPLACE VIEW niv_session_summary AS
SELECT 
  session_id,
  COUNT(DISTINCT CASE WHEN role = 'user' THEN id END) as user_messages,
  COUNT(DISTINCT CASE WHEN role = 'assistant' THEN id END) as assistant_messages,
  COUNT(DISTINCT artifact_id) as artifacts_created,
  ARRAY_AGG(DISTINCT unnest(mcps_used)) as mcps_used,
  MIN(created_at) as session_start,
  MAX(created_at) as last_activity
FROM niv_conversations
GROUP BY session_id;

-- Grant necessary permissions for the view
GRANT SELECT ON niv_session_summary TO authenticated;
GRANT SELECT ON niv_session_summary TO anon;

-- Create function to clean up old sessions (optional)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  -- Delete sessions older than 30 days with no artifacts
  DELETE FROM niv_conversations 
  WHERE session_id IN (
    SELECT session_id 
    FROM niv_conversations 
    WHERE created_at < NOW() - INTERVAL '30 days'
    GROUP BY session_id
    HAVING COUNT(DISTINCT artifact_id) = 0
  );
  
  -- Archive artifacts older than 90 days
  UPDATE niv_artifacts 
  SET status = 'archived' 
  WHERE created_at < NOW() - INTERVAL '90 days' 
  AND status = 'draft';
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Niv Realtime tables created successfully!';
  RAISE NOTICE 'Remember to:';
  RAISE NOTICE '1. Enable Realtime in Supabase Dashboard for these tables';
  RAISE NOTICE '2. Set up authentication if using RLS';
  RAISE NOTICE '3. Add service role key to your edge function';
END $$;