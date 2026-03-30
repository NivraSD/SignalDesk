-- Intelligence Learning System Cron Schedule
-- Runs prediction generation, validation, and pattern detection
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- REMOVE OLD JOBS IF THEY EXIST
-- ============================================================================

DO $$ BEGIN PERFORM cron.unschedule('generate-predictions'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('validate-predictions'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('compute-amplification'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('detect-cascades'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 1. GENERATE OUTCOME PREDICTIONS - 4x daily after pattern analysis
-- Runs at :45 past 5, 11, 17, 23 UTC (after signals are created)
-- ============================================================================

SELECT cron.schedule(
  'generate-predictions',
  '45 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/generate-outcome-predictions',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_back": 12, "max_signals": 30}'::jsonb
  );
  $$
);

-- ============================================================================
-- 2. VALIDATE OUTCOME PREDICTIONS - Daily at 10 UTC
-- Checks if predictions came true by searching recent articles
-- ============================================================================

SELECT cron.schedule(
  'validate-predictions',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/validate-outcome-predictions',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_predictions": 50}'::jsonb
  );
  $$
);

-- ============================================================================
-- 3. COMPUTE ENTITY AMPLIFICATION - Every 6 hours
-- Finds entities appearing across multiple organizations
-- ============================================================================

SELECT cron.schedule(
  'compute-amplification',
  '0 2,8,14,20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/compute-entity-amplification',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"lookback_days": 30}'::jsonb
  );
  $$
);

-- ============================================================================
-- 4. DETECT CASCADE PATTERNS - 2x daily
-- Matches signals against known patterns and creates alerts
-- ============================================================================

SELECT cron.schedule(
  'detect-cascades',
  '50 6,18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/detect-cascade-patterns',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"lookback_hours": 24}'::jsonb
  );
  $$
);

-- ============================================================================
-- VERIFY SCHEDULED JOBS
-- ============================================================================

SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('generate-predictions', 'validate-predictions', 'compute-amplification', 'detect-cascades')
ORDER BY jobname;
