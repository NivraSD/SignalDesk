-- Create content_library table if it doesn't exist
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

-- Enable Row Level Security
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all operations (for now, to simplify testing)
DROP POLICY IF EXISTS "Enable all operations" ON content_library;
CREATE POLICY "Enable all operations" ON content_library
  FOR ALL USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_library_organization_id ON content_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_created_at ON content_library(created_at DESC);

-- Grant permissions
GRANT ALL ON content_library TO anon, authenticated, service_role;

-- Create the memory_vault table if it doesn't exist
CREATE TABLE IF NOT EXISTS memory_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  category VARCHAR(100),
  key VARCHAR(255),
  value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Enable RLS on memory_vault
ALTER TABLE memory_vault ENABLE ROW LEVEL SECURITY;

-- Create policy for memory_vault
DROP POLICY IF EXISTS "Enable all operations" ON memory_vault;
CREATE POLICY "Enable all operations" ON memory_vault
  FOR ALL USING (true);

-- Add indexes for memory_vault
CREATE INDEX IF NOT EXISTS idx_memory_vault_organization_id ON memory_vault(organization_id);
CREATE INDEX IF NOT EXISTS idx_memory_vault_category ON memory_vault(category);
CREATE INDEX IF NOT EXISTS idx_memory_vault_key ON memory_vault(key);

-- Grant permissions for memory_vault
GRANT ALL ON memory_vault TO anon, authenticated, service_role;