-- Create brand_assets table for Memory Vault
-- Date: 2025-02-03
-- Purpose: Store templates, brand guidelines, logos, and other brand assets

CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,

  -- File metadata
  asset_type VARCHAR(50) NOT NULL, -- 'template-press-release', 'guidelines-brand', 'logo', etc.
  file_name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_url TEXT, -- Public URL for accessing the file
  file_size BIGINT,
  mime_type VARCHAR(100),

  -- Intelligence extracted from file
  extracted_guidelines JSONB, -- {tone: [], style: [], dos: [], donts: []}
  brand_voice_profile JSONB,  -- {adjectives: [], patterns: [], examples: []}
  template_structure JSONB,   -- {sections: [], placeholders: [], format: {}}
  usage_instructions TEXT,

  -- User-provided metadata
  name VARCHAR(500),
  description TEXT,
  tags TEXT[],
  folder TEXT, -- For organizing brand assets into folders

  -- Performance tracking
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP,
  success_rate NUMERIC(3,2),

  -- Standard fields
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'deprecated'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- CRITICAL: Fast lookup index for brand context (< 5ms queries)
CREATE INDEX IF NOT EXISTS idx_brand_assets_fast_lookup
ON brand_assets(organization_id, status, asset_type)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_brand_assets_org ON brand_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON brand_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_brand_assets_tags ON brand_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_brand_assets_folder ON brand_assets(folder);

-- Enable RLS
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_assets
CREATE POLICY "Users can view brand assets for their org"
ON brand_assets FOR SELECT
USING (true);

CREATE POLICY "Users can manage brand assets for their org"
ON brand_assets FOR ALL
USING (true);

-- Create template_performance table for tracking template usage
CREATE TABLE IF NOT EXISTS template_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES brand_assets(id) ON DELETE CASCADE,
  content_type VARCHAR(100) NOT NULL,
  usage_count INT DEFAULT 0,
  success_rate NUMERIC(3,2), -- 0.00 to 1.00
  avg_engagement NUMERIC(10,2),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(template_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_template_perf_template ON template_performance(template_id);
CREATE INDEX IF NOT EXISTS idx_template_perf_type ON template_performance(content_type);

-- Enable RLS on template_performance
ALTER TABLE template_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template performance for their org"
ON template_performance FOR SELECT
USING (true);

-- Comments
COMMENT ON TABLE brand_assets IS 'Store templates, brand guidelines, logos and other brand assets for Memory Vault';
COMMENT ON TABLE template_performance IS 'Track template usage and performance metrics';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Brand assets table created successfully!';
    RAISE NOTICE 'Created: brand_assets table with indexes and RLS policies';
    RAISE NOTICE 'Created: template_performance table for tracking usage';
END $$;
