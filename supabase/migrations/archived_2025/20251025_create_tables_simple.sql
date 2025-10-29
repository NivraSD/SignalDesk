-- Create campaign_presentations table (simplified for direct Postgres)
-- Removes Supabase-specific foreign keys and roles

CREATE TABLE IF NOT EXISTS campaign_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,  -- Changed from UUID REFERENCES to TEXT
  campaign_id TEXT,  -- Changed from UUID REFERENCES to TEXT

  -- Gamma References
  gamma_id TEXT UNIQUE NOT NULL,
  gamma_url TEXT NOT NULL,
  gamma_edit_url TEXT,

  -- Content (searchable)
  title TEXT NOT NULL,
  topic TEXT,
  slide_count INTEGER NOT NULL DEFAULT 0,
  full_text TEXT,
  slides JSONB,

  -- Files
  pptx_url TEXT,
  pdf_url TEXT,

  -- Metadata
  format TEXT DEFAULT 'presentation' CHECK (format IN ('presentation', 'document', 'social')),
  generation_params JSONB,
  credits_used JSONB,

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_org ON campaign_presentations(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_campaign ON campaign_presentations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_gamma_id ON campaign_presentations(gamma_id);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_search ON campaign_presentations USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_campaign_presentations_created ON campaign_presentations(created_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_campaign_presentations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaign_presentations ON campaign_presentations;
CREATE TRIGGER trigger_update_campaign_presentations
  BEFORE UPDATE ON campaign_presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_presentations_updated_at();

-- Add missing columns to content_library if they don't exist
DO $$
BEGIN
  -- Add session_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_library' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE content_library ADD COLUMN session_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_content_library_session ON content_library(session_id);
  END IF;

  -- Add folder_path if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_library' AND column_name = 'folder_path'
  ) THEN
    ALTER TABLE content_library ADD COLUMN folder_path TEXT;
    CREATE INDEX IF NOT EXISTS idx_content_library_folder ON content_library(folder_path);
  END IF;

  -- Add file_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_library' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE content_library ADD COLUMN file_url TEXT;
  END IF;
END $$;

-- Success message
SELECT '✅ Tables created successfully!' as status;
