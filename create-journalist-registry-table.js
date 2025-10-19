const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CREATE_TABLE_SQL = `
-- Create journalist_registry table
CREATE TABLE IF NOT EXISTS journalist_registry (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journalist_industry ON journalist_registry(industry);
CREATE INDEX IF NOT EXISTS idx_journalist_outlet ON journalist_registry(outlet);
CREATE INDEX IF NOT EXISTS idx_journalist_beat ON journalist_registry(beat);
CREATE INDEX IF NOT EXISTS idx_journalist_tier ON journalist_registry(tier);
CREATE INDEX IF NOT EXISTS idx_journalist_name ON journalist_registry(name);
CREATE INDEX IF NOT EXISTS idx_journalist_twitter ON journalist_registry(twitter_handle);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_journalist_search ON journalist_registry
USING gin(to_tsvector('english', name || ' ' || outlet || ' ' || beat));

-- RLS
ALTER TABLE journalist_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to journalist registry" ON journalist_registry;
CREATE POLICY "Allow public read access to journalist registry"
  ON journalist_registry
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert journalists" ON journalist_registry;
CREATE POLICY "Allow authenticated users to insert journalists"
  ON journalist_registry
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF NOT EXISTS "Allow authenticated users to update journalists" ON journalist_registry;
CREATE POLICY "Allow authenticated users to update journalists"
  ON journalist_registry
  FOR UPDATE
  TO authenticated
  USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_journalist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journalist_registry_updated_at ON journalist_registry;
CREATE TRIGGER journalist_registry_updated_at
  BEFORE UPDATE ON journalist_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_journalist_updated_at();
`;

async function createTable() {
  console.log('Creating journalist_registry table...');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: CREATE_TABLE_SQL });

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('✅ journalist_registry table created successfully!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createTable();
