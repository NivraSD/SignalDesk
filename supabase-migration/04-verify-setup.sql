-- SignalDesk Platform Verification Script
-- Run this to verify everything is working

-- Check all tables exist
SELECT 
  'Tables Created' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✅ PASS' 
    ELSE '❌ FAIL - Missing tables' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'users', 'organizations', 'projects', 'content',
  'intelligence_targets', 'intelligence_findings', 'monitoring_runs',
  'opportunity_queue', 'opportunity_patterns',
  'memoryvault_items', 'memoryvault_versions', 'memoryvault_relationships'
);

-- Check organization exists
SELECT 
  'Organization' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - demo-org exists' 
    ELSE '❌ FAIL - No organization' 
  END as status
FROM organizations 
WHERE id = 'demo-org';

-- Check user exists
SELECT 
  'User Account' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - demo user exists' 
    ELSE '❌ FAIL - No user (create in Auth tab)' 
  END as status
FROM users 
WHERE email = 'demo@signaldesk.com';

-- Check projects exist
SELECT 
  'Projects' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Workspace ready' 
    ELSE '❌ FAIL - No projects' 
  END as status
FROM projects 
WHERE organization_id = 'demo-org';

-- Check monitoring targets
SELECT 
  'Monitoring Targets' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Monitoring configured' 
    ELSE '⚠️  WARNING - No monitoring targets' 
  END as status
FROM intelligence_targets 
WHERE organization_id = 'demo-org';

-- Check opportunities
SELECT 
  'Opportunities' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Opportunity Engine ready' 
    ELSE '⚠️  WARNING - No opportunities' 
  END as status
FROM opportunity_queue 
WHERE organization_id = 'demo-org';

-- Check RLS policies
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ PASS - Security configured' 
    ELSE '❌ FAIL - Missing RLS policies' 
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- Check extensions
SELECT 
  'Extensions' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS - uuid-ossp and vector ready' 
    ELSE '❌ FAIL - Missing extensions' 
  END as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'vector', 'pg_cron');

-- Summary
SELECT 
  '🎯 PLATFORM STATUS' as summary,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM organizations WHERE id = 'demo-org'
    ) > 0 
    AND (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%intelligence%'
    ) > 0
    THEN '✅ READY - Platform is operational!' 
    ELSE '⚠️  INCOMPLETE - Run setup scripts' 
  END as status;