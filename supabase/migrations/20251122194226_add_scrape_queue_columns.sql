-- Add columns for scrape queue management to raw_articles table
-- This enables the V5 batch scraping orchestrator + worker pattern

-- Add queue management columns
ALTER TABLE raw_articles
  ADD COLUMN IF NOT EXISTS scrape_priority INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS scrape_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_scrape_attempt TIMESTAMPTZ;

-- Add helpful comments
COMMENT ON COLUMN raw_articles.scrape_priority IS 'Priority for scraping: 1=high (Tier 1 sources), 2=medium (Tier 2), 3=low (Tier 3)';
COMMENT ON COLUMN raw_articles.scrape_status IS 'Scrape queue status: pending, processing, completed, failed';
COMMENT ON COLUMN raw_articles.scrape_attempts IS 'Number of times scraping was attempted';
COMMENT ON COLUMN raw_articles.last_scrape_attempt IS 'Timestamp of most recent scrape attempt';

-- Create index for efficient worker queries (finds pending articles sorted by priority)
CREATE INDEX IF NOT EXISTS idx_raw_articles_scrape_queue
  ON raw_articles(scrape_status, scrape_priority, created_at)
  WHERE full_content IS NULL;

-- Create index for retry queries (finds failed articles eligible for retry)
CREATE INDEX IF NOT EXISTS idx_raw_articles_scrape_retry
  ON raw_articles(scrape_status, scrape_attempts, last_scrape_attempt)
  WHERE full_content IS NULL AND scrape_attempts < 3;

-- Set priority based on source tier for existing records
UPDATE raw_articles ra
SET scrape_priority = sr.tier
FROM source_registry sr
WHERE ra.source_id = sr.id
  AND ra.scrape_priority = 2;  -- Only update records with default priority

-- Update existing completed articles
UPDATE raw_articles
SET scrape_status = 'completed'
WHERE full_content IS NOT NULL
  AND scrape_status = 'pending';
