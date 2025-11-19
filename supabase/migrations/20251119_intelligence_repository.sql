-- Intelligence Repository Architecture
-- Stores all mentions of intelligence targets with structured metadata
-- Enables pattern detection and signal-based predictions

-- ============================================================================
-- TABLE 1: target_intelligence
-- Core repository: Every mention of every target from monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS target_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target Info
  organization_id VARCHAR(255) NOT NULL,
  target_id UUID REFERENCES intelligence_targets(id),
  target_name TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'competitor', 'stakeholder', 'topic'

  -- Article/Source Info
  article_id UUID, -- Links to monitoring results if stored
  article_title TEXT NOT NULL,
  article_url TEXT,
  article_content TEXT,
  source_name TEXT,
  published_at TIMESTAMP,

  -- Extracted Intelligence
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral', 'mixed'
  category VARCHAR(50), -- 'partnership', 'crisis', 'product_launch', 'regulatory', 'financial', 'leadership', 'legal'
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),

  -- Contextual Data
  key_entities TEXT[], -- Other important entities mentioned
  key_topics TEXT[], -- Extracted topics/themes
  extracted_facts JSONB, -- Structured facts: metrics, quotes, dates

  -- Metadata
  mention_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Indexes for fast querying
  CONSTRAINT valid_target_type CHECK (target_type IN ('competitor', 'stakeholder', 'topic'))
);

-- Indexes for pattern detection queries
CREATE INDEX idx_target_intel_org_target ON target_intelligence(organization_id, target_id);
CREATE INDEX idx_target_intel_target_name ON target_intelligence(target_name);
CREATE INDEX idx_target_intel_mention_date ON target_intelligence(mention_date DESC);
CREATE INDEX idx_target_intel_sentiment ON target_intelligence(sentiment);
CREATE INDEX idx_target_intel_category ON target_intelligence(category);
CREATE INDEX idx_target_intel_org_date ON target_intelligence(organization_id, mention_date DESC);
CREATE INDEX idx_target_intel_target_date ON target_intelligence(target_id, mention_date DESC);

-- GIN index for array searches (key_entities, key_topics)
CREATE INDEX idx_target_intel_entities ON target_intelligence USING GIN(key_entities);
CREATE INDEX idx_target_intel_topics ON target_intelligence USING GIN(key_topics);

-- ============================================================================
-- TABLE 2: prediction_signals
-- Detected patterns that may warrant predictions
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization & Target
  organization_id VARCHAR(255) NOT NULL,
  target_id UUID REFERENCES intelligence_targets(id),
  target_name TEXT NOT NULL,
  target_type VARCHAR(50) NOT NULL,

  -- Signal Details
  signal_type VARCHAR(50) NOT NULL, -- 'momentum', 'correlation', 'sentiment_shift', 'multi_party', 'category_clustering'
  signal_strength INTEGER NOT NULL CHECK (signal_strength >= 0 AND signal_strength <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Pattern Data
  pattern_description TEXT,
  baseline_comparison JSONB, -- e.g., {"previous_avg": 1, "current_count": 5, "timeframe": "7days"}
  time_window_days INTEGER NOT NULL DEFAULT 7,

  -- Supporting Evidence
  supporting_article_ids UUID[], -- Array of target_intelligence IDs
  article_count INTEGER NOT NULL,
  first_mention TIMESTAMP,
  latest_mention TIMESTAMP,

  -- Correlation Data (if applicable)
  correlated_targets TEXT[], -- Other targets appearing together
  correlated_topics TEXT[],

  -- Sentiment Analysis
  sentiment_distribution JSONB, -- {"positive": 2, "negative": 5, "neutral": 1}
  sentiment_trend VARCHAR(20), -- 'improving', 'declining', 'stable', 'volatile'

  -- Category Analysis
  category_distribution JSONB,
  primary_category VARCHAR(50),

  -- Prediction Recommendation
  should_predict BOOLEAN DEFAULT false,
  prediction_type VARCHAR(50), -- 'competitive_threat', 'market_shift', 'crisis_building', 'opportunity'
  recommendation TEXT,

  -- Status & Lifecycle
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'predicted', 'resolved', 'dismissed'
  predicted_at TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Metadata
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_signal_type CHECK (signal_type IN ('momentum', 'correlation', 'sentiment_shift', 'multi_party', 'category_clustering')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'predicted', 'resolved', 'dismissed'))
);

-- Indexes for signal queries
CREATE INDEX idx_signals_org ON prediction_signals(organization_id);
CREATE INDEX idx_signals_target ON prediction_signals(target_id);
CREATE INDEX idx_signals_strength ON prediction_signals(signal_strength DESC);
CREATE INDEX idx_signals_should_predict ON prediction_signals(should_predict) WHERE should_predict = true;
CREATE INDEX idx_signals_status ON prediction_signals(status);
CREATE INDEX idx_signals_detected ON prediction_signals(detected_at DESC);
CREATE INDEX idx_signals_org_status ON prediction_signals(organization_id, status);

-- ============================================================================
-- TABLE 3: target_activity_metrics
-- Baseline metrics for each target (to detect anomalies)
-- ============================================================================
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
  sentiment_distribution_30d JSONB, -- {"positive": 10, "negative": 3, "neutral": 15}
  typical_sentiment VARCHAR(20), -- Most common sentiment

  -- Category Metrics
  category_distribution_30d JSONB,
  primary_categories TEXT[], -- Top 3 categories

  -- Trend Indicators
  momentum_score INTEGER, -- 0-100: current activity vs baseline
  sentiment_trend VARCHAR(20), -- 'improving', 'declining', 'stable'

  -- Metadata
  last_calculated TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Unique constraint: one metrics row per org-target
  UNIQUE(organization_id, target_id)
);

-- Indexes for metrics
CREATE INDEX idx_metrics_org ON target_activity_metrics(organization_id);
CREATE INDEX idx_metrics_target ON target_activity_metrics(target_id);
CREATE INDEX idx_metrics_momentum ON target_activity_metrics(momentum_score DESC);
CREATE INDEX idx_metrics_updated ON target_activity_metrics(updated_at DESC);

-- ============================================================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prediction_signals_updated_at BEFORE UPDATE ON prediction_signals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_metrics_updated_at BEFORE UPDATE ON target_activity_metrics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: Convenient queries for common patterns
-- ============================================================================

-- Active high-strength signals that need predictions
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

-- Recent target activity summary
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
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE target_intelligence IS 'Core intelligence repository: stores every mention of every intelligence target from monitoring runs';
COMMENT ON TABLE prediction_signals IS 'Detected patterns in target intelligence that may warrant predictions';
COMMENT ON TABLE target_activity_metrics IS 'Baseline metrics for each target to detect anomalies and momentum';

COMMENT ON COLUMN target_intelligence.relevance_score IS 'How relevant this article is to the target (0-100)';
COMMENT ON COLUMN target_intelligence.sentiment IS 'Sentiment of the article towards the target';
COMMENT ON COLUMN target_intelligence.category IS 'Type of event/activity mentioned';

COMMENT ON COLUMN prediction_signals.signal_strength IS 'Strength of the detected pattern (0-100)';
COMMENT ON COLUMN prediction_signals.should_predict IS 'Whether this signal is strong enough to generate a prediction';
COMMENT ON COLUMN prediction_signals.baseline_comparison IS 'Comparison to normal activity levels';
