-- Create content_library table
CREATE TABLE IF NOT EXISTS content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  content_type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  metadata JSONB,
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'niv'
);

-- Enable RLS but allow all operations for now
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations" ON content_library;
CREATE POLICY "Enable all operations" ON content_library
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON content_library TO anon, authenticated, service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_library_organization_id ON content_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_created_at ON content_library(created_at DESC);
