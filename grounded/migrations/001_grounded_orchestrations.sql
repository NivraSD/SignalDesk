-- grounded_orchestrations: stores pre-generated context-aware art + titles for on-unlock experience
CREATE TABLE IF NOT EXISTS grounded_orchestrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  focus_domain TEXT NOT NULL,
  domain_scores JSONB,
  assessment_reasoning TEXT,
  fulcrum_approach TEXT,
  art_palette TEXT NOT NULL,
  art_texture TEXT NOT NULL,
  art_energy TEXT NOT NULL,
  art_mood TEXT NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  routing_suggestion TEXT,
  routing_target TEXT DEFAULT '/',
  time_context TEXT,
  calendar_context TEXT,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours')
);

CREATE INDEX IF NOT EXISTS idx_orchestrations_user_latest
  ON grounded_orchestrations(user_id, is_used, created_at DESC);

-- RLS policies (matching existing grounded tables pattern)
ALTER TABLE grounded_orchestrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orchestrations"
  ON grounded_orchestrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orchestrations"
  ON grounded_orchestrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orchestrations"
  ON grounded_orchestrations FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role bypass for edge functions using service key
CREATE POLICY "Service role full access"
  ON grounded_orchestrations FOR ALL
  USING (auth.role() = 'service_role');
