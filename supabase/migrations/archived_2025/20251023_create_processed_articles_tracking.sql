-- Processed Articles Tracking
-- Prevents duplicate processing across daily runs
-- Tracks article URLs processed per organization

CREATE TABLE IF NOT EXISTS processed_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  article_url text NOT NULL,
  article_title text,
  processed_at timestamptz DEFAULT now(),
  source text,
  stage text DEFAULT 'monitor-stage-1', -- which stage processed it

  -- For cleanup queries
  created_at timestamptz DEFAULT now(),

  -- Prevent duplicate URL processing per org
  UNIQUE(organization_id, article_url)
);

-- Index for fast lookups during deduplication
CREATE INDEX IF NOT EXISTS idx_processed_articles_org_url
  ON processed_articles(organization_id, article_url);

-- Index for cleanup queries (delete old entries)
CREATE INDEX IF NOT EXISTS idx_processed_articles_created
  ON processed_articles(created_at);

-- Index for quick lookups by org (to get recent articles)
CREATE INDEX IF NOT EXISTS idx_processed_articles_org_recent
  ON processed_articles(organization_id, processed_at DESC);

-- Enable RLS
ALTER TABLE processed_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role can manage processed articles"
  ON processed_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up old processed articles (7 days retention)
CREATE OR REPLACE FUNCTION cleanup_old_processed_articles()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM processed_articles
  WHERE created_at < now() - interval '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE processed_articles IS 'Tracks processed article URLs to prevent duplicate processing across daily runs';
COMMENT ON FUNCTION cleanup_old_processed_articles() IS 'Cleans up processed articles older than 7 days. Run this periodically via cron.';
