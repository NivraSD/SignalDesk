-- CHECK INTELLIGENCE PIPELINE STAGES SPECIFICALLY

-- 1. Check for Claude analysis markers
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN stage_data::text LIKE '%claude_enhanced%' THEN 1 END) as has_claude_marker,
    COUNT(CASE WHEN LENGTH(stage_data::text) > 500 THEN 1 END) as has_substantial_data,
    COUNT(CASE WHEN stage_data::text = '{}' THEN 1 END) as empty_records
FROM intelligence_stage_data;

-- 2. Show intelligence stages (not opportunities)
SELECT DISTINCT 
    stage_name,
    COUNT(*) as count,
    MAX(created_at) as most_recent
FROM intelligence_stage_data
GROUP BY stage_name
ORDER BY most_recent DESC;

-- 3. Show recent INTELLIGENCE stages (exclude opportunities)
SELECT 
  organization_name,
  stage_name,
  created_at,
  LENGTH(stage_data::text) as data_size,
  CASE 
    WHEN stage_data::text LIKE '%claude_enhanced%' THEN '✅ HAS CLAUDE'
    WHEN LENGTH(stage_data::text) > 1000 THEN '📊 HAS DATA'
    WHEN stage_data::text = '{}' THEN '❌ EMPTY'
    ELSE '❓ UNKNOWN'
  END as status
FROM intelligence_stage_data
WHERE stage_name IN ('competitor_analysis', 'media_analysis', 'regulatory_analysis', 'trends_analysis', 'synthesis', 'extraction')
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check today's intelligence stages
SELECT 
  organization_name,
  stage_name,
  created_at,
  LEFT(stage_data::text, 200) as preview
FROM intelligence_stage_data
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND stage_name NOT LIKE '%opportunit%'
ORDER BY created_at DESC
LIMIT 5;

-- 5. CRITICAL: Check if monitoring sources are active
SELECT 
    source_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM source_registry
GROUP BY source_type;

-- 6. Check if monitoring configs have API keys
SELECT 
    config_type,
    is_active,
    CASE 
        WHEN config_data::text LIKE '%fc-3048810124b640eb99293880a4ab25d0%' THEN '✅ Has Firecrawl key'
        WHEN config_data::text LIKE '%api_key%' THEN '🔑 Has some API key'
        ELSE '❌ No API key'
    END as api_status
FROM monitoring_configs
WHERE is_active = true;