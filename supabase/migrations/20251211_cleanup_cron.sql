-- Cleanup Old Articles Cron
-- Runs daily at 3 AM UTC to delete articles older than 72 hours
-- Also cleans up old batch_scrape_runs, pipeline_runs, and embedding_jobs

-- Remove old cleanup job if exists
DO $$ BEGIN PERFORM cron.unschedule('cleanup-old-articles'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Schedule daily cleanup at 3 AM UTC (10 PM EST)
SELECT cron.schedule(
  'cleanup-old-articles',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/cleanup-old-articles',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_to_keep": 72}'::jsonb
  );
  $$
);

-- Verify
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'cleanup-old-articles';
