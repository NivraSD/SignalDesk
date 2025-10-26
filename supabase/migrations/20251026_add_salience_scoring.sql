-- Migration: Add Salience Scoring with Decay
-- Purpose: Enable time-aware relevance scoring and prevent stale content from dominating retrieval
-- Based on OpenMemory's memory decay concept

-- Add salience scoring columns to content_library
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS salience_score DECIMAL(3,2) DEFAULT 1.0 CHECK (salience_score >= 0.0 AND salience_score <= 1.0),
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS decay_rate DECIMAL(4,3) DEFAULT 0.005 CHECK (decay_rate >= 0.0 AND decay_rate <= 1.0),
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Create index for salience-based queries
CREATE INDEX IF NOT EXISTS idx_content_library_salience
ON content_library(salience_score DESC, created_at DESC)
WHERE intelligence_status = 'complete';

-- Create index for decay processing
CREATE INDEX IF NOT EXISTS idx_content_library_last_accessed
ON content_library(last_accessed_at)
WHERE intelligence_status = 'complete';

-- Add comment explaining the columns
COMMENT ON COLUMN content_library.salience_score IS 'Time-aware relevance score (0.0-1.0). Decays over time, boosts on access. Prevents stale content from dominating retrieval.';
COMMENT ON COLUMN content_library.last_accessed_at IS 'Last time this content was accessed/used. Used to boost salience on active content.';
COMMENT ON COLUMN content_library.decay_rate IS 'Daily decay rate (0.0-1.0). Default 0.005 = 0.5% daily decay. Higher for time-sensitive content.';
COMMENT ON COLUMN content_library.access_count IS 'Number of times this content has been accessed/retrieved. Popular content maintains higher salience.';

-- Function to calculate salience decay based on time elapsed
CREATE OR REPLACE FUNCTION calculate_salience_decay(
  current_salience DECIMAL,
  last_accessed TIMESTAMPTZ,
  daily_decay_rate DECIMAL DEFAULT 0.005
) RETURNS DECIMAL AS $$
DECLARE
  days_elapsed DECIMAL;
  decay_multiplier DECIMAL;
BEGIN
  -- Calculate days since last access
  days_elapsed := EXTRACT(EPOCH FROM (NOW() - last_accessed)) / 86400.0;

  -- Calculate decay multiplier: (1 - decay_rate) ^ days_elapsed
  -- e.g., 0.995 ^ 30 days = ~0.86 (14% decay over a month)
  decay_multiplier := POWER(1 - daily_decay_rate, days_elapsed);

  -- Apply decay but never go below 0.1 (10% minimum salience)
  RETURN GREATEST(0.1, current_salience * decay_multiplier);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to boost salience on access
CREATE OR REPLACE FUNCTION boost_salience_on_access(
  content_id UUID,
  boost_amount DECIMAL DEFAULT 0.1
) RETURNS void AS $$
BEGIN
  UPDATE content_library
  SET
    salience_score = LEAST(1.0, salience_score + boost_amount),
    last_accessed_at = NOW(),
    access_count = access_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to apply decay to all content (run via cron)
CREATE OR REPLACE FUNCTION apply_salience_decay() RETURNS TABLE(
  updated_count INTEGER,
  avg_decay DECIMAL,
  min_salience DECIMAL,
  max_salience DECIMAL
) AS $$
DECLARE
  result_count INTEGER;
  result_avg DECIMAL;
  result_min DECIMAL;
  result_max DECIMAL;
BEGIN
  -- Update salience scores with decay
  WITH updated AS (
    UPDATE content_library
    SET salience_score = calculate_salience_decay(
      salience_score,
      last_accessed_at,
      decay_rate
    )
    WHERE intelligence_status = 'complete'
      AND salience_score > 0.1  -- Don't update if already at minimum
    RETURNING salience_score
  )
  SELECT
    COUNT(*)::INTEGER,
    AVG(salience_score),
    MIN(salience_score),
    MAX(salience_score)
  INTO result_count, result_avg, result_min, result_max
  FROM updated;

  -- Return statistics
  RETURN QUERY SELECT result_count, result_avg, result_min, result_max;
END;
$$ LANGUAGE plpgsql;

-- Function to set content-type specific decay rates
CREATE OR REPLACE FUNCTION set_decay_rate_by_content_type(
  p_content_type TEXT,
  p_decay_rate DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE content_library
  SET decay_rate = p_decay_rate
  WHERE content_type = p_content_type;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Set initial decay rates for different content types
-- Time-sensitive content (news, opportunities) decays faster
-- Evergreen content (templates, guidelines) decays slower
DO $$
BEGIN
  -- Fast decay (1% per day, ~26% per month)
  PERFORM set_decay_rate_by_content_type('opportunity', 0.010);
  PERFORM set_decay_rate_by_content_type('news-article', 0.010);
  PERFORM set_decay_rate_by_content_type('media-list', 0.008);

  -- Medium decay (0.5% per day, ~14% per month) - DEFAULT
  PERFORM set_decay_rate_by_content_type('press-release', 0.005);
  PERFORM set_decay_rate_by_content_type('blog-post', 0.005);
  PERFORM set_decay_rate_by_content_type('social-content', 0.005);
  PERFORM set_decay_rate_by_content_type('campaign', 0.005);

  -- Slow decay (0.2% per day, ~5% per month)
  PERFORM set_decay_rate_by_content_type('template', 0.002);
  PERFORM set_decay_rate_by_content_type('guideline', 0.002);
  PERFORM set_decay_rate_by_content_type('brand-asset', 0.002);
  PERFORM set_decay_rate_by_content_type('strategy', 0.003);
END $$;

-- Backfill existing content with default salience
UPDATE content_library
SET
  salience_score = 1.0,
  last_accessed_at = COALESCE(updated_at, created_at),
  access_count = 0
WHERE salience_score IS NULL;

-- Add salience scoring to brand_assets as well
ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS salience_score DECIMAL(3,2) DEFAULT 1.0 CHECK (salience_score >= 0.0 AND salience_score <= 1.0),
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Create index for brand assets salience queries
CREATE INDEX IF NOT EXISTS idx_brand_assets_salience
ON brand_assets(salience_score DESC, created_at DESC)
WHERE status = 'active';

COMMENT ON COLUMN brand_assets.salience_score IS 'Time-aware relevance score for templates/guidelines. Decays if not used, boosts on access.';

-- Backfill brand assets
UPDATE brand_assets
SET
  salience_score = 1.0,
  last_accessed_at = created_at,
  access_count = COALESCE(usage_count, 0)
WHERE salience_score IS NULL;
