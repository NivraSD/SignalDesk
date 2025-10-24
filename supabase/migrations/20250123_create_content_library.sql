-- Create content_library table for Memory Vault content storage
CREATE TABLE IF NOT EXISTS content_library (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,  -- Fixed: was 'type', now 'content_type'
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  framework_id TEXT,
  metadata JSONB DEFAULT '{}',
  versions JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_library_org ON content_library(organization_id);
-- Fixed: Drop old incorrect index, create correct one
DROP INDEX IF EXISTS idx_content_library_type;
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_status ON content_library(status);
CREATE INDEX IF NOT EXISTS idx_content_library_created ON content_library(created_at DESC);

-- Add RLS policies
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their content
CREATE POLICY "Users can view all content" ON content_library
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert content" ON content_library
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update content" ON content_library
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete content" ON content_library
  FOR DELETE
  USING (true);