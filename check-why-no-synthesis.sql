-- Check why synthesis stage isn't completing

-- 1. Check synthesis stage attempts
SELECT 
  organization_name,
  stage_name,
  created_at,
  LENGTH(stage_data::text) as data_size,
  metadata
FROM intelligence_stage_data
WHERE stage_name = 'synthesis'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if all stages before synthesis completed for Dropbox
SELECT 
  stage_name,
  COUNT(*) as attempts,
  MAX(created_at) as most_recent
FROM intelligence_stage_data
WHERE organization_name = 'Dropbox'
  AND created_at > NOW() - INTERVAL '2 hours'
GROUP BY stage_name
ORDER BY most_recent ASC;

-- 3. Check the order of stages in recent run
SELECT 
  stage_name,
  created_at,
  EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at))) as seconds_since_previous
FROM intelligence_stage_data
WHERE organization_name = 'Dropbox'
  AND created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at ASC;