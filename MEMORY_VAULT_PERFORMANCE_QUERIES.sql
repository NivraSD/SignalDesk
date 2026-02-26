-- Memory Vault V2: Performance Dashboard Queries
-- Purpose: Monitor system health and performance
-- Usage: Run these in Supabase Dashboard → SQL Editor

-- =============================================================================
-- 1. SAVE PERFORMANCE (Should be < 200ms)
-- =============================================================================

-- Average save time over last hour
SELECT
  AVG(metric_value) as avg_save_time_ms,
  MIN(metric_value) as min_save_time_ms,
  MAX(metric_value) as max_save_time_ms,
  COUNT(*) as total_saves
FROM performance_metrics
WHERE metric_type = 'save_time'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Save time trend (last 24 hours, grouped by hour)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  AVG(metric_value) as avg_save_time_ms,
  COUNT(*) as saves_count
FROM performance_metrics
WHERE metric_type = 'save_time'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- =============================================================================
-- 2. INTELLIGENCE PROCESSING (Should complete within 10s)
-- =============================================================================

-- Average intelligence processing time
SELECT
  AVG(metric_value) as avg_processing_time_ms,
  MAX(metric_value) as max_processing_time_ms,
  COUNT(*) as total_processed
FROM performance_metrics
WHERE metric_type = 'intelligence_processing_time'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Intelligence status breakdown
SELECT
  intelligence_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM content_library
GROUP BY intelligence_status
ORDER BY count DESC;

-- =============================================================================
-- 3. JOB QUEUE HEALTH
-- =============================================================================

-- Current job queue status
SELECT
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts
FROM job_queue
GROUP BY status
ORDER BY
  CASE status
    WHEN 'processing' THEN 1
    WHEN 'pending' THEN 2
    WHEN 'failed' THEN 3
    WHEN 'completed' THEN 4
  END;

-- Job processing rate (last hour)
SELECT
  DATE_TRUNC('minute', completed_at) as minute,
  COUNT(*) as jobs_completed
FROM job_queue
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', completed_at)
ORDER BY minute DESC
LIMIT 60;

-- Failed jobs analysis
SELECT
  job_type,
  error,
  COUNT(*) as failure_count,
  MAX(created_at) as last_failure
FROM job_queue
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY job_type, error
ORDER BY failure_count DESC;

-- Oldest pending job (should be < 30 seconds old)
SELECT
  id,
  job_type,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) as age_seconds,
  attempts,
  priority
FROM job_queue
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 5;

-- =============================================================================
-- 4. CACHE PERFORMANCE
-- =============================================================================

-- Brand context cache hit rate (should be > 95%)
WITH cache_stats AS (
  SELECT
    metric_type,
    COUNT(*) as count
  FROM performance_metrics
  WHERE metric_type IN ('brand_context_cache_hit', 'brand_context_cache_miss')
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY metric_type
)
SELECT
  SUM(CASE WHEN metric_type = 'brand_context_cache_hit' THEN count ELSE 0 END) as hits,
  SUM(CASE WHEN metric_type = 'brand_context_cache_miss' THEN count ELSE 0 END) as misses,
  ROUND(
    SUM(CASE WHEN metric_type = 'brand_context_cache_hit' THEN count ELSE 0 END) * 100.0 /
    NULLIF(SUM(count), 0),
    2
  ) as hit_rate_percentage
FROM cache_stats;

-- =============================================================================
-- 5. CONTENT LIBRARY STATS
-- =============================================================================

-- Content by type
SELECT
  content_type,
  COUNT(*) as total_content,
  COUNT(CASE WHEN intelligence_status = 'complete' THEN 1 END) as with_intelligence,
  COUNT(CASE WHEN intelligence_status = 'pending' THEN 1 END) as pending_intelligence
FROM content_library
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY content_type
ORDER BY total_content DESC;

-- Content growth (last 30 days)
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as new_content
FROM content_library
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Most active folders
SELECT
  folder,
  COUNT(*) as content_count,
  MAX(created_at) as last_updated
FROM content_library
WHERE folder IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY folder
ORDER BY content_count DESC
LIMIT 10;

-- =============================================================================
-- 6. BRAND ASSETS
-- =============================================================================

-- Brand assets by organization
SELECT
  organization_id,
  asset_type,
  COUNT(*) as asset_count,
  SUM(usage_count) as total_usage
FROM brand_assets
WHERE status = 'active'
GROUP BY organization_id, asset_type
ORDER BY total_usage DESC;

-- Most used templates
SELECT
  ba.name,
  ba.asset_type,
  ba.usage_count,
  ba.last_used_at,
  ROUND(ba.success_rate, 2) as success_rate
