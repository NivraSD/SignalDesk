-- Scale back pg_cron to plug Anthropic + Firecrawl cost leak
-- Run this in the Supabase SQL Editor.
--
-- WHY: morning + afternoon pipelines duplicate the Vercel cron (every 6h)
-- and together fired ~3x discovery (Firecrawl) + 3x AI passes per day across
-- ALL orgs. Scoping monitoring to Palantir/Mitsui/Nivria only via code-level
-- allowlists in the edge functions (see SCOPED_ORG_FILTER constants).
--
-- WHAT THIS DOES:
--   - Unschedules morning-* and afternoon-* jobs (discovery + AI pipeline)
--   - Keeps evening-* pipeline (one fresh-data pass per day)
--   - Keeps continuous-worker (every 15min, processes queued articles only)
--   - Keeps daily-embed-targets, daily-newsapi-wsj, daily-cleanup
--   - Vercel cron (every 6h at /api/cron/pipeline) continues to run AI
--     functions, but is now scoped to 3 orgs in code.
--
-- TO RE-ENABLE later: re-run 20251213_morning_delivery_cron.sql

-- Morning pipeline -------------------------------------------------------------
DO $$ BEGIN PERFORM cron.unschedule('morning-discovery-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-discovery-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-discovery-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-discovery-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-worker-1'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-worker-2'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-embedding'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-matching'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-facts'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-patterns'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-connections'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-predictions'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('morning-pre-generate'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Afternoon pipeline -----------------------------------------------------------
DO $$ BEGIN PERFORM cron.unschedule('afternoon-discovery-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('afternoon-discovery-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('afternoon-discovery-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('afternoon-discovery-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('afternoon-embedding'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('afternoon-matching'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('afternoon-facts'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Verify what's left
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
