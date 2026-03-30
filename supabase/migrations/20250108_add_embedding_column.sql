-- Add embedding column for Voyage AI embeddings
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Add embedding metadata columns
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS content_library_embedding_idx
ON content_library
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment explaining the column
COMMENT ON COLUMN content_library.embedding IS 'Voyage AI voyage-3-large embedding (1024 dimensions) for semantic search';
COMMENT ON COLUMN content_library.embedding_model IS 'Model used to generate the embedding (e.g., voyage-3-large)';
COMMENT ON COLUMN content_library.embedding_updated_at IS 'Timestamp when the embedding was last updated';
