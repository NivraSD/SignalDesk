-- MemoryVault Enhancement Migration
-- Adds versioning, semantic search, and relationship mapping

-- Create memoryvault_items table if not exists
CREATE TABLE IF NOT EXISTS memoryvault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  content TEXT,
  vector_id VARCHAR(255), -- ID in vector database
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create versions table for tracking changes
CREATE TABLE IF NOT EXISTS memoryvault_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  change_type VARCHAR(50), -- 'create', 'update', 'delete'
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS memoryvault_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  target_item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL, -- 'references', 'inspired_by', 'follows', etc.
  strength DECIMAL(3,2) DEFAULT 1.0, -- 0-1 strength of relationship
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create AI context table for tracking which items are in context
CREATE TABLE IF NOT EXISTS memoryvault_ai_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_id UUID REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  feature VARCHAR(100), -- 'campaign_intelligence', 'media_intelligence', etc.
  added_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Create campaign optimizations table
CREATE TABLE IF NOT EXISTS campaign_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID,
  recommendations JSONB,
  goals JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_project ON memoryvault_items(project_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_type ON memoryvault_items(type);
CREATE INDEX IF NOT EXISTS idx_memoryvault_items_vector ON memoryvault_items(vector_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_versions_item ON memoryvault_versions(item_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_relationships_source ON memoryvault_relationships(source_item_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_relationships_target ON memoryvault_relationships(target_item_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_ai_context_user_project ON memoryvault_ai_context(user_id, project_id);

-- Add metadata columns to existing tables if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='campaigns' AND column_name='brief_data'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN brief_data JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='campaigns' AND column_name='type'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN type VARCHAR(100);
  END IF;
END $$;

-- Create function to automatically version changes
CREATE OR REPLACE FUNCTION memoryvault_version_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the next version number
  INSERT INTO memoryvault_versions (
    item_id,
    version_number,
    content,
    change_type,
    changed_by,
    metadata
  )
  SELECT 
    NEW.id,
    COALESCE(MAX(version_number), 0) + 1,
    NEW.content,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      ELSE 'unknown'
    END,
    NEW.created_by,
    NEW.metadata
  FROM memoryvault_versions
  WHERE item_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic versioning
DROP TRIGGER IF EXISTS memoryvault_version_on_change ON memoryvault_items;
CREATE TRIGGER memoryvault_version_on_change
AFTER INSERT OR UPDATE ON memoryvault_items
FOR EACH ROW
EXECUTE FUNCTION memoryvault_version_trigger();

-- Grant permissions if needed
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_app_user;