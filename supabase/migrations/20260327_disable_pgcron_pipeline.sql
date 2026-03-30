-- Disable pg_cron pipeline jobs that overlap with Vercel Cron (/api/cron/pipeline)
-- The Vercel cron runs every 6h and calls the same edge functions.
-- Having both caused double Claude API usage since March 14, 2026.

-- These are the AI-heavy jobs that the Vercel cron already handles:
SELECT cron.unschedule('extract-facts');      -- was every 2h, calls extract-target-facts (Claude)
SELECT cron.unschedule('analyze-patterns');    -- was daily 8am, calls analyze-target-patterns (Claude)

-- Keep discovery, scraping, embedding, and cleanup jobs — those don't use Claude
-- and aren't duplicated by Vercel cron.
