-- Intelligence Learning System
-- Enables outcome tracking, cross-org pattern detection, and cascade prediction
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- ============================================================================
-- 1. SIGNAL OUTCOMES - Track predictions and their validation
-- ============================================================================

CREATE TABLE IF NOT EXISTS signal_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,

  -- What we predicted
  predicted_outcome TEXT NOT NULL,
  predicted_timeframe_days INT,
  predicted_confidence FLOAT CHECK (predicted_confidence >= 0 AND predicted_confidence <= 1),
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  prediction_expires_at TIMESTAMPTZ,

  -- Evidence we used to make prediction
  prediction_evidence TEXT,
  prediction_reasoning TEXT,

  -- What actually happened
  actual_outcome TEXT,
  outcome_detected_at TIMESTAMPTZ,
  outcome_article_ids UUID[],
  outcome_evidence TEXT,

  -- Validation
  outcome_match FLOAT CHECK (outcome_match >= 0 AND outcome_match <= 1),
  validated_by TEXT CHECK (validated_by IN ('auto', 'user', 'claude', 'expired')),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,

  -- Learning features
  signal_to_outcome_days INT,
  was_accurate BOOLEAN,
  false_positive BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_outcomes_signal ON signal_outcomes(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_outcomes_org ON signal_outcomes(organization_id);
CREATE INDEX IF NOT EXISTS idx_signal_outcomes_target ON signal_outcomes(target_id);
CREATE INDEX IF NOT EXISTS idx_signal_outcomes_pending ON signal_outcomes(prediction_expires_at)
  WHERE validated_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_signal_outcomes_accurate ON signal_outcomes(was_accurate)
  WHERE was_accurate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signal_outcomes_created ON signal_outcomes(created_at DESC);

-- ============================================================================
-- 2. ENTITY SIGNAL AMPLIFICATION - Cross-org entity detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_signal_amplification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The entity being amplified
  entity_name TEXT NOT NULL,
  entity_type TEXT,
  entity_normalized TEXT,  -- Lowercase, cleaned version for matching

  -- Amplification metrics
  signal_count INT DEFAULT 0,
  organization_count INT DEFAULT 0,
  target_count INT DEFAULT 0,
  organization_ids UUID[],

  -- Temporal tracking
  first_signal_at TIMESTAMPTZ,
  latest_signal_at TIMESTAMPTZ,
  signals_last_24h INT DEFAULT 0,
  signals_last_7d INT DEFAULT 0,

  -- Scoring
  avg_signal_strength FLOAT,
  amplification_score FLOAT,
  velocity_score FLOAT,

  -- Context
  industries TEXT[],
  signal_types TEXT[],
  sample_signal_ids UUID[],

  -- The insight
  insight_summary TEXT,

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entity_normalized)
);

CREATE INDEX IF NOT EXISTS idx_amplification_score ON entity_signal_amplification(amplification_score DESC);
CREATE INDEX IF NOT EXISTS idx_amplification_recent ON entity_signal_amplification(latest_signal_at DESC);
CREATE INDEX IF NOT EXISTS idx_amplification_orgs ON entity_signal_amplification(organization_count DESC);

-- ============================================================================
-- 3. CASCADE PATTERNS - Learned temporal sequences
-- ============================================================================

CREATE TABLE IF NOT EXISTS cascade_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,
  pattern_type TEXT,  -- 'regulatory_cascade', 'market_ripple', 'competitive_response', etc.

  -- Trigger definition
  trigger_signal_type TEXT NOT NULL,
  trigger_entity_types TEXT[],
  trigger_industries TEXT[],
  trigger_keywords TEXT[],

  -- Expected cascade sequence
  cascade_steps JSONB NOT NULL,
  /*
    Example:
    [
      {"step": 1, "entity_type": "target_company", "delay_days": 0, "action": "investigation_announced"},
      {"step": 2, "entity_type": "stock", "delay_days": 1, "action": "price_drop"},
      {"step": 3, "entity_type": "competitor", "delay_days": 7, "action": "market_position_statement"},
      {"step": 4, "entity_type": "regulator", "delay_days": 30, "action": "industry_wide_review"}
    ]
  */

  -- Learned metrics
  times_observed INT DEFAULT 0,
  times_predicted INT DEFAULT 0,
  times_accurate INT DEFAULT 0,
  accuracy_rate FLOAT,
  avg_cascade_duration_days FLOAT,
  confidence FLOAT,

  -- Example instances
  example_instances JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_observed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_cascade_trigger ON cascade_patterns(trigger_signal_type);
