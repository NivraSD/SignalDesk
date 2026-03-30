-- Embedding Pipeline Cron Jobs + Updated Scraping Schedule
-- Aligned for system ready by 8am EST
--
-- Schedule Overview (EST / UTC):
--   Discovery:     6:00 AM, 12:00 PM, 6:00 PM, 12:00 AM EST  →  11, 17, 23, 5 UTC
--   Worker:        Every 15 minutes (unchanged)
--   Embed Articles: 7:00 AM, 1:00 PM, 7:00 PM, 1:00 AM EST  →  0, 6, 12, 18 UTC
--   Match Signals:  7:15 AM, 1:15 PM, 7:15 PM, 1:15 AM EST  →  0:15, 6:15, 12:15, 18:15 UTC
--   Embed Targets:  2:00 AM EST  →  7 UTC (daily)
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Clean up existing scraper jobs (will recreate with new schedule)
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('scraper-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Clean up any existing embedding jobs
DO $$ BEGIN PERFORM cron.unschedule('embed-articles'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-targets'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('match-signals'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STEP 2: Schedule Discovery Orchestrators
-- Run at 5, 11, 17, 23 UTC (12am, 6am, 12pm, 6pm EST)
-- Staggered by 2 minutes to avoid conflicts
-- ============================================================================

-- RSS Discovery (minute 0)
SELECT cron.schedule(
  'scraper-rss',
  '0 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Sitemap Discovery (minute 2)
SELECT cron.schedule(
  'scraper-sitemap',
  '2 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-sitemap',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Fireplexity Discovery (minute 4)
SELECT cron.schedule(
  'scraper-fireplexity',
  '4 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-fireplexity',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- CSE Discovery (minute 6)
SELECT cron.schedule(
  'scraper-cse',
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
-- STEP 3: Schedule Embedding Pipeline
-- Runs 1 hour after discovery to allow scraping to complete
-- ============================================================================

-- Embed Articles: 0, 6, 12, 18 UTC (7am, 1pm, 7pm, 1am EST)
SELECT cron.schedule(
  'embed-articles',
  '0 0,6,12,18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-embed-articles',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 100}'::jsonb
  );
  $$
);

-- Match Signals: Every 3 hours at :15 to minimize gaps
-- Runs at: 0:15, 3:15, 6:15, 9:15, 12:15, 15:15, 18:15, 21:15 UTC
SELECT cron.schedule(
  'match-signals',
  '15 */3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-match-signals',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_back": 24, "max_articles": 100}'::jsonb
  );
  $$
);

-- Embed Targets: Daily at 7 UTC (2am EST) - targets rarely change
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
-- STEP 4: Verify all scheduled jobs
-- ============================================================================
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'scraper-%'
   OR jobname LIKE 'embed-%'
   OR jobname LIKE 'match-%'
ORDER BY jobname;
