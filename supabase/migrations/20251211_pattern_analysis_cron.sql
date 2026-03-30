-- Target Intelligence Cron Schedule
-- Runs after unified pipeline completes (pipeline runs at 5, 11, 17, 23 UTC)
--
-- Schedule aligned with daily-pipeline-orchestrator:
--   Pipeline: 5, 11, 17, 23 UTC (takes ~15-20 min)
--   Fact extraction: :25 past (after matching completes)
--   Pattern analysis: 11:30 UTC daily (after morning pipeline)
--   Connection detection: 11:35 UTC daily (after patterns)

-- ============================================================================
-- 1. EXTRACT TARGET FACTS - After each pipeline run (4x daily)
-- ============================================================================

DO $$ BEGIN PERFORM cron.unschedule('extract-target-facts'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Run at :25 past pipeline hours (after embedding/matching completes at ~:20)
SELECT cron.schedule(
  'extract-target-facts',
  '25 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/extract-target-facts',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_matches": 50}'::jsonb
  );
  $$
);

-- ============================================================================
-- 2. ANALYZE TARGET PATTERNS - Daily at 11:30 UTC (6:30 AM EST)
-- ============================================================================

DO $$ BEGIN PERFORM cron.unschedule('analyze-target-patterns'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Run once daily after morning pipeline + fact extraction complete
SELECT cron.schedule(
  'analyze-target-patterns',
  '30 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/analyze-target-patterns',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"min_facts": 3, "max_targets": 50}'::jsonb
  );
  $$
);

-- ============================================================================
-- 3. DETECT CROSS-TARGET CONNECTIONS - Daily at 11:35 UTC (after patterns)
-- ============================================================================

DO $$ BEGIN PERFORM cron.unschedule('detect-cross-target-connections'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Run once daily after pattern analysis
SELECT cron.schedule(
  'detect-cross-target-connections',
  '35 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/detect-cross-target-connections',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"min_facts": 2, "max_targets": 30}'::jsonb
  );
  $$
);

-- ============================================================================
-- 4. VERIFY SCHEDULED JOBS
-- ============================================================================

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('extract-target-facts', 'analyze-target-patterns', 'detect-cross-target-connections')
ORDER BY jobname;
