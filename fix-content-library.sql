-- Fix content_library table conflicts
-- This script will drop and recreate the content_library table cleanly

-- First, check if table exists
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable all operations" ON content_library;
  DROP POLICY IF EXISTS "Enable read access for all users" ON content_library;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON content_library;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON content_library;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON content_library;

  -- Drop the table if it exists
  DROP TABLE IF EXISTS content_library CASCADE;

  RAISE NOTICE 'Dropped existing content_library table and policies';
END $$;

-- Create the content_library table
CREATE TABLE content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  content_type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  intelligence_status VARCHAR(50) DEFAULT 'pending',
  folder VARCHAR(200) DEFAULT 'Unsorted',
  salience_score DECIMAL(3,2) DEFAULT 1.0 CHECK (salience_score >= 0 AND salience_score <= 1),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'niv'
);

-- Create index for faster queries
CREATE INDEX idx_content_library_org_id ON content_library(organization_id);
CREATE INDEX idx_content_library_type ON content_library(content_type);
CREATE INDEX idx_content_library_status ON content_library(status);

-- Enable RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see content from their organizations
CREATE POLICY "Users can view content from their organizations"
  ON content_library
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_users
      WHERE org_users.organization_id = content_library.organization_id
      AND org_users.user_id = auth.uid()
    )
  );

-- Users can insert content for their organizations
CREATE POLICY "Users can create content for their organizations"
  ON content_library
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_users
      WHERE org_users.organization_id = content_library.organization_id
      AND org_users.user_id = auth.uid()
    )
  );

-- Users can update content from their organizations
CREATE POLICY "Users can update content from their organizations"
  ON content_library
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_users
      WHERE org_users.organization_id = content_library.organization_id
      AND org_users.user_id = auth.uid()
    )
  );

-- Users can delete content from their organizations (owners/admins only)
CREATE POLICY "Owners can delete content from their organizations"
  ON content_library
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_users
      WHERE org_users.organization_id = content_library.organization_id
      AND org_users.user_id = auth.uid()
      AND org_users.role IN ('owner', 'admin')
    )
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER content_library_updated_at
  BEFORE UPDATE ON content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_content_library_updated_at();

-- Create function to boost salience on access
CREATE OR REPLACE FUNCTION boost_salience_on_access(
  content_id UUID,
  boost_amount DECIMAL DEFAULT 0.05
)
RETURNS void AS $$
BEGIN
  UPDATE content_library
  SET
    salience_score = LEAST(1.0, salience_score + boost_amount),
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON content_library TO authenticated;
GRANT ALL ON content_library TO service_role;
GRANT EXECUTE ON FUNCTION boost_salience_on_access TO authenticated;
GRANT EXECUTE ON FUNCTION boost_salience_on_access TO service_role;

SELECT 'Content library table created successfully!' AS status;
