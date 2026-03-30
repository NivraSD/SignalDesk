-- Drop existing table if it has issues
DROP TABLE IF EXISTS journalist_registry CASCADE;

-- Create journalist_registry table WITHOUT RLS
CREATE TABLE journalist_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  outlet TEXT NOT NULL,
  beat TEXT NOT NULL,
  industry TEXT NOT NULL,
  tier TEXT DEFAULT 'tier1',

  -- Contact Info
  twitter_handle TEXT,
  email TEXT,
  linkedin_url TEXT,
  author_page_url TEXT,

  -- Enriched Data
  recent_articles JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  follower_count INTEGER,

  -- Metadata
  last_enriched_at TIMESTAMPTZ,
  enrichment_status TEXT DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX idx_journalist_industry ON journalist_registry(industry);
CREATE INDEX idx_journalist_outlet ON journalist_registry(outlet);
CREATE INDEX idx_journalist_beat ON journalist_registry(beat);
CREATE INDEX idx_journalist_tier ON journalist_registry(tier);
CREATE INDEX idx_journalist_name ON journalist_registry(name);
CREATE INDEX idx_journalist_twitter ON journalist_registry(twitter_handle);

-- Full text search index
CREATE INDEX idx_journalist_search ON journalist_registry
USING gin(to_tsvector('english', name || ' ' || outlet || ' ' || beat));

-- Update trigger
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

-- Grant permissions explicitly
GRANT ALL ON journalist_registry TO postgres;
GRANT ALL ON journalist_registry TO anon;
GRANT ALL ON journalist_registry TO authenticated;
GRANT ALL ON journalist_registry TO service_role;
