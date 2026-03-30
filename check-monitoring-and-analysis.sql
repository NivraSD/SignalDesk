-- Critical Check: Is monitoring happening and is analysis being generated?
-- Run this in Supabase SQL Editor to verify the system is working

-- =========================================
-- 1. CHECK IF MONITORING DATA EXISTS
-- =========================================
SELECT 
    'Monitoring Results' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT organization_name) as unique_orgs,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    CASE 
        WHEN MAX(created_at) > NOW() - INTERVAL '1 hour' THEN '✅ Recent data found'
        WHEN MAX(created_at) > NOW() - INTERVAL '1 day' THEN '⚠️ Data is stale (>1 hour old)'
        ELSE '❌ No recent monitoring data'
    END as status
FROM monitoring_results;

-- =========================================
-- 2. CHECK IF INTELLIGENCE FINDINGS EXIST
-- =========================================
SELECT 
    'Intelligence Findings' as check_type,
    COUNT(*) as total_findings,
    COUNT(DISTINCT organization_name) as unique_orgs,
    MIN(created_at) as oldest_finding,
    MAX(created_at) as newest_finding,
    CASE 
        WHEN MAX(created_at) > NOW() - INTERVAL '1 hour' THEN '✅ Recent findings'
        ELSE '❌ No recent findings'
    END as status
FROM intelligence_findings;

-- =========================================
-- 3. CHECK IF STAGE DATA IS BEING SAVED
-- =========================================
SELECT 
    'Stage Data by Stage' as check_type,
    stage_name,
    COUNT(*) as records,
    MAX(created_at) as latest,
    CASE 
        WHEN stage_data::text LIKE '%claude_enhanced%' THEN '✅ Has Claude analysis'
        WHEN stage_data IS NOT NULL AND LENGTH(stage_data::text) > 100 THEN '⚠️ Has data but no Claude marker'
        ELSE '❌ Empty or minimal data'
    END as claude_status
FROM intelligence_stage_data
GROUP BY stage_name, stage_data
ORDER BY stage_name;

-- =========================================
-- 4. CHECK RECENT STAGE DATA CONTENT
-- =========================================
SELECT 
    'Recent Stage Data Sample' as check_type,
    organization_name,
    stage_name,
    status,
    created_at,
    CASE 
        WHEN stage_data::text LIKE '%competitive_landscape%' THEN 'Has competitive data'
        WHEN stage_data::text LIKE '%media_coverage%' THEN 'Has media data'
        WHEN stage_data::text LIKE '%regulatory%' THEN 'Has regulatory data'
        WHEN stage_data::text LIKE '%trends%' THEN 'Has trends data'
        WHEN stage_data::text LIKE '%synthesis%' THEN 'Has synthesis'
        ELSE 'Unknown content'
    END as content_type,
    LEFT(stage_data::text, 200) as data_preview
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- =========================================
-- 5. CHECK SOURCE REGISTRY
-- =========================================
SELECT 
    'Active Sources' as check_type,
    COUNT(*) as total_sources,
    COUNT(DISTINCT source_type) as source_types,
    COUNT(CASE WHEN is_active THEN 1 END) as active_sources,
    COUNT(CASE WHEN organization_name = 'Master' THEN 1 END) as master_sources
FROM source_registry;

-- =========================================
-- 6. CHECK MONITORING CONFIGS
-- =========================================
SELECT 
    'Monitoring Configs' as check_type,
    config_type,
    organization_name,
    is_active,
    CASE 
        WHEN config_data::text LIKE '%api_key%' THEN '✅ Has API key'
        ELSE '❌ Missing API key'
    END as api_key_status
FROM monitoring_configs
WHERE is_active = true;

-- =========================================
-- 7. CRITICAL CHECK: IS CLAUDE ACTUALLY BEING CALLED?
-- =========================================
SELECT 
    'Claude Analysis Check' as check_type,
    organization_name,
    stage_name,
    metadata->>'claude_enhanced' as claude_enhanced,
    metadata->>'analyst_personality' as analyst,
    metadata->>'had_monitoring_data' as had_data,
    created_at
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '1 day'
AND metadata IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- =========================================
-- FINAL VERDICT
-- =========================================
SELECT 
    '🔍 SYSTEM STATUS SUMMARY' as verdict,
    CASE 
        WHEN (SELECT COUNT(*) FROM monitoring_results WHERE created_at > NOW() - INTERVAL '1 hour') > 0 
        THEN '✅ Monitoring is active'
        ELSE '❌ No recent monitoring'
    END as monitoring_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM intelligence_stage_data WHERE metadata->>'claude_enhanced' = 'true' AND created_at > NOW() - INTERVAL '1 hour') > 0
        THEN '✅ Claude is analyzing'
        ELSE '❌ Claude not working'
    END as claude_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM intelligence_findings WHERE created_at > NOW() - INTERVAL '1 hour') > 0
        THEN '✅ Findings being saved'
        ELSE '❌ No recent findings'
    END as persistence_status;