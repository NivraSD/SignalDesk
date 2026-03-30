-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run NewsAPI WSJ importer daily at 6 AM UTC
-- This fetches fresh WSJ articles and imports them into raw_articles
SELECT cron.schedule(
  'newsapi-wsj-daily',
  '0 6 * * *',  -- Every day at 6:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/newsapi-wsj-importer',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Also run it at 6 PM UTC for twice-daily updates
SELECT cron.schedule(
  'newsapi-wsj-evening',
  '0 18 * * *',  -- Every day at 6:00 PM UTC
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/newsapi-wsj-importer',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