CREATE INDEX IF NOT EXISTS idx_cascade_confidence ON cascade_patterns(confidence DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cascade_type ON cascade_patterns(pattern_type);

-- ============================================================================
-- 4. SIGNAL ACCURACY METRICS - Per-target learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS signal_accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What we're measuring
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  signal_type TEXT,

  -- Accuracy metrics
  total_predictions INT DEFAULT 0,
  accurate_predictions INT DEFAULT 0,
  false_positives INT DEFAULT 0,
  expired_predictions INT DEFAULT 0,
  accuracy_rate FLOAT,

  -- Timing metrics
  avg_lead_time_days FLOAT,
  median_lead_time_days FLOAT,
  min_lead_time_days INT,
  max_lead_time_days INT,

  -- Confidence calibration
  avg_predicted_confidence FLOAT,
  calibration_data JSONB,  -- {"0.5": 0.45, "0.7": 0.68, "0.9": 0.82}

  -- Trend
  accuracy_trend TEXT CHECK (accuracy_trend IN ('improving', 'declining', 'stable', 'insufficient_data')),
  accuracy_last_30d FLOAT,
  accuracy_last_90d FLOAT,

  -- Metadata
  computed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(target_id, signal_type)
);

CREATE INDEX IF NOT EXISTS idx_accuracy_target ON signal_accuracy_metrics(target_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_org ON signal_accuracy_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_rate ON signal_accuracy_metrics(accuracy_rate DESC);

-- ============================================================================
-- 5. CROSS-ORG PATTERNS - Industry correlation patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS cross_org_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_name TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('leading_indicator', 'correlated', 'inverse', 'causal')),

  -- The relationship
  source_industry TEXT,
  source_entity_type TEXT,
  source_signal_types TEXT[],
  target_industry TEXT,
  target_entity_type TEXT,
  target_signal_types TEXT[],

  -- Timing
  typical_lag_days INT,
  lag_std_dev FLOAT,
  lag_range_min INT,
  lag_range_max INT,

  -- Strength
  correlation_strength FLOAT CHECK (correlation_strength >= -1 AND correlation_strength <= 1),
  times_observed INT DEFAULT 0,
  confidence FLOAT,

  -- Description
  description TEXT,

  -- Evidence
  example_instances JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_validated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_cross_org_type ON cross_org_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_cross_org_confidence ON cross_org_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_cross_org_source ON cross_org_patterns(source_industry);

-- ============================================================================
-- 6. ADD COLUMNS TO SIGNALS TABLE (if not exists)
-- ============================================================================

-- Add prediction-related columns to signals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'signals' AND column_name = 'has_prediction') THEN
    ALTER TABLE signals ADD COLUMN has_prediction BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'signals' AND column_name = 'prediction_accuracy') THEN
    ALTER TABLE signals ADD COLUMN prediction_accuracy FLOAT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'signals' AND column_name = 'entities_mentioned') THEN
    ALTER TABLE signals ADD COLUMN entities_mentioned TEXT[];
  END IF;
END $$;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE signal_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_signal_amplification ENABLE ROW LEVEL SECURITY;
ALTER TABLE cascade_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_accuracy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_org_patterns ENABLE ROW LEVEL SECURITY;

-- Allow reads (this is internal intelligence data, not user-sensitive)
CREATE POLICY "Allow all reads on signal_outcomes" ON signal_outcomes FOR SELECT USING (true);
CREATE POLICY "Allow all reads on entity_signal_amplification" ON entity_signal_amplification FOR SELECT USING (true);
CREATE POLICY "Allow all reads on cascade_patterns" ON cascade_patterns FOR SELECT USING (true);
CREATE POLICY "Allow all reads on signal_accuracy_metrics" ON signal_accuracy_metrics FOR SELECT USING (true);
CREATE POLICY "Allow all reads on cross_org_patterns" ON cross_org_patterns FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON signal_outcomes TO anon, authenticated;
GRANT SELECT ON entity_signal_amplification TO anon, authenticated;
GRANT SELECT ON cascade_patterns TO anon, authenticated;
GRANT SELECT ON signal_accuracy_metrics TO anon, authenticated;
GRANT SELECT ON cross_org_patterns TO anon, authenticated;

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to update signal_outcomes.updated_at
CREATE OR REPLACE FUNCTION update_signal_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS signal_outcomes_updated_at ON signal_outcomes;
CREATE TRIGGER signal_outcomes_updated_at
  BEFORE UPDATE ON signal_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_outcomes_updated_at();

-- Function to update cascade_patterns.last_updated_at
CREATE OR REPLACE FUNCTION update_cascade_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cascade_patterns_updated_at ON cascade_patterns;
CREATE TRIGGER cascade_patterns_updated_at
  BEFORE UPDATE ON cascade_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_cascade_patterns_updated_at();

-- ============================================================================
-- 9. SEED CASCADE PATTERNS (Common patterns to start with)
-- ============================================================================

