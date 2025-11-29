-- Backfill published_at from raw_metadata for existing articles
-- Extract from publishedTime, article:published_time, datePublished, or dateCreated

UPDATE raw_articles
SET published_at = COALESCE(
  raw_metadata->>'publishedTime',
  raw_metadata->>'article:published_time',
  raw_metadata->>'datePublished',
  raw_metadata->>'dateCreated'
)
WHERE published_at IS NULL
  AND raw_metadata IS NOT NULL
  AND (
    raw_metadata->>'publishedTime' IS NOT NULL OR
    raw_metadata->>'article:published_time' IS NOT NULL OR
    raw_metadata->>'datePublished' IS NOT NULL OR
    raw_metadata->>'dateCreated' IS NOT NULL
  );
