-- CHECK FULL COMPETITOR ANALYSIS TO SEE WHAT CLAUDE IS GENERATING

-- Show the complete competitor analysis for Dropbox
SELECT 
  stage_data
FROM intelligence_stage_data
WHERE stage_name = 'competitor_analysis'
  AND organization_name = 'Dropbox'
  AND stage_data::text LIKE '%claude_enhanced%'
ORDER BY created_at DESC
LIMIT 1;