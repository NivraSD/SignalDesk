-- Create social_signals table for social listening/intelligence module
CREATE TABLE IF NOT EXISTS social_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'news', 'other')),
  content TEXT NOT NULL,
  author TEXT,
  author_followers INTEGER,
  engagement JSONB DEFAULT '{"likes": 0, "shares": 0, "comments": 0}'::jsonb,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  topics TEXT[] DEFAULT '{}',
  entities TEXT[] DEFAULT '{}',
  url TEXT UNIQUE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  relevance_score NUMERIC DEFAULT 0.5,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_signals_org ON social_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_social_signals_platform ON social_signals(platform);
CREATE INDEX IF NOT EXISTS idx_social_signals_sentiment ON social_signals(sentiment);
CREATE INDEX IF NOT EXISTS idx_social_signals_published ON social_signals(published_at);

-- Enable RLS
ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (using org_users junction table)
CREATE POLICY "Users can view own org social_signals" ON social_signals
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM org_users WHERE user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to social_signals" ON social_signals
  FOR ALL USING (auth.role() = 'service_role');
