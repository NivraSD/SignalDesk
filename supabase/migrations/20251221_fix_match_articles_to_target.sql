-- Fix match_articles_to_target:
-- 1. Remove scrape_status = 'completed' filter - articles with embeddings should match even if scrape failed
-- 2. Use COALESCE for date filtering (published_at or created_at)
-- 3. Use generous 7-day window - matching system handles freshness via matched_at

CREATE OR REPLACE FUNCTION match_articles_to_target(
  target_embedding vector(1024),
  similarity_threshold float DEFAULT 0.35,
  max_results int DEFAULT 50,
  since_time timestamptz DEFAULT NOW() - INTERVAL '7 days'
)
RETURNS TABLE (
  id uuid,
  title text,
  source_name text,
  description text,
  url text,
  published_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ra.id,
    ra.title,
    ra.source_name,
    ra.description,
    ra.url,
    ra.published_at,
    1 - (ra.embedding <=> target_embedding) as similarity
  FROM raw_articles ra
  WHERE ra.embedding IS NOT NULL
    -- REMOVED: scrape_status = 'completed' - articles with embeddings should match
    -- even if full content scrape failed (e.g., paywalled Bloomberg/FT articles)
    AND COALESCE(ra.published_at, ra.created_at) > since_time
    AND 1 - (ra.embedding <=> target_embedding) > similarity_threshold
  ORDER BY ra.embedding <=> target_embedding
  LIMIT max_results;
$$;
