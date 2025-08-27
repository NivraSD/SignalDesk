-- COMPLETE DATABASE DIAGNOSTIC
-- Run each section separately to avoid any errors

-- SECTION 1: List ALL tables in the database
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_catalog.pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- SECTION 2: Get COMPLETE structure of organization_profiles
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
ORDER BY ordinal_position;

-- SECTION 3: Get COMPLETE structure of intelligence_stage_data (if exists)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'intelligence_stage_data'
ORDER BY ordinal_position;

-- SECTION 4: Get COMPLETE structure of intelligence_targets (if exists)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'intelligence_targets'
ORDER BY ordinal_position;

-- SECTION 5: Get COMPLETE structure of source_registry (if exists)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'source_registry'
ORDER BY ordinal_position;

-- SECTION 6: Get COMPLETE structure of monitoring_results (if exists)
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'monitoring_results'
ORDER BY ordinal_position;

-- SECTION 7: Check if there's any data in organization_profiles
SELECT COUNT(*) as row_count FROM organization_profiles;

-- SECTION 8: Show a sample row from organization_profiles (if any exist)
SELECT * FROM organization_profiles LIMIT 1;

-- SECTION 9: List ALL columns that contain 'status' in ANY table
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%status%'
ORDER BY table_name, column_name;