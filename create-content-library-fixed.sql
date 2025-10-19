-- Create content_library table for storing all types of content
-- This version doesn't require organizations table to exist

CREATE TABLE IF NOT EXISTS content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID, -- No foreign key reference for now
  content_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'niv',

  -- Additional fields for content management
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,

  -- Relationships (no foreign keys for now)
  parent_id UUID,
  framework_id UUID,
  opportunity_id UUID
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_library_org ON content_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_status ON content_library(status);
CREATE INDEX IF NOT EXISTS idx_content_library_created ON content_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_library_tags ON content_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_library_metadata ON content_library USING GIN(metadata);

-- Enable RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Enable read for all users" ON content_library;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content_library;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content_library;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON content_library;

CREATE POLICY "Enable read for all users" ON content_library
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON content_library
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON content_library
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON content_library
  FOR DELETE USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_content_library_updated_at ON content_library;

CREATE TRIGGER update_content_library_updated_at
  BEFORE UPDATE ON content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comments for documentation
COMMENT ON TABLE content_library IS 'General purpose content storage for all types of generated content';
COMMENT ON COLUMN content_library.content_type IS 'Type of content: press-release, blog-post, social-post, email, image, video, etc.';
COMMENT ON COLUMN content_library.metadata IS 'Flexible JSON storage for content-specific metadata';
COMMENT ON COLUMN content_library.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN content_library.framework_id IS 'Link to strategic framework if content was generated from one';
COMMENT ON COLUMN content_library.opportunity_id IS 'Link to opportunity if content was generated from one';

-- Test insert to verify table works
INSERT INTO content_library (content_type, title, content, tags)
VALUES ('test', 'Test Entry', 'This is a test entry to verify the table works', ARRAY['test'])
ON CONFLICT DO NOTHING;

-- Clean up test entry
DELETE FROM content_library WHERE content_type = 'test' AND title = 'Test Entry';

-- Show success message
SELECT 'Content library table created successfully!' as message;