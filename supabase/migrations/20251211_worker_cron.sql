-- Worker Cron Job
-- Processes pending articles every 15 minutes with drain_queue mode
-- drain_queue=true loops until queue empty or 120s timeout (Edge Function limit is 150s)
-- This clears the queue much faster than single-batch mode

-- Clean up any existing worker job
DO $$ BEGIN PERFORM cron.unschedule('scraper-worker'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schedule worker to run every 15 minutes in drain mode
-- With drain_queue, processes ~100 articles per 2-minute run = up to 400+ articles/hour
SELECT cron.schedule(
  'scraper-worker',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-worker',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 10, "drain_queue": true}'::jsonb
  );
  $$
);

-- Verify
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'scraper-worker';
