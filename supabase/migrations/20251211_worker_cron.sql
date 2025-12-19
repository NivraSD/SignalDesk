-- Parallel Worker Cron Job
-- Launches 3 parallel workers every 3 minutes for maximum throughput
-- Each worker: drain_queue=true, loops until queue empty or 120s timeout
-- 3 workers × ~100 articles each × 20 runs/hour = ~6000 articles/hour throughput

-- Clean up any existing worker jobs
DO $$ BEGIN PERFORM cron.unschedule('scraper-worker'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('parallel-scraper'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schedule parallel launcher to run every 3 minutes
-- Launches 3 workers in parallel, each running in drain mode
SELECT cron.schedule(
  'parallel-scraper',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/parallel-scraper-launcher',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"workers": 3, "batch_size": 10, "drain_queue": true}'::jsonb
  );
  $$
);

-- Verify
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'parallel-scraper';
