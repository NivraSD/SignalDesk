-- First, check if table exists and drop it if needed (for clean setup)
-- Comment this line out if you want to preserve existing data
-- DROP TABLE IF EXISTS content_library CASCADE;

-- Create content_library table with minimal structure
CREATE TABLE IF NOT EXISTS content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
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
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  parent_id UUID,
  framework_id UUID,
  opportunity_id UUID
);

-- Only create indexes if table was successfully created
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_library') THEN
    -- Create indexes only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_org') THEN
      CREATE INDEX idx_content_library_org ON content_library(organization_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_type') THEN
      CREATE INDEX idx_content_library_type ON content_library(content_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_status') THEN
      CREATE INDEX idx_content_library_status ON content_library(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_created') THEN
      CREATE INDEX idx_content_library_created ON content_library(created_at DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_tags') THEN
      CREATE INDEX idx_content_library_tags ON content_library USING GIN(tags);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_metadata') THEN
      CREATE INDEX idx_content_library_metadata ON content_library USING GIN(metadata);
    END IF;

    RAISE NOTICE 'Indexes created successfully';
  ELSE
    RAISE NOTICE 'Table content_library does not exist';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Enable read for all users" ON content_library;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON content_library;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON content_library;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON content_library;
DROP POLICY IF EXISTS "Enable all for service role" ON content_library;

-- Simple policy that allows everything (adjust as needed)
CREATE POLICY "Enable all for service role" ON content_library
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify table was created
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_library')
    THEN 'SUCCESS: content_library table exists'
    ELSE 'ERROR: content_library table was not created'
  END as status;

-- Show table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'content_library'
ORDER BY ordinal_position;