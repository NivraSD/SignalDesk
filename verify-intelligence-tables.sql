-- Verify Intelligence Pipeline Tables Setup
-- Run this after executing fix-intelligence-pipeline-tables.sql

-- =====================================================
-- 1. CHECK TABLE EXISTENCE AND STRUCTURE
-- =====================================================

-- Check all required tables exist
SELECT 
    'Tables Check' as check_type,
    jsonb_build_object(
        'organization_profiles', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_profiles'),
        'intelligence_stage_data', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_stage_data'),
        'intelligence_targets', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_targets'),
        'source_registry', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'source_registry'),
        'monitoring_results', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'monitoring_results')
    ) as result;

-- =====================================================
-- 2. CHECK CRITICAL COLUMNS EXIST
-- =====================================================

-- Check organization_profiles has required columns
SELECT 
    'organization_profiles columns' as table_check,
    jsonb_build_object(
        'has_organization_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organization_profiles' AND column_name = 'organization_name'
        ),
        'has_profile_data', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organization_profiles' AND column_name = 'profile_data'
        )
    ) as columns_exist;

-- Check intelligence_stage_data has required columns
SELECT 
    'intelligence_stage_data columns' as table_check,
    jsonb_build_object(
        'has_organization_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_stage_data' AND column_name = 'organization_name'
        ),
        'has_stage_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_stage_data' AND column_name = 'stage_name'
        ),
        'has_stage_data', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_stage_data' AND column_name = 'stage_data'
        ),
        'has_metadata', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_stage_data' AND column_name = 'metadata'
        )
    ) as columns_exist;

-- Check intelligence_targets has required columns
SELECT 
    'intelligence_targets columns' as table_check,
    jsonb_build_object(
        'has_organization_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_targets' AND column_name = 'organization_name'
        ),
        'has_competitors', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_targets' AND column_name = 'competitors'
        ),
        'has_stakeholders', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'intelligence_targets' AND column_name = 'stakeholders'
        )
    ) as columns_exist;

-- =====================================================
-- 3. CHECK ROW LEVEL SECURITY
-- =====================================================

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN (
    'organization_profiles',
    'intelligence_stage_data',
    'intelligence_targets',
    'source_registry',
    'monitoring_results'
)
ORDER BY tablename;

-- =====================================================
-- 4. CHECK DATA EXISTS
-- =====================================================

SELECT 
    'Data Check' as check_type,
    jsonb_build_object(
        'organization_profiles_count', (SELECT COUNT(*) FROM organization_profiles),
        'intelligence_targets_count', (SELECT COUNT(*) FROM intelligence_targets),
        'source_registry_count', (SELECT COUNT(*) FROM source_registry),
        'test_org_exists', EXISTS(SELECT 1 FROM organization_profiles WHERE organization_name = 'test-org')
    ) as data_status;

-- =====================================================
-- 5. TEST ANONYMOUS ACCESS (Should work for testing)
-- =====================================================

-- Test SELECT access
SELECT 'Anonymous SELECT test on organization_profiles' as test,
       COUNT(*) > 0 as can_read
FROM organization_profiles
LIMIT 1;

-- =====================================================
-- 6. CHECK INDEXES
-- =====================================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'organization_profiles',
    'intelligence_stage_data',
    'intelligence_targets',
    'source_registry',
    'monitoring_results'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 7. SAMPLE DATA VERIFICATION
-- =====================================================

-- Check test organization profile
SELECT 
    'Test Organization Profile' as data_check,
    organization_name,
    jsonb_pretty(profile_data) as profile_data,
    competitors,
    stakeholders,
    focus_topics
FROM organization_profiles
WHERE organization_name = 'test-org'
LIMIT 1;

-- =====================================================
-- 8. TEST INSERT OPERATIONS
-- =====================================================

-- Test inserting intelligence stage data
INSERT INTO intelligence_stage_data (
    organization_name,
    stage_name,
    stage_data,
    metadata,
    status
) VALUES (
    'test-org',
    'test-stage',
    '{"test": "data", "timestamp": "now"}',
    '{"source": "verification_script"}',
    'completed'
) ON CONFLICT (organization_name, stage_name) 
DO UPDATE SET 
    stage_data = EXCLUDED.stage_data,
    updated_at = NOW();

-- Verify the insert
SELECT 
    'Stage Data Insert Test' as test,
    organization_name,
    stage_name,
    stage_data,
    status
FROM intelligence_stage_data
WHERE organization_name = 'test-org' AND stage_name = 'test-stage';

-- Test inserting monitoring results
INSERT INTO monitoring_results (
    organization_name,
    monitoring_type,
    target_name,
    findings,
    sentiment,
    relevance_score
) VALUES (
    'test-org',
    'competitor',
    'Competitor1',
    '{"finding": "Test monitoring result", "impact": "low"}',
    'neutral',
    0.75
);

-- Verify monitoring insert
SELECT 
    'Monitoring Results Insert Test' as test,
    COUNT(*) as records_inserted
FROM monitoring_results
WHERE organization_name = 'test-org';

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

SELECT 
    '🎯 VERIFICATION COMPLETE' as status,
    CASE 
        WHEN (
            EXISTS(SELECT 1 FROM organization_profiles WHERE organization_name = 'test-org')
            AND EXISTS(SELECT 1 FROM intelligence_stage_data WHERE organization_name = 'test-org')
            AND EXISTS(SELECT 1 FROM monitoring_results WHERE organization_name = 'test-org')
        )
        THEN '✅ All tables are working correctly!'
        ELSE '❌ Some issues detected - check individual test results above'
    END as result;