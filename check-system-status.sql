-- Critical Check: Is monitoring happening and is analysis being generated?
-- Run this in Supabase SQL Editor to verify the system is working

-- =========================================
-- 1. CHECK WHAT TABLES EXIST
-- =========================================
SELECT 
    tablename,
    'exists' as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'monitoring_results',
    'intelligence_findings', 
    'intelligence_stage_data',
    'organization_profiles',
    'source_registry',
    'monitoring_configs'
)
ORDER BY tablename;

-- =========================================
-- 2. CHECK MONITORING_RESULTS STRUCTURE
-- =========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'monitoring_results'
ORDER BY ordinal_position
LIMIT 20;

-- =========================================
-- 3. CHECK INTELLIGENCE_STAGE_DATA STRUCTURE
-- =========================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'intelligence_stage_data'
ORDER BY ordinal_position
LIMIT 20;

-- =========================================
-- 4. CHECK IF ANY MONITORING DATA EXISTS
-- =========================================
SELECT 
    'Monitoring Results Count' as check_type,
    COUNT(*) as total_records
FROM monitoring_results;

-- =========================================
-- 5. CHECK IF ANY STAGE DATA EXISTS
-- =========================================
SELECT 
    'Stage Data Count' as check_type,
    COUNT(*) as total_records
FROM intelligence_stage_data;

-- =========================================
-- 6. SAMPLE RECENT STAGE DATA
-- =========================================
SELECT 
    id,
    organization_name,
    stage_name,
    created_at,
    updated_at,
    LEFT(stage_data::text, 100) as data_preview
FROM intelligence_stage_data
ORDER BY created_at DESC
LIMIT 5;

-- =========================================
-- 7. CHECK FOR CLAUDE MARKERS IN DATA
-- =========================================
SELECT 
    organization_name,
    stage_name,
    created_at,
    CASE 
        WHEN stage_data::text LIKE '%claude_enhanced%' THEN '✅ HAS CLAUDE'
        WHEN stage_data::text LIKE '%competitive%' THEN '📊 Has competitive'
        WHEN stage_data::text LIKE '%media%' THEN '📰 Has media'
        WHEN LENGTH(stage_data::text) > 500 THEN '📝 Has data'
        ELSE '❌ Empty/minimal'
    END as content_type
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC
LIMIT 10;

-- =========================================
-- 8. CHECK METADATA FOR CLAUDE
-- =========================================
SELECT 
    organization_name,
    stage_name,
    metadata,
    created_at
FROM intelligence_stage_data
WHERE metadata IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- =========================================
-- 9. CHECK SOURCE REGISTRY
-- =========================================
SELECT 
    COUNT(*) as total_sources,
    COUNT(CASE WHEN is_active THEN 1 END) as active_sources
FROM source_registry;

-- =========================================
-- 10. CHECK MONITORING CONFIGS
-- =========================================
SELECT 
    config_type,
    is_active
FROM monitoring_configs
WHERE is_active = true
LIMIT 10;

-- =========================================
-- 11. SIMPLE SYSTEM STATUS
-- =========================================
SELECT 
    '=== SYSTEM STATUS ===' as check,
    CURRENT_TIMESTAMP as time;

SELECT 
    'Stage Data Records' as metric,
    COUNT(*) as value
FROM intelligence_stage_data
UNION ALL
SELECT 
    'Records from last 24h' as metric,
    COUNT(*) as value
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'Records with Claude marker' as metric,
    COUNT(*) as value
FROM intelligence_stage_data
WHERE stage_data::text LIKE '%claude_enhanced%';