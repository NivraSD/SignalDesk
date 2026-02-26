-- SAFE VERSION: Creates tables only if they don't exist
-- No data will be lost - this script checks before creating

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create artifacts table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS niv_artifacts (
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

-- Create conversations table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS niv_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mcps_used TEXT[] DEFAULT '{}',
  artifact_id UUID REFERENCES niv_artifacts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace edits table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS niv_workspace_edits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artifact_id UUID REFERENCES niv_artifacts(id) ON DELETE CASCADE,
  user_id TEXT,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_artifacts_session ON niv_artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_user ON niv_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_created ON niv_artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON niv_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON niv_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_workspace_edits_artifact ON niv_workspace_edits(artifact_id);

-- Disable RLS for testing (won't error if already disabled)
ALTER TABLE niv_artifacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_workspace_edits DISABLE ROW LEVEL SECURITY;

-- Enable Realtime
ALTER TABLE niv_artifacts REPLICA IDENTITY FULL;
ALTER TABLE niv_conversations REPLICA IDENTITY FULL;
ALTER TABLE niv_workspace_edits REPLICA IDENTITY FULL;

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_niv_artifacts_updated_at ON niv_artifacts;
CREATE TRIGGER update_niv_artifacts_updated_at 
  BEFORE UPDATE ON niv_artifacts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON niv_artifacts TO anon;
GRANT ALL ON niv_conversations TO anon;
GRANT ALL ON niv_workspace_edits TO anon;
GRANT ALL ON niv_artifacts TO authenticated;
GRANT ALL ON niv_conversations TO authenticated;
GRANT ALL ON niv_workspace_edits TO authenticated;

-- Check if tables were created successfully
DO $$
DECLARE
  artifacts_exists boolean;
  conversations_exists boolean;
  edits_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'niv_artifacts'
  ) INTO artifacts_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'niv_conversations'
  ) INTO conversations_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'niv_workspace_edits'
  ) INTO edits_exists;
  
  IF artifacts_exists AND conversations_exists AND edits_exists THEN
    RAISE NOTICE '✅ SUCCESS: All NIV tables are now available!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Go to Database > Replication';
    RAISE NOTICE '2. Enable replication for these 3 tables:';
    RAISE NOTICE '   - niv_conversations';
    RAISE NOTICE '   - niv_artifacts';
    RAISE NOTICE '   - niv_workspace_edits';
    RAISE NOTICE '3. Your app should now work!';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Some tables may not have been created.';
    RAISE NOTICE 'niv_artifacts exists: %', artifacts_exists;
    RAISE NOTICE 'niv_conversations exists: %', conversations_exists;
    RAISE NOTICE 'niv_workspace_edits exists: %', edits_exists;
  END IF;
END $$;