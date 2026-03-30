-- Independent Pipeline Cron Jobs
-- Replaces the unified orchestrator with separate jobs that don't timeout
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Remove the unified orchestrator cron (it times out)
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('daily-pipeline'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STEP 2: Schedule discovery jobs (4x daily at 5, 11, 17, 23 UTC)
-- Each runs independently and completes in under 2 minutes
-- ============================================================================

-- RSS Discovery
DO $$ BEGIN PERFORM cron.unschedule('discovery-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'discovery-rss',
  '0 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Sitemap Discovery (2 minutes after RSS)
DO $$ BEGIN PERFORM cron.unschedule('discovery-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'discovery-sitemap',
  '2 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-sitemap',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Fireplexity Discovery (4 minutes after RSS)
DO $$ BEGIN PERFORM cron.unschedule('discovery-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'discovery-fireplexity',
  '4 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-fireplexity',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- CSE Discovery (6 minutes after RSS)
DO $$ BEGIN PERFORM cron.unschedule('discovery-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'discovery-cse',
  '6 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 3: Worker runs every 15 minutes to process pending articles
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('worker-scraper'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'worker-scraper',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-worker',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 50}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 4: Embedding runs every 30 minutes
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('embed-articles'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'embed-articles',
  '10,40 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-embed-articles',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 100, "max_batches": 5, "hours_back": 48}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 5: Signal matching runs every hour
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('match-signals'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'match-signals',
  '20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-match-signals',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_back": 48}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 6: Keep embed-targets daily (targets rarely change)
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('embed-targets'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
-- STEP 7: Fix stuck batch_scrape_runs
-- ============================================================================
UPDATE batch_scrape_runs
SET status = 'failed',
    completed_at = NOW(),
    error_summary = '[{"error": "Timed out - marked as failed by cleanup"}]'::jsonb
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '30 minutes';

-- ============================================================================
-- STEP 8: Create pipeline_runs table if not exists
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
-- STEP 9: Verify scheduled jobs
-- ============================================================================
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'discovery-rss',
  'discovery-sitemap',
  'discovery-fireplexity',
  'discovery-cse',
  'worker-scraper',
  'embed-articles',
  'match-signals',
  'embed-targets'
)
ORDER BY jobname;
