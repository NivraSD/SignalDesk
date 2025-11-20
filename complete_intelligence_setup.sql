-- Complete Intelligence Repository Setup
-- Safe to run multiple times - won't create duplicates

-- ============================================================================
-- TABLE 1: target_intelligence
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,
  target_id UUID REFERENCES intelligence_targets(id),
  target_name TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  article_id UUID,
  article_title TEXT NOT NULL,
  article_url TEXT,
  article_content TEXT,
  source_name TEXT,
  published_at TIMESTAMP,
  sentiment VARCHAR(20),
  category VARCHAR(50),
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),
  key_entities TEXT[],
  key_topics TEXT[],
  extracted_facts JSONB,
  mention_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_target_type CHECK (target_type IN ('competitor', 'stakeholder', 'topic'))
);

CREATE INDEX IF NOT EXISTS idx_target_intel_org_target ON target_intelligence(organization_id, target_id);
CREATE INDEX IF NOT EXISTS idx_target_intel_target_name ON target_intelligence(target_name);
CREATE INDEX IF NOT EXISTS idx_target_intel_mention_date ON target_intelligence(mention_date DESC);
CREATE INDEX IF NOT EXISTS idx_target_intel_sentiment ON target_intelligence(sentiment);
CREATE INDEX IF NOT EXISTS idx_target_intel_category ON target_intelligence(category);
CREATE INDEX IF NOT EXISTS idx_target_intel_org_date ON target_intelligence(organization_id, mention_date DESC);
CREATE INDEX IF NOT EXISTS idx_target_intel_target_date ON target_intelligence(target_id, mention_date DESC);
CREATE INDEX IF NOT EXISTS idx_target_intel_entities ON target_intelligence USING GIN(key_entities);
CREATE INDEX IF NOT EXISTS idx_target_intel_topics ON target_intelligence USING GIN(key_topics);

-- ============================================================================
-- TABLE 2: prediction_signals
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,
  target_id UUID REFERENCES intelligence_targets(id),
  target_name TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  signal_type VARCHAR(50) NOT NULL,
  signal_strength INTEGER NOT NULL CHECK (signal_strength >= 0 AND signal_strength <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  pattern_description TEXT,
  baseline_comparison JSONB,
  time_window_days INTEGER NOT NULL DEFAULT 7,
  supporting_article_ids UUID[],
  article_count INTEGER NOT NULL,
  first_mention TIMESTAMP,
  latest_mention TIMESTAMP,
  correlated_targets TEXT[],
  correlated_topics TEXT[],
  sentiment_distribution JSONB,
  sentiment_trend VARCHAR(20),
  category_distribution JSONB,
  primary_category VARCHAR(50),
  should_predict BOOLEAN DEFAULT false,
  prediction_type VARCHAR(50),
  recommendation TEXT,
  status VARCHAR(20) DEFAULT 'active',
  predicted_at TIMESTAMP,
  resolved_at TIMESTAMP,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_signal_type CHECK (signal_type IN ('momentum', 'correlation', 'sentiment_shift', 'multi_party', 'category_clustering')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'predicted', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_signals_org ON prediction_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_signals_target ON prediction_signals(target_id);
CREATE INDEX IF NOT EXISTS idx_signals_strength ON prediction_signals(signal_strength DESC);
CREATE INDEX IF NOT EXISTS idx_signals_should_predict ON prediction_signals(should_predict) WHERE should_predict = true;
CREATE INDEX IF NOT EXISTS idx_signals_status ON prediction_signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_detected ON prediction_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_org_status ON prediction_signals(organization_id, status);

-- ============================================================================
-- TABLE 3: target_activity_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_activity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,
  target_id UUID REFERENCES intelligence_targets(id),
  target_name TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  mentions_7d INTEGER DEFAULT 0,
  mentions_30d INTEGER DEFAULT 0,
  mentions_90d INTEGER DEFAULT 0,
  avg_mentions_per_week DECIMAL(10,2),
  avg_mentions_per_month DECIMAL(10,2),
  sentiment_distribution_30d JSONB,
  typical_sentiment VARCHAR(20),
  category_distribution_30d JSONB,
  primary_categories TEXT[],
  momentum_score INTEGER,
  sentiment_trend VARCHAR(20),
  last_calculated TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add unique constraint safely
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

CREATE INDEX IF NOT EXISTS idx_metrics_org ON target_activity_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrics_target ON target_activity_metrics(target_id);
CREATE INDEX IF NOT EXISTS idx_metrics_momentum ON target_activity_metrics(momentum_score DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_updated ON target_activity_metrics(updated_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_prediction_signals_updated_at ON prediction_signals;
CREATE TRIGGER update_prediction_signals_updated_at
  BEFORE UPDATE ON prediction_signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_target_metrics_updated_at ON target_activity_metrics;
CREATE TRIGGER update_target_metrics_updated_at
  BEFORE UPDATE ON target_activity_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
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
