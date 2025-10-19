-- Fix content_library table to include organization_id and match expected structure

-- First, rename old columns to match new structure if they exist differently
DO $$
BEGIN
  -- Check if content_text exists and content doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_library' AND column_name = 'content_text')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_library' AND column_name = 'content') THEN
    ALTER TABLE content_library RENAME COLUMN content_text TO content;
  END IF;
END $$;

-- Add organization_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'organization_id') THEN
    ALTER TABLE content_library ADD COLUMN organization_id UUID;
    RAISE NOTICE 'Added organization_id column to content_library';
  END IF;
END $$;

-- Add missing columns that are in the new structure but not in old
DO $$
BEGIN
  -- Add metadata column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'metadata') THEN
    ALTER TABLE content_library ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add tags column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'tags') THEN
    ALTER TABLE content_library ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Add view_count column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'view_count') THEN
    ALTER TABLE content_library ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;

  -- Add is_public column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'is_public') THEN
    ALTER TABLE content_library ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;

  -- Add last_accessed column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'last_accessed') THEN
    ALTER TABLE content_library ADD COLUMN last_accessed TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add parent_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'parent_id') THEN
    ALTER TABLE content_library ADD COLUMN parent_id UUID;
  END IF;

  -- Add framework_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'framework_id') THEN
    ALTER TABLE content_library ADD COLUMN framework_id UUID;
  END IF;

  -- Add opportunity_id column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'content_library' AND column_name = 'opportunity_id') THEN
    ALTER TABLE content_library ADD COLUMN opportunity_id UUID;
  END IF;
END $$;

-- Update existing records to have a default organization_id if they don't have one
UPDATE content_library
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  -- SignalDesk Demo Organization
WHERE organization_id IS NULL;

-- Create index on organization_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_content_library_org') THEN
    CREATE INDEX idx_content_library_org ON content_library(organization_id);
    RAISE NOTICE 'Created index on organization_id';
  END IF;
END $$;

-- Fix memory_vault table to ensure it has organization_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'memory_vault' AND column_name = 'organization_id') THEN
    ALTER TABLE memory_vault ADD COLUMN organization_id UUID;
    RAISE NOTICE 'Added organization_id column to memory_vault';
  END IF;

  -- Add category column if missing (based on the error we saw)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'memory_vault' AND column_name = 'category') THEN
    ALTER TABLE memory_vault ADD COLUMN category VARCHAR(100);
    RAISE NOTICE 'Added category column to memory_vault';
  END IF;
END $$;

-- Update memory_vault records with default organization_id if needed
UPDATE memory_vault
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'  -- SignalDesk Demo Organization
WHERE organization_id IS NULL;

-- Create index on memory_vault organization_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_memory_vault_org') THEN
    CREATE INDEX idx_memory_vault_org ON memory_vault(organization_id);
    RAISE NOTICE 'Created index on memory_vault organization_id';
  END IF;
END $$;

-- Verify the fixes
SELECT
  'content_library' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'content_library'
  AND column_name IN ('organization_id', 'content', 'metadata', 'tags')
UNION ALL
SELECT
  'memory_vault' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'memory_vault'
  AND column_name IN ('organization_id', 'category')
ORDER BY table_name, column_name;