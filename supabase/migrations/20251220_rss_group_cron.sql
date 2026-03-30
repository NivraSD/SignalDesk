-- RSS Group Cron Jobs
-- Splits RSS discovery into 3 groups to avoid timeouts
-- Each group runs every 6 hours, staggered by 1 minute
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Remove old single RSS cron job
-- ============================================================================
DO $$
BEGIN
  PERFORM cron.unschedule('scraper-rss');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Also clean up any existing group jobs if re-running
DO $$
BEGIN
  PERFORM cron.unschedule('scraper-rss-g1');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('scraper-rss-g2');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('scraper-rss-g3');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Schedule 3 RSS Group Jobs
-- Run every 6 hours (0:00, 6:00, 12:00, 18:00 UTC)
-- Staggered: Group 1 at :00, Group 2 at :01, Group 3 at :02
-- Each processes ~57 sources (well within 120s timeout)
-- ============================================================================

-- RSS Group 1 (minute 0)
SELECT cron.schedule(
  'scraper-rss-g1',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss?group=1',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"group": 1}'::jsonb
  );
  $$
);

-- RSS Group 2 (minute 1)
SELECT cron.schedule(
  'scraper-rss-g2',
  '1 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss?group=2',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"group": 2}'::jsonb
  );
  $$
);

-- RSS Group 3 (minute 2)
SELECT cron.schedule(
  'scraper-rss-g3',
  '2 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss?group=3',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"group": 3}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 3: Verify scheduled jobs
-- ============================================================================
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'scraper-rss%'
ORDER BY jobname;
