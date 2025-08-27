-- RUN THIS ENTIRE QUERY AT ONCE TO GET FULL SYSTEM STATUS

WITH table_counts AS (
  SELECT 'intelligence_stage_data' as table_name, COUNT(*) as count FROM intelligence_stage_data
  UNION ALL
  SELECT 'monitoring_results', COUNT(*) FROM monitoring_results  
  UNION ALL
  SELECT 'source_registry', COUNT(*) FROM source_registry
  UNION ALL
  SELECT 'monitoring_configs', COUNT(*) FROM monitoring_configs
  UNION ALL
  SELECT 'organization_profiles', COUNT(*) FROM organization_profiles
),
recent_stage_data AS (
  SELECT 
    COUNT(*) as last_24h_count,
    MAX(created_at) as most_recent
  FROM intelligence_stage_data
  WHERE created_at > NOW() - INTERVAL '24 hours'
),
claude_check AS (
  SELECT 
    COUNT(CASE WHEN stage_data::text LIKE '%claude_enhanced%' THEN 1 END) as has_claude_marker,
    COUNT(CASE WHEN LENGTH(stage_data::text) > 1000 THEN 1 END) as has_substantial_data,
    COUNT(CASE WHEN stage_data::text = '{}' OR stage_data::text IS NULL THEN 1 END) as empty_data
  FROM intelligence_stage_data
)

SELECT 
  '=================== SYSTEM STATUS REPORT ===================' as report;

SELECT * FROM table_counts;

SELECT 
  '--- Recent Activity ---' as section,
  last_24h_count,
  most_recent,
  CASE 
    WHEN most_recent > NOW() - INTERVAL '1 hour' THEN '✅ ACTIVE'
    WHEN most_recent > NOW() - INTERVAL '24 hours' THEN '⚠️ STALE' 
    ELSE '❌ INACTIVE'
  END as status
FROM recent_stage_data;

SELECT 
  '--- Claude Analysis Check ---' as section,
  has_claude_marker,
  has_substantial_data,
  empty_data,
  CASE
    WHEN has_claude_marker > 0 THEN '✅ CLAUDE IS WORKING'
    WHEN has_substantial_data > 0 THEN '⚠️ DATA EXISTS BUT NO CLAUDE'
    ELSE '❌ NO ANALYSIS HAPPENING'
  END as claude_status
FROM claude_check;

-- Show a sample of recent data
SELECT 
  '--- Last 3 Stage Data Records ---' as section;
  
SELECT 
  organization_name,
  stage_name,
  created_at,
  LENGTH(stage_data::text) as data_size,
  LEFT(stage_data::text, 200) as preview
FROM intelligence_stage_data
ORDER BY created_at DESC
LIMIT 3;