FROM brand_assets ba
WHERE ba.status = 'active'
  AND ba.asset_type LIKE 'template-%'
ORDER BY ba.usage_count DESC
LIMIT 10;

-- =============================================================================
-- 7. SYSTEM HEALTH ALERTS
-- =============================================================================

-- Check 1: High average save time (> 500ms)
SELECT
  '⚠️ High Save Time' as alert,
  AVG(metric_value) as avg_ms,
  'Should be < 200ms' as threshold
FROM performance_metrics
WHERE metric_type = 'save_time'
  AND created_at > NOW() - INTERVAL '15 minutes'
HAVING AVG(metric_value) > 500;

-- Check 2: Job queue backup (> 100 pending jobs)
SELECT
  '⚠️ Job Queue Backup' as alert,
  COUNT(*) as pending_jobs,
  'Should be < 100' as threshold
FROM job_queue
WHERE status = 'pending'
HAVING COUNT(*) > 100;

-- Check 3: High failure rate (> 10% in last hour)
SELECT
  '⚠️ High Job Failure Rate' as alert,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*) as failure_rate_pct,
  'Should be < 10%' as threshold
FROM job_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*) > 10;

-- Check 4: Worker not processing (no completed jobs in 5 minutes)
SELECT
  '⚠️ Worker May Be Down' as alert,
  MAX(completed_at) as last_completed_job,
  'Should have jobs completed in last 5 min' as threshold
FROM job_queue
WHERE status = 'completed'
HAVING MAX(completed_at) < NOW() - INTERVAL '5 minutes';

-- Check 5: Intelligence stuck (> 10 items pending for > 10 minutes)
SELECT
  '⚠️ Intelligence Processing Stuck' as alert,
  COUNT(*) as stuck_items,
  MIN(created_at) as oldest_pending
FROM content_library
WHERE intelligence_status = 'pending'
  AND created_at < NOW() - INTERVAL '10 minutes'
HAVING COUNT(*) > 10;

-- =============================================================================
-- 8. QUICK DASHBOARD VIEW
-- =============================================================================

-- All-in-one health check
SELECT
  'Save Performance' as metric,
  ROUND(AVG(CASE WHEN pm.metric_type = 'save_time' AND pm.created_at > NOW() - INTERVAL '1 hour' THEN pm.metric_value END), 0) || 'ms' as value,
  '< 200ms' as target,
  CASE
    WHEN AVG(CASE WHEN pm.metric_type = 'save_time' AND pm.created_at > NOW() - INTERVAL '1 hour' THEN pm.metric_value END) < 200 THEN '✅'
    WHEN AVG(CASE WHEN pm.metric_type = 'save_time' AND pm.created_at > NOW() - INTERVAL '1 hour' THEN pm.metric_value END) < 500 THEN '⚠️'
    ELSE '❌'
  END as status
FROM performance_metrics pm

UNION ALL

SELECT
  'Pending Jobs',
  COUNT(*)::text,
  '< 100',
  CASE
    WHEN COUNT(*) < 50 THEN '✅'
    WHEN COUNT(*) < 100 THEN '⚠️'
    ELSE '❌'
  END
FROM job_queue WHERE status = 'pending'

UNION ALL

SELECT
  'Intelligence Complete Rate',
  ROUND(COUNT(CASE WHEN intelligence_status = 'complete' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) || '%',
  '> 90%',
  CASE
    WHEN COUNT(CASE WHEN intelligence_status = 'complete' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) > 90 THEN '✅'
    WHEN COUNT(CASE WHEN intelligence_status = 'complete' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) > 70 THEN '⚠️'
    ELSE '❌'
  END
FROM content_library WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT
  'Worker Active',
  CASE
    WHEN MAX(completed_at) > NOW() - INTERVAL '5 minutes' THEN 'Yes'
    ELSE 'No - Last: ' || TO_CHAR(MAX(completed_at), 'HH24:MI')
  END,
  'Last 5 min',
  CASE
    WHEN MAX(completed_at) > NOW() - INTERVAL '5 minutes' THEN '✅'
    ELSE '❌'
  END
FROM job_queue WHERE status = 'completed';

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================

/*
  Quick Health Check:
    Run the "Quick Dashboard View" query (#8)

  Performance Monitoring:
    Run queries #1-#3 every hour

  Troubleshooting:
    Run "System Health Alerts" (#7) to find issues
    Run "Failed jobs analysis" to see specific errors

  Optimization:
    Check cache hit rate (#4)
    Monitor job processing rate (#3)
    Track save time trends (#1)
*/
