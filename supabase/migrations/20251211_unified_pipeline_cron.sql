-- Unified Pipeline Cron Schedule
-- Replaces fragmented cron jobs with a single coordinated pipeline
--
-- Schedule: 4x daily at 5, 11, 17, 23 UTC
--   5 UTC  = 12:00 AM EST (midnight)
--   11 UTC = 6:00 AM EST  (morning - ready by 8 AM)
--   17 UTC = 12:00 PM EST (noon)
--   23 UTC = 6:00 PM EST  (evening)
--
-- Each run processes: Discovery → Worker → Metadata → Embedding → Matching
-- Completes in ~15-20 minutes with proper coordination between stages
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Remove old fragmented cron jobs
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('scraper-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-worker'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-1'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-2'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-3'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-4'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-5'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-6'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('match-signals'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('daily-pipeline'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STEP 2: Schedule unified pipeline (4x daily)
-- ============================================================================

-- Main pipeline runs: 5, 11, 17, 23 UTC
SELECT cron.schedule(
  'daily-pipeline',
  '0 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/daily-pipeline-orchestrator',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 3: Keep embed-targets daily (targets rarely change)
-- ============================================================================

SELECT cron.schedule(
  'embed-targets',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-embed-targets',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 4: Keep NewsAPI WSJ importer (2x daily)
-- ============================================================================

DO $$ BEGIN PERFORM cron.unschedule('newsapi-wsj-daily'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('newsapi-wsj-evening'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'newsapi-wsj-daily',
  '30 4,10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/newsapi-wsj-importer',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 5: Create pipeline_runs table for monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_type_status
  ON pipeline_runs(run_type, status, started_at DESC);

-- ============================================================================
-- STEP 6: Verify scheduled jobs
-- ============================================================================

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('daily-pipeline', 'embed-targets', 'newsapi-wsj-daily')
ORDER BY jobname;
