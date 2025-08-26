-- MINIMAL SAFE Setup - No DROP, ALTER, or any potentially destructive operations
-- This script ONLY creates what's missing, changes nothing that exists

-- Step 1: Create tables if they don't exist
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

-- Step 2: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);

-- Step 3: Grant permissions (won't error if already granted)
GRANT ALL ON organization_profiles TO anon, service_role;
GRANT ALL ON intelligence_stage_data TO anon, service_role;
GRANT ALL ON intelligence_targets TO anon, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, service_role;

-- Step 4: Verify tables were created
SELECT 
    'Tables Created Successfully' as status,
    COUNT(*) as tables_found
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('organization_profiles', 'intelligence_stage_data', 'intelligence_targets');