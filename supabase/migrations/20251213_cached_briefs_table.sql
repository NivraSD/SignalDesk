-- Cached Briefs Table
-- Stores pre-generated article selections and briefs for fast dashboard loading
--
-- IMPORTANT: Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- CREATE CACHED_BRIEFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cached_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cache metadata
  cache_type TEXT NOT NULL DEFAULT 'article_selection', -- 'article_selection', 'daily_brief', 'opportunities'
  cache_key TEXT NOT NULL, -- e.g., 'daily_24h', 'weekly_168h'

  -- Cached data (JSONB for flexibility)
  cached_data JSONB NOT NULL,

  -- Cache stats
  article_count INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '4 hours'),

  -- Unique constraint: one cache per org per type per key
  UNIQUE(organization_id, cache_type, cache_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cached_briefs_org_type
  ON cached_briefs(organization_id, cache_type, cache_key);

CREATE INDEX IF NOT EXISTS idx_cached_briefs_expires
  ON cached_briefs(expires_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE cached_briefs ENABLE ROW LEVEL SECURITY;

-- Users can read cached briefs for their organization
CREATE POLICY "Users can read cached briefs for their org"
  ON cached_briefs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage cached briefs"
  ON cached_briefs
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- CLEANUP FUNCTION: Remove expired caches
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_caches()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cached_briefs WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFY
-- ============================================================================
SELECT 'cached_briefs table created' AS status;
