-- Add extracted_metadata column to raw_articles for organization-agnostic metadata
-- This enables fast filtering before expensive operations

ALTER TABLE raw_articles
ADD COLUMN IF NOT EXISTS extracted_metadata JSONB;

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_raw_articles_extracted_metadata_temporal
ON raw_articles ((extracted_metadata->'temporal'->>'is_within_24h'));

CREATE INDEX IF NOT EXISTS idx_raw_articles_extracted_metadata_industries
ON raw_articles USING gin ((extracted_metadata->'industries'));

CREATE INDEX IF NOT EXISTS idx_raw_articles_extracted_metadata_topics
ON raw_articles USING gin ((extracted_metadata->'topics'));

-- Add comment
COMMENT ON COLUMN raw_articles.extracted_metadata IS
'Organization-agnostic metadata extracted from article content. Includes entities, topics, industries, temporal data, and signals. Used for fast pre-filtering before expensive AI operations.';
