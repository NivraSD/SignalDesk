-- Campaign Presentations Table
-- Stores Gamma presentations with full content for searchability and NIV integration

CREATE TABLE IF NOT EXISTS campaign_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- Gamma References
  gamma_id TEXT UNIQUE NOT NULL,
  gamma_url TEXT NOT NULL,
  gamma_edit_url TEXT,

  -- Content (searchable)
  title TEXT NOT NULL,
  topic TEXT,
  slide_count INTEGER NOT NULL DEFAULT 0,
  full_text TEXT, -- All slide content as text
  slides JSONB, -- Structured slide data

  -- Files
  pptx_url TEXT, -- URL to .pptx file in Supabase Storage
  pdf_url TEXT, -- URL to .pdf file if available

  -- Metadata
  format TEXT DEFAULT 'presentation' CHECK (format IN ('presentation', 'document', 'social')),
  generation_params JSONB, -- Store original generation parameters
  credits_used JSONB, -- Gamma credits tracking

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(topic, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(full_text, '')), 'B')
  ) STORED
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_org
  ON campaign_presentations(organization_id);

CREATE INDEX IF NOT EXISTS idx_campaign_presentations_campaign
  ON campaign_presentations(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_presentations_gamma_id
  ON campaign_presentations(gamma_id);

CREATE INDEX IF NOT EXISTS idx_campaign_presentations_search
  ON campaign_presentations USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_campaign_presentations_created
  ON campaign_presentations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE campaign_presentations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Simplified - allow authenticated users to manage their org's data)
-- If you have profiles table set up, these will work with it

-- For SELECT: Allow if user is authenticated (you can add org check later)
CREATE POLICY "Authenticated users can view presentations"
  ON campaign_presentations FOR SELECT
  TO authenticated
  USING (true);

-- For INSERT: Allow if user is authenticated
CREATE POLICY "Authenticated users can insert presentations"
  ON campaign_presentations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- For UPDATE: Allow if user is authenticated
CREATE POLICY "Authenticated users can update presentations"
  ON campaign_presentations FOR UPDATE
  TO authenticated
  USING (true);

-- For DELETE: Allow if user is authenticated
CREATE POLICY "Authenticated users can delete presentations"
  ON campaign_presentations FOR DELETE
  TO authenticated
  USING (true);

-- Service role can do everything
CREATE POLICY "Service role has full access"
  ON campaign_presentations
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_presentations_updated_at
  BEFORE UPDATE ON campaign_presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_presentations_updated_at();

-- Helper function for text search
CREATE OR REPLACE FUNCTION search_presentations(
  search_query TEXT,
  org_id UUID DEFAULT NULL,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  topic TEXT,
  slide_count INTEGER,
  gamma_url TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.title,
    cp.topic,
    cp.slide_count,
    cp.gamma_url,
    cp.created_at,
    ts_rank(cp.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM campaign_presentations cp
  WHERE
    (org_id IS NULL OR cp.organization_id = org_id)
    AND cp.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE campaign_presentations IS 'Stores Gamma presentations with full content for searchability and NIV context integration';
COMMENT ON COLUMN campaign_presentations.full_text IS 'Extracted text from all slides for full-text search';
COMMENT ON COLUMN campaign_presentations.slides IS 'Structured slide data extracted from .pptx file';
COMMENT ON COLUMN campaign_presentations.search_vector IS 'Auto-generated search vector for full-text search';
