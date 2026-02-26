-- Create journalist_registry table
CREATE TABLE IF NOT EXISTS journalist_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info (from seed data)
  name TEXT NOT NULL,
  outlet TEXT NOT NULL,
  beat TEXT NOT NULL,
  industry TEXT NOT NULL, -- 'technology', 'fintech', 'healthcare', etc.
  tier TEXT DEFAULT 'tier1', -- 'tier1', 'tier2', 'trade'

  -- Contact Info
  twitter_handle TEXT,
  email TEXT,
  linkedin_url TEXT,
  author_page_url TEXT,

  -- Enriched Data (populated via Firecrawl)
  recent_articles JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  follower_count INTEGER,

  -- Metadata
  last_enriched_at TIMESTAMPTZ,
  enrichment_status TEXT DEFAULT 'pending', -- 'pending', 'enriched', 'failed'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_journalist_industry ON journalist_registry(industry);
CREATE INDEX IF NOT EXISTS idx_journalist_outlet ON journalist_registry(outlet);
CREATE INDEX IF NOT EXISTS idx_journalist_beat ON journalist_registry(beat);
CREATE INDEX IF NOT EXISTS idx_journalist_tier ON journalist_registry(tier);
CREATE INDEX IF NOT EXISTS idx_journalist_name ON journalist_registry(name);
CREATE INDEX IF NOT EXISTS idx_journalist_twitter ON journalist_registry(twitter_handle);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_journalist_search ON journalist_registry
USING gin(to_tsvector('english', name || ' ' || outlet || ' ' || beat));

-- RLS Policies (public read for now, can restrict later)
ALTER TABLE journalist_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to journalist registry"
  ON journalist_registry
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert journalists"
  ON journalist_registry
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update journalists"
  ON journalist_registry
  FOR UPDATE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journalist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journalist_registry_updated_at
  BEFORE UPDATE ON journalist_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_journalist_updated_at();