INSERT INTO cascade_patterns (pattern_name, pattern_description, pattern_type, trigger_signal_type, trigger_entity_types, cascade_steps, confidence, is_active)
VALUES
  (
    'Regulatory Investigation Cascade',
    'When a regulator announces an investigation, competitors often respond with positioning statements and the industry faces broader scrutiny',
    'regulatory_cascade',
    'regulatory',
    ARRAY['regulator', 'government'],
    '[
      {"step": 1, "delay_days": 0, "entity_type": "target_company", "action": "investigation_announced", "description": "Company under investigation"},
      {"step": 2, "delay_days": 1, "entity_type": "market", "action": "stock_reaction", "description": "Stock price movement"},
      {"step": 3, "delay_days": 7, "entity_type": "competitor", "action": "positioning_statement", "description": "Competitors distance or capitalize"},
      {"step": 4, "delay_days": 30, "entity_type": "regulator", "action": "industry_review", "description": "Broader industry scrutiny begins"}
    ]'::jsonb,
    0.70,
    true
  ),
  (
    'Executive Departure Ripple',
    'C-level departures trigger analyst coverage, talent movement, and strategic speculation',
    'market_ripple',
    'leadership',
    ARRAY['executive', 'leader'],
    '[
      {"step": 1, "delay_days": 0, "entity_type": "company", "action": "departure_announced", "description": "Executive departure announced"},
      {"step": 2, "delay_days": 2, "entity_type": "analyst", "action": "coverage_update", "description": "Analyst reports and ratings"},
      {"step": 3, "delay_days": 14, "entity_type": "competitor", "action": "recruiting_activity", "description": "Competitors recruit talent"},
      {"step": 4, "delay_days": 30, "entity_type": "company", "action": "strategy_shift", "description": "Strategic direction clarified"}
    ]'::jsonb,
    0.65,
    true
  ),
  (
    'M&A Announcement Sequence',
    'Acquisition rumors lead to official announcements, then integration news',
    'market_ripple',
    'acquisition',
    ARRAY['company', 'competitor'],
    '[
      {"step": 1, "delay_days": 0, "entity_type": "media", "action": "rumor_published", "description": "M&A rumors surface"},
      {"step": 2, "delay_days": 7, "entity_type": "company", "action": "official_response", "description": "Companies respond to speculation"},
      {"step": 3, "delay_days": 30, "entity_type": "company", "action": "deal_announced", "description": "Official announcement"},
      {"step": 4, "delay_days": 90, "entity_type": "regulator", "action": "review_completed", "description": "Regulatory approval/rejection"}
    ]'::jsonb,
    0.60,
    true
  ),
  (
    'Product Launch Media Cycle',
    'Major product announcements follow a predictable media coverage pattern',
    'market_ripple',
    'product',
    ARRAY['company', 'competitor'],
    '[
      {"step": 1, "delay_days": 0, "entity_type": "company", "action": "launch_announced", "description": "Product launch announced"},
      {"step": 2, "delay_days": 1, "entity_type": "media", "action": "coverage_peak", "description": "Media coverage peaks"},
      {"step": 3, "delay_days": 7, "entity_type": "analyst", "action": "early_reviews", "description": "Early reviews and analysis"},
      {"step": 4, "delay_days": 14, "entity_type": "competitor", "action": "competitive_response", "description": "Competitors respond"}
    ]'::jsonb,
    0.55,
    true
  ),
  (
    'Crisis Escalation Pattern',
    'Corporate crises escalate through media, regulators, and stakeholders',
    'regulatory_cascade',
    'crisis',
    ARRAY['company', 'media'],
    '[
      {"step": 1, "delay_days": 0, "entity_type": "media", "action": "crisis_reported", "description": "Crisis first reported"},
      {"step": 2, "delay_days": 1, "entity_type": "company", "action": "initial_response", "description": "Company responds"},
      {"step": 3, "delay_days": 3, "entity_type": "stakeholder", "action": "stakeholder_reaction", "description": "Stakeholders react"},
      {"step": 4, "delay_days": 7, "entity_type": "regulator", "action": "regulatory_attention", "description": "Regulators get involved"}
    ]'::jsonb,
    0.75,
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. VERIFY TABLES CREATED
-- ============================================================================

SELECT 'signal_outcomes' as table_name, COUNT(*) as row_count FROM signal_outcomes
UNION ALL
SELECT 'entity_signal_amplification', COUNT(*) FROM entity_signal_amplification
UNION ALL
SELECT 'cascade_patterns', COUNT(*) FROM cascade_patterns
UNION ALL
SELECT 'signal_accuracy_metrics', COUNT(*) FROM signal_accuracy_metrics
UNION ALL
SELECT 'cross_org_patterns', COUNT(*) FROM cross_org_patterns;
