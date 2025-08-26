-- SAFE Setup Intelligence Pipeline Tables
-- This script is non-destructive and will preserve any existing data

-- Check if tables exist and show current status
SELECT 
    'organization_profiles' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_profiles'
    ) as exists,
    (SELECT COUNT(*) FROM organization_profiles) as row_count
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_profiles'
)
UNION ALL
SELECT 
    'intelligence_stage_data',
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'intelligence_stage_data'
    ),
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'intelligence_stage_data'
        ) 
        THEN (SELECT COUNT(*) FROM intelligence_stage_data)
        ELSE 0
    END
UNION ALL
SELECT 
    'intelligence_targets',
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'intelligence_targets'
    ),
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'intelligence_targets'
        ) 
        THEN (SELECT COUNT(*) FROM intelligence_targets)
        ELSE 0
    END;

-- Create tables ONLY if they don't exist (completely safe)
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    organization_id TEXT,
    profile_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if it doesn't exist (safe)
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);

-- Safely handle RLS (check current status first)
DO $$ 
BEGIN
    -- Only disable RLS if it's currently enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'organization_profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE organization_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'intelligence_stage_data' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE intelligence_stage_data DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'intelligence_targets' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE intelligence_targets DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Grant permissions (safe - won't error if already granted)
GRANT ALL ON organization_profiles TO anon, service_role;
GRANT ALL ON intelligence_stage_data TO anon, service_role;
GRANT ALL ON intelligence_targets TO anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, service_role;

-- Create or replace trigger function (safe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers (safe - drops only if exists)
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

-- Final check - show what we have
SELECT 
    'Setup Complete' as status,
    'organization_profiles' as table_name,
    COUNT(*) as existing_rows 
FROM organization_profiles
UNION ALL
SELECT 
    'Setup Complete',
    'intelligence_stage_data',
    COUNT(*) 
FROM intelligence_stage_data
UNION ALL
SELECT 
    'Setup Complete',
    'intelligence_targets',
    COUNT(*) 
FROM intelligence_targets;