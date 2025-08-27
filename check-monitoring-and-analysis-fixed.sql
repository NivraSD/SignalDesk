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
ORDER BY ordinal_position;

-- =========================================
-- 3. CHECK IF ANY MONITORING DATA EXISTS
-- =========================================
SELECT 
    'Monitoring Results' as check_type,
    COUNT(*) as total_records,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No monitoring data at all'
        WHEN MAX(created_at) > NOW() - INTERVAL '1 hour' THEN '✅ Recent data found'
        WHEN MAX(created_at) > NOW() - INTERVAL '1 day' THEN '⚠️ Data is stale (>1 hour old)'
        ELSE '❌ No recent monitoring data'
    END as status
FROM monitoring_results;

-- =========================================
-- 4. CHECK INTELLIGENCE_STAGE_DATA
-- =========================================
SELECT 
    'Intelligence Stage Data' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT stage_name) as unique_stages,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM intelligence_stage_data;

-- =========================================
-- 5. CHECK RECENT STAGE DATA (if exists)
-- =========================================
SELECT 
    id,
    organization_name,
    stage_name,
    status,
    created_at,
    CASE 
        WHEN stage_data::text LIKE '%claude_enhanced%' THEN '✅ Has Claude'
        WHEN stage_data::text LIKE '%competitive%' THEN '📊 Has competitive data'
        WHEN stage_data::text LIKE '%media%' THEN '📰 Has media data'
        WHEN stage_data::text LIKE '%regulatory%' THEN '⚖️ Has regulatory data'
        WHEN stage_data::text LIKE '%trends%' THEN '📈 Has trends data'
        WHEN LENGTH(stage_data::text) > 100 THEN '📝 Has some data'
        ELSE '❌ Empty or minimal'
    END as content_check,
    LEFT(stage_data::text, 200) as data_preview
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- =========================================
-- 6. CHECK IF CLAUDE IS IN METADATA
-- =========================================
SELECT 
    organization_name,
    stage_name,
    metadata->>'claude_enhanced' as claude_enhanced,
    metadata->>'analyst_personality' as analyst,
    metadata->>'had_monitoring_data' as had_monitoring_data,
    created_at
FROM intelligence_stage_data
WHERE metadata IS NOT NULL
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- =========================================
-- 7. CHECK SOURCE REGISTRY
-- =========================================
SELECT 
    'Source Registry' as check_type,
    COUNT(*) as total_sources,
    COUNT(CASE WHEN is_active THEN 1 END) as active_sources,
    COUNT(DISTINCT source_type) as source_types
FROM source_registry;

-- =========================================
-- 8. CHECK MONITORING CONFIGS
-- =========================================
SELECT 
    config_type,
    organization_name,
    is_active,
    CASE 
        WHEN config_data::text LIKE '%api_key%' OR config_data::text LIKE '%API_KEY%' THEN '✅ Has API key config'
        ELSE '❌ No API key found'
    END as api_key_status
FROM monitoring_configs
WHERE is_active = true
ORDER BY config_type;

-- =========================================
-- 9. CHECK ORGANIZATION PROFILES
-- =========================================
SELECT 
    'Organization Profiles' as check_type,
    COUNT(*) as total_profiles,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM organization_profiles;

-- =========================================
-- 10. FINAL SYSTEM STATUS
-- =========================================
SELECT 
    '🔍 SYSTEM CHECK COMPLETE' as status,
    CURRENT_TIMESTAMP as checked_at,
    CASE 
        WHEN EXISTS(SELECT 1 FROM intelligence_stage_data WHERE created_at > NOW() - INTERVAL '1 hour')
        THEN '✅ Recent stage data found'
        ELSE '❌ No recent activity'
    END as activity_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM intelligence_stage_data WHERE metadata->>'claude_enhanced' = 'true')
        THEN '✅ Claude integration detected'
        ELSE '❌ No Claude analysis found'
    END as claude_status;