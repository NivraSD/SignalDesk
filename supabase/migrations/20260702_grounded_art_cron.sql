-- Schedule the grounded-art edge function to generate a new piece every
-- 2 hours between 06:00 and 22:00 UTC. Previously lived only in the
-- Supabase dashboard (or in a Vercel cron that isn't wired up) and
-- silently disappeared, which is why `latest` kept returning stale art.
--
-- The edge function itself already:
--   - Fetches the 20 most recent titles and instructs Gemini to avoid
--     resembling them, so every call gets a fresh title.
--   - Generates a fresh palette/texture/composition and passes them
--     into Gemini's image model, so every image is new.
--
-- Title text is composited onto the image on-the-fly by the Next.js
-- route (/api/grounded-art?format=image) when the wallpaper is fetched.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent unschedule of any prior 'grounded-art-generate' job
DO $$
DECLARE j RECORD;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'grounded-art-generate' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'grounded-art-generate',
  '0 6,8,10,12,14,16,18,20,22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/grounded-art',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-KEY', 'd677fcd4-7d0f-4e99-b53e-5243e9f99fea'
    ),
    body := jsonb_build_object('action', 'generate')::jsonb
  );
  $$
);
