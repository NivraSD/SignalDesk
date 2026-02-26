-- Safe migration: Only creates what's missing

-- Drop indexes if they exist (to recreate them properly)
DROP INDEX IF EXISTS idx_metrics_org;
DROP INDEX IF EXISTS idx_metrics_target;
DROP INDEX IF EXISTS idx_metrics_momentum;
DROP INDEX IF EXISTS idx_metrics_updated;

-- Create target_activity_metrics table if missing
CREATE TABLE IF NOT EXISTS target_activity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target Info
  organization_id VARCHAR(255) NOT NULL,
  target_id UUID REFERENCES intelligence_targets(id),
  target_name TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL,

  -- Activity Metrics (rolling windows)
  mentions_7d INTEGER DEFAULT 0,
  mentions_30d INTEGER DEFAULT 0,
  mentions_90d INTEGER DEFAULT 0,

  -- Averages (for baseline comparison)
  avg_mentions_per_week DECIMAL(10,2),
  avg_mentions_per_month DECIMAL(10,2),

  -- Sentiment Metrics
  sentiment_distribution_30d JSONB,
  typical_sentiment VARCHAR(20),

  -- Category Metrics
  category_distribution_30d JSONB,
  primary_categories TEXT[],

  -- Trend Indicators
  momentum_score INTEGER,
  sentiment_trend VARCHAR(20),

  -- Metadata
  last_calculated TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'target_activity_metrics_organization_id_target_id_key'
  ) THEN
    ALTER TABLE target_activity_metrics
    ADD CONSTRAINT target_activity_metrics_organization_id_target_id_key
    UNIQUE(organization_id, target_id);
  END IF;
END $$;

-- Create indexes for metrics
CREATE INDEX IF NOT EXISTS idx_metrics_org ON target_activity_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrics_target ON target_activity_metrics(target_id);
CREATE INDEX IF NOT EXISTS idx_metrics_momentum ON target_activity_metrics(momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_updated ON target_activity_metrics(updated_at DESC);

-- Create or replace views
CREATE OR REPLACE VIEW signals_needing_predictions AS
SELECT
  ps.*,
  tam.avg_mentions_per_week,
  tam.momentum_score
FROM prediction_signals ps
LEFT JOIN target_activity_metrics tam ON ps.target_id = tam.target_id
WHERE ps.should_predict = true
  AND ps.status = 'active'
  AND ps.signal_strength >= 70
ORDER BY ps.signal_strength DESC, ps.detected_at DESC;

CREATE OR REPLACE VIEW target_activity_summary AS
SELECT
  ti.organization_id,
  ti.target_name,
  ti.target_type,
  COUNT(*) as mention_count,
  COUNT(*) FILTER (WHERE ti.mention_date >= NOW() - INTERVAL '7 days') as mentions_7d,
  COUNT(*) FILTER (WHERE ti.mention_date >= NOW() - INTERVAL '30 days') as mentions_30d,
  MAX(ti.mention_date) as last_mention,
  MODE() WITHIN GROUP (ORDER BY ti.sentiment) as typical_sentiment,
  ARRAY_AGG(DISTINCT ti.category) FILTER (WHERE ti.category IS NOT NULL) as categories,
  AVG(ti.relevance_score) as avg_relevance
FROM target_intelligence ti
GROUP BY ti.organization_id, ti.target_name, ti.target_type;

-- Verify all tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'target_intelligence') THEN
    RAISE EXCEPTION 'target_intelligence table missing - run full migration first';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'prediction_signals') THEN
    RAISE EXCEPTION 'prediction_signals table missing - run full migration first';
  END IF;

  RAISE NOTICE 'All tables verified!';
END $$;

-- Show table counts
SELECT
  'target_intelligence' as table_name,
  COUNT(*) as row_count
FROM target_intelligence
UNION ALL
SELECT
  'prediction_signals',
  COUNT(*)
FROM prediction_signals
UNION ALL
SELECT
  'target_activity_metrics',
  COUNT(*)
FROM target_activity_metrics;
