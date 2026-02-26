-- API keys for Grounded iOS Shortcuts integration
CREATE TABLE IF NOT EXISTS grounded_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key UUID NOT NULL DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT 'iOS Shortcut',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(api_key)
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_grounded_api_keys_key ON grounded_api_keys(api_key) WHERE is_active = true;

-- RLS
ALTER TABLE grounded_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grounded_api_keys_all" ON grounded_api_keys USING (true);
