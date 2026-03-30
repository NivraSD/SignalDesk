-- Parallel Pipeline Cron Jobs
-- Uses parallel-fact-extractor to ensure ALL orgs get processed, not just high-volume ones
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Remove old individual fact extraction cron jobs
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('extract-facts'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('extract-target-facts'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('analyze-patterns'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('analyze-target-patterns'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STEP 2: PARALLEL FACT EXTRACTION - Every 2 hours
-- This ensures EVERY org with pending matches gets processed
-- ============================================================================
SELECT cron.schedule(
  'parallel-fact-extractor',
  '30 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/parallel-fact-extractor',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_per_org": 30}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 3: PATTERN ANALYSIS - Every 6 hours (was once daily)
-- Increased frequency and max_targets to ensure all orgs get coverage
-- ============================================================================
SELECT cron.schedule(
  'analyze-patterns-parallel',
  '45 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/analyze-target-patterns',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_targets": 100, "min_facts": 2}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 4: Verify scheduled jobs
-- ============================================================================
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('parallel-fact-extractor', 'analyze-patterns-parallel')
ORDER BY jobname;
