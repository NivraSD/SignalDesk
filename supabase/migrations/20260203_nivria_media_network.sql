-- NIVRIA Media Network - Publishing Infrastructure
-- Adds publishing columns to content_library and slug to organizations

-- ============================================
-- PUBLISHING COLUMNS ON content_library
-- ============================================
ALTER TABLE content_library
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_slug VARCHAR(300),
  ADD COLUMN IF NOT EXISTS vertical VARCHAR(100),
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS author_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS author_title VARCHAR(200);

-- ============================================
-- ORGANIZATION SLUG
-- ============================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug VARCHAR(300);

-- Unique index on org slug (only where populated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations (slug)
  WHERE slug IS NOT NULL;

-- ============================================
-- UNIQUE INDEX: one published article per vertical+slug
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_library_published_slug
  ON content_library (vertical, content_slug)
  WHERE published_at IS NOT NULL AND unpublished_at IS NULL;

-- ============================================
-- RLS POLICY: anonymous reads of published content
-- ============================================

-- Enable RLS on content_library if not already enabled
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT published content (for public pages)
CREATE POLICY "Public can read published content"
  ON content_library
  FOR SELECT
  TO anon
  USING (
    published_at IS NOT NULL
    AND unpublished_at IS NULL
  );

-- Allow anyone to read organizations (for org pages)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read organizations with published content"
  ON organizations
  FOR SELECT
  TO anon
  USING (
    slug IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM content_library cl
      WHERE cl.organization_id = organizations.id
        AND cl.published_at IS NOT NULL
        AND cl.unpublished_at IS NULL
    )
  );
