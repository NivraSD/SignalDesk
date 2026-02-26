-- Grounded AI Memory System: chat, embeddings, profile, rules
-- Requires: pgvector extension (already enabled via 20250104_add_semantic_search.sql)

-- 1. Chat messages
CREATE TABLE IF NOT EXISTS grounded_chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grounded_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat messages" ON grounded_chat_messages
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_grounded_chat_user_created ON grounded_chat_messages(user_id, created_at DESC);

-- 2. User profile (accumulated context — like NIV's target accumulated_context)
CREATE TABLE IF NOT EXISTS grounded_user_profile (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_context text DEFAULT '',
  patterns jsonb DEFAULT '{}',
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grounded_user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON grounded_user_profile
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage profiles" ON grounded_user_profile
  FOR ALL USING (true);

-- 3. User rules / preferences
CREATE TABLE IF NOT EXISTS grounded_user_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_text text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grounded_user_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own rules" ON grounded_user_rules
  FOR ALL USING (auth.uid() = user_id);

-- 4. Embeddings (vector store for semantic memory)
CREATE TABLE IF NOT EXISTS grounded_embeddings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('checkin', 'journal', 'chat', 'reflection')),
  content_id text NOT NULL,
  content_text text NOT NULL,
  embedding vector(1024),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grounded_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own embeddings" ON grounded_embeddings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage embeddings" ON grounded_embeddings
  FOR ALL USING (true);
CREATE INDEX idx_grounded_embeddings_user ON grounded_embeddings(user_id);

-- 5. Vector similarity search function
CREATE OR REPLACE FUNCTION grounded_match_embeddings(
  query_embedding vector(1024),
  match_user_id uuid,
  match_count int DEFAULT 5,
  match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content_id text,
  content_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.content_type,
    e.content_id,
    e.content_text,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM grounded_embeddings e
  WHERE e.user_id = match_user_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Add columns to journal entries
ALTER TABLE grounded_journal_entries
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS completion_notes text;
