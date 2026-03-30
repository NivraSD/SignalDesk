-- Complete Pipeline Cron Schedule
-- Individual jobs that run independently (no orchestrator - it times out)
--
-- FULL PIPELINE:
-- 1. Discovery (RSS, Sitemap, Fireplexity, CSE) - 4x daily
-- 2. Worker (scrape pending articles) - every 15 min
-- 3. Embedding (embed articles) - every 30 min
-- 4. Matching (match articles to targets) - hourly
-- 5. Fact Extraction (extract facts from matches) - every 2 hours
-- 6. Pattern Analysis (analyze accumulated facts) - daily
-- 7. Cross-Target Connections (find links between targets) - daily
-- 8. Cleanup (remove old articles) - daily
-- 9. Target Embedding (embed new targets) - daily
-- 10. NewsAPI WSJ (import WSJ articles) - 2x daily
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- STEP 1: Remove ALL old cron jobs (clean slate)
-- ============================================================================
DO $$ BEGIN PERFORM cron.unschedule('scraper-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('scraper-worker'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-1'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-2'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-3'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-4'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-5'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-articles-morning-6'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('match-signals'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('daily-pipeline'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('embed-targets'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('newsapi-wsj-daily'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('discovery-rss'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('discovery-sitemap'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('discovery-fireplexity'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('discovery-cse'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('worker-scraper'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('extract-facts'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('analyze-patterns'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('detect-connections'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN PERFORM cron.unschedule('cleanup-articles'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- STEP 2: DISCOVERY - 4x daily at 5, 11, 17, 23 UTC
-- ============================================================================

-- RSS Discovery (minute 0)
SELECT cron.schedule(
  'discovery-rss',
  '0 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-rss',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Sitemap Discovery (minute 2)
SELECT cron.schedule(
  'discovery-sitemap',
  '2 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-sitemap',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Fireplexity Discovery (minute 4)
SELECT cron.schedule(
  'discovery-fireplexity',
  '4 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-fireplexity',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- CSE Discovery (minute 6)
SELECT cron.schedule(
  'discovery-cse',
  '6 5,11,17,23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-orchestrator-cse',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 3: WORKER - Every 15 minutes (processes pending articles)
-- ============================================================================
SELECT cron.schedule(
  'worker-scraper',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-scraper-v5-worker',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 50}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 4: EMBEDDING - Every 30 minutes (at :10 and :40)
-- ============================================================================
SELECT cron.schedule(
  'embed-articles',
  '10,40 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-embed-articles',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_size": 100, "max_batches": 5, "hours_back": 48}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 5: MATCHING - Every hour (at :20)
-- ============================================================================
SELECT cron.schedule(
  'match-signals',
  '20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-match-signals',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_back": 48}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 6: FACT EXTRACTION - Every 2 hours (at :30)
-- ============================================================================
SELECT cron.schedule(
  'extract-facts',
  '30 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/extract-target-facts',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_matches": 50}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 7: PATTERN ANALYSIS - Daily at 8 UTC (3 AM EST)
-- ============================================================================
SELECT cron.schedule(
  'analyze-patterns',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/analyze-target-patterns',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"max_targets": 20, "min_facts": 2}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 8: CROSS-TARGET CONNECTIONS - Daily at 9 UTC (4 AM EST)
-- ============================================================================
SELECT cron.schedule(
  'detect-connections',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/detect-cross-target-connections',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 9: CLEANUP OLD ARTICLES - Daily at 3 UTC (10 PM EST)
-- ============================================================================
SELECT cron.schedule(
  'cleanup-articles',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/cleanup-old-articles',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{"hours_to_keep": 72}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 10: TARGET EMBEDDING - Daily at 7 UTC (2 AM EST)
-- ============================================================================
SELECT cron.schedule(
  'embed-targets',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/batch-embed-targets',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 11: NewsAPI WSJ Import - 2x daily at 4:30 and 10:30 UTC
-- ============================================================================
SELECT cron.schedule(
  'newsapi-wsj-daily',
  '30 4,10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/newsapi-wsj-importer',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- STEP 12: Fix stuck batch_scrape_runs
-- ============================================================================
UPDATE batch_scrape_runs
SET status = 'failed',
    completed_at = NOW(),
    error_summary = '[{"error": "Timed out - marked as failed by cleanup"}]'::jsonb
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '30 minutes';

-- ============================================================================
-- STEP 13: Create pipeline_runs table if not exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_type_status
  ON pipeline_runs(run_type, status, started_at DESC);

-- ============================================================================
-- STEP 14: Create target_intelligence_facts table if not exists
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_intelligence_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  article_id UUID REFERENCES raw_articles(id) ON DELETE SET NULL,
  match_id UUID REFERENCES target_article_matches(id) ON DELETE SET NULL,
  fact_type TEXT NOT NULL,
  fact_summary TEXT NOT NULL,
  entities_mentioned TEXT[],
  relationships_detected JSONB,
  sentiment_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  significance_score INTEGER,
  geographic_region TEXT,
  industry_sector TEXT,
  article_title TEXT,
  article_source TEXT,
  article_published_at TIMESTAMPTZ,
  extraction_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_target_facts_org ON target_intelligence_facts(organization_id);
CREATE INDEX IF NOT EXISTS idx_target_facts_target ON target_intelligence_facts(target_id);
CREATE INDEX IF NOT EXISTS idx_target_facts_type ON target_intelligence_facts(fact_type);
CREATE INDEX IF NOT EXISTS idx_target_facts_created ON target_intelligence_facts(created_at DESC);

-- ============================================================================
-- STEP 15: Add facts_extracted column to target_article_matches if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'target_article_matches'
                 AND column_name = 'facts_extracted') THEN
    ALTER TABLE target_article_matches ADD COLUMN facts_extracted BOOLEAN DEFAULT FALSE;
    ALTER TABLE target_article_matches ADD COLUMN facts_extracted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- STEP 16: Add fact_count column to intelligence_targets if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'intelligence_targets'
                 AND column_name = 'fact_count') THEN
    ALTER TABLE intelligence_targets ADD COLUMN fact_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- STEP 17: Create trigger to update fact_count on intelligence_targets
-- ============================================================================
CREATE OR REPLACE FUNCTION update_target_fact_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE intelligence_targets
    SET fact_count = COALESCE(fact_count, 0) + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE intelligence_targets
    SET fact_count = GREATEST(0, COALESCE(fact_count, 0) - 1)
    WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_target_fact_count ON target_intelligence_facts;
CREATE TRIGGER trg_update_target_fact_count
AFTER INSERT OR DELETE ON target_intelligence_facts
FOR EACH ROW EXECUTE FUNCTION update_target_fact_count();

-- Backfill fact_count for existing data
UPDATE intelligence_targets it
SET fact_count = (
  SELECT COUNT(*)
  FROM target_intelligence_facts tif
  WHERE tif.target_id = it.id
);

-- ============================================================================
-- STEP 18: Verify scheduled jobs
-- ============================================================================
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
