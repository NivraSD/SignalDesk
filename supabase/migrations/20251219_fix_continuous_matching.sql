-- Fix Continuous Matching and Embedding
-- Problem: The morning_delivery_cron only runs embedding/matching 3x daily
-- But the worker scrapes articles every 15 minutes
-- This causes huge gaps where fresh articles don't get matched
--
-- Solution: Add continuous embedding and matching every 30-60 minutes
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Add CONTINUOUS embedding (every 30 min at :10 and :40)
-- This ensures articles scraped by the continuous worker get embedded quickly
-- ============================================================================

-- Remove any old continuous embedding job
DO $$ BEGIN PERFORM cron.unschedule('continuous-embedding'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'continuous-embedding',
  '10,40 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-embed-articles',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 50, "max_batches": 3, "hours_back": 24}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 2: Add CONTINUOUS matching (hourly at :20)
-- This ensures embedded articles get matched to targets quickly
-- ============================================================================

-- Remove any old continuous matching job
DO $$ BEGIN PERFORM cron.unschedule('continuous-matching'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'continuous-matching',
  '20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-match-signals',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_back": 24}'::jsonb
  );
  $$
);

-- ============================================================================
-- Timeline now with fixes:
-- Worker:     */15 minutes (existing - scrapes pending articles)
-- Embedding:  :10 and :40 (NEW continuous + existing 3x daily)
-- Matching:   :20 every hour (NEW continuous + existing 3x daily)
--
-- Example flow for an article discovered at 14:05 UTC:
-- - 14:15: Worker scrapes it
-- - 14:40: Embedding processes it
-- - 15:20: Matching matches it to targets
-- - Ready for next brief generation!
-- ============================================================================

-- Verify the new jobs were created
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('continuous-embedding', 'continuous-matching')
ORDER BY jobname;
