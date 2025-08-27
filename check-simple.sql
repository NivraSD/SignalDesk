-- SIMPLE SYSTEM CHECK
-- Run each section separately if needed

-- 1. What tables exist?
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2. Check intelligence_stage_data columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'intelligence_stage_data';

-- 3. Count records
SELECT COUNT(*) as total_stage_records FROM intelligence_stage_data;

-- 4. Recent data (last 5 records)
SELECT * FROM intelligence_stage_data ORDER BY created_at DESC LIMIT 5;

-- 5. Check for Claude in stage_data
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN stage_data::text LIKE '%claude_enhanced%' THEN 1 END) as has_claude,
    COUNT(CASE WHEN stage_data::text LIKE '%competitive%' THEN 1 END) as has_competitive,
    COUNT(CASE WHEN stage_data::text LIKE '%media%' THEN 1 END) as has_media
FROM intelligence_stage_data;

-- 6. Check monitoring_results
SELECT COUNT(*) as monitoring_count FROM monitoring_results;

-- 7. Check source_registry
SELECT COUNT(*) as sources_count FROM source_registry;