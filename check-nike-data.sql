-- Check for Nike-related content in intelligence_findings
-- Run this in Supabase SQL Editor to see if there's stale data

-- Check for Nike mentions in intelligence_findings
SELECT
  id,
  organization_id,
  title,
  source,
  published_at,
  created_at,
  relevance_score
FROM intelligence_findings
WHERE
  (title ILIKE '%nike%' OR
   description ILIKE '%nike%' OR
   content ILIKE '%nike%' OR
   summary ILIKE '%nike%')
ORDER BY created_at DESC
LIMIT 50;

-- Check which organizations have intelligence findings
SELECT
  organization_id,
  COUNT(*) as findings_count,
  MAX(created_at) as latest_finding,
  MIN(published_at) as oldest_article,
  MAX(published_at) as newest_article
FROM intelligence_findings
GROUP BY organization_id
ORDER BY latest_finding DESC;

-- Check for recent intelligence runs
SELECT
  organization_id,
  COUNT(*) as recent_findings,
  MAX(created_at) as last_run,
  MIN(published_at) as oldest_article_date,
  MAX(published_at) as newest_article_date
FROM intelligence_findings
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY organization_id;
