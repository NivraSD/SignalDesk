-- RUN EACH QUERY SEPARATELY

-- QUERY 1: Check intelligence_stage_data columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'intelligence_stage_data';

-- QUERY 2: Count records in intelligence_stage_data
SELECT COUNT(*) as total_stage_records FROM intelligence_stage_data;

-- QUERY 3: Count records in monitoring_results
SELECT COUNT(*) as monitoring_count FROM monitoring_results;

-- QUERY 4: Show last 3 records from intelligence_stage_data
SELECT 
  organization_name,
  stage_name,
  created_at,
  LENGTH(stage_data::text) as data_size
FROM intelligence_stage_data
ORDER BY created_at DESC
LIMIT 3;

-- QUERY 5: Check for Claude in the data
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN stage_data::text LIKE '%claude_enhanced%' THEN 1 END) as has_claude,
    COUNT(CASE WHEN LENGTH(stage_data::text) > 500 THEN 1 END) as has_real_data,
    COUNT(CASE WHEN stage_data::text = '{}' THEN 1 END) as empty_records
FROM intelligence_stage_data;

-- QUERY 6: Check what's in monitoring_results
SELECT COUNT(*) FROM monitoring_results;

-- QUERY 7: Check source_registry status  
SELECT 
    COUNT(*) as total_sources,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_sources
FROM source_registry;

-- QUERY 8: Check recent activity (last 24 hours)
SELECT 
    COUNT(*) as records_last_24h,
    MAX(created_at) as most_recent_record
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '24 hours';

-- QUERY 9: Show what stage names we have
SELECT DISTINCT stage_name 
FROM intelligence_stage_data
WHERE stage_name IS NOT NULL;

-- QUERY 10: Check if monitoring is configured
SELECT 
    config_type,
    is_active,
    created_at
FROM monitoring_configs
LIMIT 5;