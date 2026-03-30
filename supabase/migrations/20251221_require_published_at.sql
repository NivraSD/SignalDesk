-- REQUIRE published_at for article matching
-- The created_at fallback was causing old archive articles (2014, 2015, etc.)
-- to appear as "new" because they were scraped recently.
-- If we don't know when an article was published, don't match it.

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
    -- REQUIRE published_at - no more created_at fallback
    -- Articles without a known publication date should not be matched
    AND ra.published_at IS NOT NULL
    AND ra.published_at > since_time
    AND 1 - (ra.embedding <=> target_embedding) > similarity_threshold
  ORDER BY ra.embedding <=> target_embedding
  LIMIT max_results;
$$;
