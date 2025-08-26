-- Setup Intelligence Pipeline Tables
-- Run this in Supabase SQL Editor

-- Drop existing tables if needed (be careful!)
-- DROP TABLE IF EXISTS organization_profiles CASCADE;
-- DROP TABLE IF EXISTS intelligence_stage_data CASCADE;
-- DROP TABLE IF EXISTS intelligence_targets CASCADE;

-- Create Organization Profiles table
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    organization_id TEXT,
    profile_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Intelligence Stage Data table
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);

-- Create Intelligence Targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for now (to avoid permission issues)
ALTER TABLE organization_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and service_role
GRANT ALL ON organization_profiles TO anon, service_role;
GRANT ALL ON intelligence_stage_data TO anon, service_role;
GRANT ALL ON intelligence_targets TO anon, service_role;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, service_role;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at (if they don't exist)
DROP TRIGGER IF EXISTS update_organization_profiles_updated_at ON organization_profiles;
CREATE TRIGGER update_organization_profiles_updated_at
    BEFORE UPDATE ON organization_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intelligence_targets_updated_at ON intelligence_targets;
CREATE TRIGGER update_intelligence_targets_updated_at
    BEFORE UPDATE ON intelligence_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Test that tables exist
SELECT 'organization_profiles' as table_name, COUNT(*) as row_count FROM organization_profiles
UNION ALL
SELECT 'intelligence_stage_data', COUNT(*) FROM intelligence_stage_data
UNION ALL
SELECT 'intelligence_targets', COUNT(*) FROM intelligence_targets;