-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to content_library
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS embedding vector(1024),
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'voyage-3-large',
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Add embedding columns to opportunities
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS embedding vector(1024),
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'voyage-3-large',
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Create indexes for fast similarity search
-- Using ivfflat for good balance of speed and accuracy
CREATE INDEX IF NOT EXISTS content_library_embedding_idx
ON content_library
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS opportunities_embedding_idx
ON opportunities
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to find similar content using cosine similarity
CREATE OR REPLACE FUNCTION match_content(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  org_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  content_type text,
  folder text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    content_library.id,
    content_library.title,
    content_library.content,
    content_library.content_type,
    content_library.folder,
    1 - (content_library.embedding <=> query_embedding) as similarity
  FROM content_library
  WHERE
    content_library.embedding IS NOT NULL
    AND (org_id IS NULL OR content_library.organization_id = org_id)
    AND 1 - (content_library.embedding <=> query_embedding) > match_threshold
  ORDER BY content_library.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to find similar opportunities
CREATE OR REPLACE FUNCTION match_opportunities(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  org_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  urgency text,
  score int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    opportunities.id,
    opportunities.title,
    opportunities.description,
    opportunities.urgency,
    opportunities.score,
    1 - (opportunities.embedding <=> query_embedding) as similarity
  FROM opportunities
  WHERE
    opportunities.embedding IS NOT NULL
    AND (org_id IS NULL OR opportunities.organization_id = org_id)
    AND 1 - (opportunities.embedding <=> query_embedding) > match_threshold
  ORDER BY opportunities.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Hybrid search function (combines semantic + keyword)
CREATE OR REPLACE FUNCTION hybrid_search(
  search_query text,
  query_embedding vector(1024),
  org_id text DEFAULT NULL,
  semantic_weight float DEFAULT 0.6,
  keyword_weight float DEFAULT 0.4,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  content_type text,
  folder text,
  combined_score float,
  semantic_score float,
  keyword_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_results AS (
    SELECT
      content_library.id,
      content_library.title,
      content_library.content,
      content_library.content_type,
      content_library.folder,
      1 - (content_library.embedding <=> query_embedding) as similarity
    FROM content_library
    WHERE
      content_library.embedding IS NOT NULL
      AND (org_id IS NULL OR content_library.organization_id = org_id)
  ),
  keyword_results AS (
    SELECT
      content_library.id,
      CASE
        WHEN content_library.title ILIKE '%' || search_query || '%' THEN 1.0
        WHEN content_library.content ILIKE '%' || search_query || '%' THEN 0.5
        ELSE 0.0
      END as keyword_match
    FROM content_library
    WHERE (org_id IS NULL OR content_library.organization_id = org_id)
  )
  SELECT
    s.id,
    s.title,
    s.content,
    s.content_type,
    s.folder,
    (s.similarity * semantic_weight + COALESCE(k.keyword_match, 0) * keyword_weight) as combined_score,
    s.similarity as semantic_score,
    COALESCE(k.keyword_match, 0) as keyword_score
  FROM semantic_results s
  LEFT JOIN keyword_results k ON s.id = k.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Comment the tables for documentation
COMMENT ON COLUMN content_library.embedding IS 'Vector embedding for semantic search (1024 dimensions from Voyage AI voyage-3-large)';
COMMENT ON COLUMN opportunities.embedding IS 'Vector embedding for semantic search (1024 dimensions from Voyage AI voyage-3-large)';
