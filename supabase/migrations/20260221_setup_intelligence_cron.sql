-- ============================================================
-- INTELLIGENCE PIPELINE CRON JOBS
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Two independent jobs:
--   1. Signal processing (every 4h) — fetches articles, creates signals
--   2. Prediction generation (every 6h) — turns signals into predictions
--
-- Prerequisites: pg_cron and pg_net extensions must be enabled.
-- Go to Dashboard > Database > Extensions and enable both.
-- ============================================================

-- Enable extensions (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- JOB 1: Signal Processing — every 4 hours
-- Calls cron-intelligence-runner which processes 5 orgs per batch
-- (auto-rotates through all orgs with intelligence targets).
-- Takes ~30-50s per run.
-- ============================================================
SELECT cron.schedule(
  'intelligence-signals',
  '15 */4 * * *',          -- :15 past every 4th hour (0:15, 4:15, 8:15, ...)
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/cron-intelligence-runner',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"mode": "signals", "batch_size": 5}'::jsonb
  );
  $$
);

-- ============================================================
-- JOB 2: Prediction Generation — every 6 hours
-- Calls generate-outcome-predictions DIRECTLY (not through runner)
-- because it takes 2+ minutes (many Claude API calls).
-- Supabase edge functions have their own timeout that pg_net respects.
-- ============================================================
SELECT cron.schedule(
  'intelligence-predictions',
  '45 1,7,13,19 * * *',    -- :45 at 1am, 7am, 1pm, 7pm UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-outcome-predictions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"hours_back": 168}'::jsonb
  );
  $$
);

-- ============================================================
-- VERIFY: List all scheduled jobs
-- ============================================================
SELECT jobid, jobname, schedule, command
FROM cron.job
ORDER BY jobname;

-- ============================================================
-- ALTERNATIVE: If current_setting() doesn't work, hardcode values:
--
--   url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/cron-intelligence-runner',
--   headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
--
-- Find your service_role key at:
--   Dashboard > Settings > API > service_role key
-- ============================================================

-- ============================================================
-- USEFUL COMMANDS:
--
-- Check job run history:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Unschedule a job:
--   SELECT cron.unschedule('intelligence-signals');
--   SELECT cron.unschedule('intelligence-predictions');
--
-- Run signal processing NOW (for testing):
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/cron-intelligence-runner',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{"mode": "signals", "batch_size": 5, "offset": 0}'::jsonb
--   );
-- ============================================================
