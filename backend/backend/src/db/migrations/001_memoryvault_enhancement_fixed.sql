-- MemoryVault Enhancement Migration (Fixed for INTEGER IDs)
-- Adds versioning, semantic search, and relationship mapping

-- Add vector_id column to existing memoryvault_items table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='memoryvault_items' AND column_name='vector_id'
  ) THEN
    ALTER TABLE memoryvault_items ADD COLUMN vector_id VARCHAR(255);
  END IF;
END $$;

-- Create versions table for tracking changes
CREATE TABLE IF NOT EXISTS memoryvault_versions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT,
  change_type VARCHAR(50), -- 'create', 'update', 'delete'
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create relationships table
CREATE TABLE IF NOT EXISTS memoryvault_relationships (
  id SERIAL PRIMARY KEY,
  source_item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  target_item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL, -- 'references', 'inspired_by', 'follows', etc.
  strength DECIMAL(3,2) DEFAULT 1.0, -- 0-1 strength of relationship
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- Create AI context table for tracking which items are in context
CREATE TABLE IF NOT EXISTS memoryvault_ai_context (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES memoryvault_items(id) ON DELETE CASCADE,
  feature VARCHAR(100), -- 'campaign_intelligence', 'media_intelligence', etc.
  added_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Create campaign optimizations table
CREATE TABLE IF NOT EXISTS campaign_optimizations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  recommendations JSONB,
  goals JSONB,
  created_by INTEGER REFERENCES users(id),
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
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='campaigns' AND column_name='created_by'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN created_by INTEGER REFERENCES users(id);
  END IF;
END $$;

-- Create function to automatically version changes
CREATE OR REPLACE FUNCTION memoryvault_version_trigger()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
  user_id INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM memoryvault_versions
  WHERE item_id = NEW.id;
  
  -- Get user_id from created_by if available
  user_id := NEW.created_by;
  
  -- Insert version record
  INSERT INTO memoryvault_versions (
    item_id,
    version_number,
    content,
    change_type,
    changed_by,
    metadata
  )
  VALUES (
    NEW.id,
    next_version,
    NEW.content,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      ELSE 'unknown'
    END,
    user_id,
    NEW.metadata
  );
  
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