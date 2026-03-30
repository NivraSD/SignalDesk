-- Drop existing table if it exists
DROP TABLE IF EXISTS content_library CASCADE;

-- Create content_library table with simpler structure
CREATE TABLE content_library (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  framework_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_library_type ON content_library(type);
CREATE INDEX idx_content_library_status ON content_library(status);
CREATE INDEX idx_content_library_created ON content_library(created_at DESC);

-- Enable RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development
CREATE POLICY "Enable all for authenticated users" ON content_library
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON content_library TO anon;
GRANT ALL ON content_library TO authenticated;
GRANT ALL ON content_library TO service_role;

-- Insert test data to verify it works
INSERT INTO content_library (id, title, type, content, status)
VALUES (
  'test-' || gen_random_uuid()::text,
  'Test Content',
  'press-release',
  'This is test content',
  'draft'
);

-- Verify the table
SELECT COUNT(*) as count FROM content_library;