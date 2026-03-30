-- CHECK WHAT'S ACTUALLY IN THE CLAUDE ANALYSIS

-- 1. Show a recent record with Claude analysis
SELECT 
  organization_name,
  stage_name,
  created_at,
  stage_data::text as full_data
FROM intelligence_stage_data
WHERE stage_name = 'competitor_analysis'
  AND stage_data::text LIKE '%claude_enhanced%'
  AND organization_name = 'Dropbox'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Check if the data has actual competitive intelligence
SELECT 
  organization_name,
  stage_name,
  created_at,
  CASE 
    WHEN stage_data::text LIKE '%Google Drive%' THEN '✅ Has real competitor (Google)'
    WHEN stage_data::text LIKE '%Microsoft%' THEN '✅ Has real competitor (Microsoft)'
    WHEN stage_data::text LIKE '%Box%' THEN '✅ Has real competitor (Box)'
    WHEN stage_data::text LIKE '%competitive_landscape%' THEN '📊 Has competitive structure'
    ELSE '❓ Check content'
  END as content_check,
  LEFT(stage_data::text, 500) as preview
FROM intelligence_stage_data
WHERE stage_name = 'competitor_analysis'
  AND organization_name = 'Dropbox'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Check why synthesis isn't running
SELECT 
  stage_name,
  organization_name,
  created_at,
  LENGTH(stage_data::text) as size
FROM intelligence_stage_data
WHERE stage_name = 'synthesis'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if monitoring data is being passed to stages
SELECT 
  organization_name,
  stage_name,
  metadata,
  created_at
FROM intelligence_stage_data
WHERE metadata IS NOT NULL
  AND created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC
LIMIT 5;