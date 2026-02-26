-- Step 1: Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Step 2: Check the structure of organization_profiles if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
ORDER BY ordinal_position;

-- Step 3: Check the structure of intelligence_stage_data if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'intelligence_stage_data'
ORDER BY ordinal_position;

-- Step 4: Check the structure of intelligence_targets if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'intelligence_targets'
ORDER BY ordinal_position;