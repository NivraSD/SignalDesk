-- Add organization_id column to intelligence_targets table
-- This migration fixes the missing organization_id column

-- First, check if the column already exists and add it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE intelligence_targets
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_intelligence_targets_organization_id
    ON intelligence_targets(organization_id);

    -- Create index for organization_id + active queries
    CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org_active
    ON intelligence_targets(organization_id, active);
  END IF;
END $$;

-- Ensure the table has all required columns
-- If columns are missing, add them
DO $$
BEGIN
  -- Add type column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets'
    AND column_name = 'type'
  ) THEN
    ALTER TABLE intelligence_targets
    ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'competitor';
  END IF;

  -- Add priority column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets'
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE intelligence_targets
    ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
  END IF;

  -- Add threat_level column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets'
    AND column_name = 'threat_level'
  ) THEN
    ALTER TABLE intelligence_targets
    ADD COLUMN threat_level INTEGER DEFAULT 50;
  END IF;

  -- Add keywords column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets'
    AND column_name = 'keywords'
  ) THEN
    ALTER TABLE intelligence_targets
    ADD COLUMN keywords TEXT[];
  END IF;

  -- Add active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intelligence_targets'
    AND column_name = 'active'
  ) THEN
    ALTER TABLE intelligence_targets
    ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add RLS policies if not exist
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON intelligence_targets;

-- Create policies
CREATE POLICY "Enable read access for all users" ON intelligence_targets
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON intelligence_targets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON intelligence_targets
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON intelligence_targets
  FOR DELETE USING (true);
