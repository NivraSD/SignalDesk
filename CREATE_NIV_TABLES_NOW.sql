-- CRITICAL: Run this in Supabase SQL Editor to create the missing tables
-- This fixes the 404 errors for niv_conversations and niv_artifacts

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

-- Enable Row Level Security (RLS) - DISABLED FOR NOW TO SIMPLIFY TESTING
-- ALTER TABLE niv_artifacts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE niv_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE niv_workspace_edits ENABLE ROW LEVEL SECURITY;

-- Disable RLS for testing (allows all operations)
ALTER TABLE niv_artifacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_workspace_edits DISABLE ROW LEVEL SECURITY;

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
DROP TRIGGER IF EXISTS update_niv_artifacts_updated_at ON niv_artifacts;
CREATE TRIGGER update_niv_artifacts_updated_at 
  BEFORE UPDATE ON niv_artifacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for anonymous access (for testing)
GRANT ALL ON niv_artifacts TO anon;
GRANT ALL ON niv_conversations TO anon;
GRANT ALL ON niv_workspace_edits TO anon;
GRANT ALL ON niv_artifacts TO authenticated;
GRANT ALL ON niv_conversations TO authenticated;
GRANT ALL ON niv_workspace_edits TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ NIV TABLES CREATED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 IMPORTANT NEXT STEPS:';
  RAISE NOTICE '1. Go to Table Editor and verify tables exist';
  RAISE NOTICE '2. Go to Database > Replication';
  RAISE NOTICE '3. Enable replication for:';
  RAISE NOTICE '   - niv_conversations';
  RAISE NOTICE '   - niv_artifacts'; 
  RAISE NOTICE '   - niv_workspace_edits';
  RAISE NOTICE '4. Rebuild and redeploy the frontend';
END $$;