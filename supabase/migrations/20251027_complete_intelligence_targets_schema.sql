-- Complete schema fix for intelligence_targets table
-- Run this in Supabase SQL Editor

-- First, drop the table if it exists with wrong schema
DROP TABLE IF EXISTS intelligence_targets CASCADE;

-- Create the table with correct schema
CREATE TABLE intelligence_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'competitor',
  priority VARCHAR(20) DEFAULT 'medium',
  threat_level INTEGER DEFAULT 50,
  keywords TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_intelligence_targets_organization_id ON intelligence_targets(organization_id);
CREATE INDEX idx_intelligence_targets_org_active ON intelligence_targets(organization_id, active);
CREATE INDEX idx_intelligence_targets_type ON intelligence_targets(type);

-- Enable RLS
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON intelligence_targets;

-- Create policies (permissive for now - adjust based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON intelligence_targets
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON intelligence_targets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON intelligence_targets
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON intelligence_targets
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_intelligence_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intelligence_targets_updated_at
  BEFORE UPDATE ON intelligence_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_intelligence_targets_updated_at();
