-- Check what data is actually stored in Supabase
-- Run this in your Supabase SQL Editor

-- 1. Check intelligence_stage_data
SELECT 
    organization_name,
    stage_name,
    created_at,
    jsonb_pretty(stage_data) as stage_data_preview
FROM intelligence_stage_data
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check organization_profiles
SELECT 
    organization_name,
    created_at,
    updated_at,
    jsonb_pretty(profile_data) as profile_preview
FROM organization_profiles
ORDER BY updated_at DESC
LIMIT 5;

-- 3. Check intelligence_findings
SELECT 
    organization_name,
    target_type,
    title,
    created_at
FROM intelligence_findings
ORDER BY created_at DESC
LIMIT 10;

-- 4. Count records in each table
SELECT 
    'intelligence_stage_data' as table_name,
    COUNT(*) as record_count
FROM intelligence_stage_data
UNION ALL
SELECT 
    'organization_profiles',
    COUNT(*)
FROM organization_profiles
UNION ALL
SELECT 
    'intelligence_findings',
    COUNT(*)
FROM intelligence_findings
UNION ALL
SELECT 
    'opportunities',
    COUNT(*)
FROM opportunities;