-- Niv Realtime System - Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new

-- Enable UUID extension
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

-- Create workspace edits table
CREATE TABLE niv_workspace_edits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artifact_id UUID REFERENCES niv_artifacts(id) ON DELETE CASCADE,
  user_id TEXT,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_artifacts_session ON niv_artifacts(session_id);
CREATE INDEX idx_artifacts_user ON niv_artifacts(user_id);
CREATE INDEX idx_conversations_session ON niv_conversations(session_id);
CREATE INDEX idx_workspace_edits_artifact ON niv_workspace_edits(artifact_id);

-- Make tables accessible (Important!)
GRANT ALL ON niv_artifacts TO anon, authenticated, service_role;
GRANT ALL ON niv_conversations TO anon, authenticated, service_role;
GRANT ALL ON niv_workspace_edits TO anon, authenticated, service_role;

-- Enable Realtime
ALTER TABLE niv_artifacts REPLICA IDENTITY FULL;
ALTER TABLE niv_conversations REPLICA IDENTITY FULL;
ALTER TABLE niv_workspace_edits REPLICA IDENTITY FULL;

-- Success message
SELECT 'Tables created successfully! Now enable Realtime in the Dashboard.' as message;