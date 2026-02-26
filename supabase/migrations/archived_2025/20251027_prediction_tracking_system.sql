-- Prediction Tracking System: Complete Enhancement
-- Enables event tracking, monitoring, validation, and learning

-- ==================== STEP 1: Add Event Tracking to Predictions ====================

-- Add trigger event fields (what intelligence triggered this prediction)
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS trigger_event_id UUID REFERENCES content_library(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS trigger_event_summary TEXT,
ADD COLUMN IF NOT EXISTS pattern_confidence INTEGER CHECK (pattern_confidence >= 0 AND pattern_confidence <= 100);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_predictions_trigger_event ON predictions(trigger_event_id);

-- Comments
COMMENT ON COLUMN predictions.trigger_event_id IS 'Intelligence event that triggered this prediction';
COMMENT ON COLUMN predictions.trigger_event_summary IS 'Summary of the trigger event for quick reference';
COMMENT ON COLUMN predictions.pattern_confidence IS 'How well the event matched the pattern (0-100)';

-- ==================== STEP 2: Prediction Outcomes (Validation) ====================

CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,

  -- Validation details
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validation_method VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automated', 'ai'

  -- Did it come true?
  outcome_occurred BOOLEAN NOT NULL,
  actual_outcome TEXT,
  actual_date TIMESTAMPTZ,

  -- Accuracy metrics
  timing_accuracy INTEGER CHECK (timing_accuracy >= 0 AND timing_accuracy <= 100),
  description_accuracy INTEGER CHECK (description_accuracy >= 0 AND description_accuracy <= 100),
  overall_accuracy INTEGER CHECK (overall_accuracy >= 0 AND overall_accuracy <= 100),

  -- Learning data
  variance_explanation TEXT,
  lessons_learned TEXT,
  pattern_adjustment_needed BOOLEAN DEFAULT FALSE,

  -- Evidence
  evidence_links TEXT[],
  evidence_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_prediction ON prediction_outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_validated_at ON prediction_outcomes(validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_occurred ON prediction_outcomes(outcome_occurred);

COMMENT ON TABLE prediction_outcomes IS 'Tracks validation and accuracy of predictions';

-- ==================== STEP 3: Prediction Monitoring ====================

CREATE TABLE IF NOT EXISTS prediction_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,

  -- Monitoring status
  monitoring_status VARCHAR(50) DEFAULT 'watching', -- 'watching', 'signals_detected', 'outcome_imminent'
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  next_check_at TIMESTAMPTZ,

  -- Progress indicators
  supporting_signals_count INTEGER DEFAULT 0,
  contradicting_signals_count INTEGER DEFAULT 0,
  confidence_trend VARCHAR(20) DEFAULT 'stable', -- 'increasing', 'stable', 'decreasing'

  -- Related events
  related_events JSONB DEFAULT '[]'::jsonb,

  -- Alerts
  alert_threshold_met BOOLEAN DEFAULT FALSE,
  last_alert_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(prediction_id)
);

CREATE INDEX IF NOT EXISTS idx_prediction_monitoring_prediction ON prediction_monitoring(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_monitoring_status ON prediction_monitoring(monitoring_status);
CREATE INDEX IF NOT EXISTS idx_prediction_monitoring_next_check ON prediction_monitoring(next_check_at);

COMMENT ON TABLE prediction_monitoring IS 'Tracks active monitoring of predictions for outcome detection';

-- ==================== STEP 4: Target Prediction Metrics ====================

CREATE TABLE IF NOT EXISTS target_prediction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,

  -- Counts
  total_predictions INTEGER DEFAULT 0,
  validated_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  failed_predictions INTEGER DEFAULT 0,
  expired_predictions INTEGER DEFAULT 0,

  -- Accuracy percentages
  overall_accuracy DECIMAL(5,2) DEFAULT 0,
  avg_timing_accuracy DECIMAL(5,2) DEFAULT 0,

  -- By timeframe
  accuracy_1week DECIMAL(5,2) DEFAULT 0,
  accuracy_1month DECIMAL(5,2) DEFAULT 0,
  accuracy_3months DECIMAL(5,2) DEFAULT 0,
  accuracy_6months DECIMAL(5,2) DEFAULT 0,

  -- Confidence calibration
  avg_confidence_when_right DECIMAL(5,2) DEFAULT 0,
  avg_confidence_when_wrong DECIMAL(5,2) DEFAULT 0,

  -- Learning insights
  most_accurate_category VARCHAR(50),
  least_accurate_category VARCHAR(50),
  improvement_suggestions TEXT,

  last_updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_target_metrics_org ON target_prediction_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_target_metrics_target ON target_prediction_metrics(target_id);
CREATE INDEX IF NOT EXISTS idx_target_metrics_accuracy ON target_prediction_metrics(overall_accuracy DESC);

COMMENT ON TABLE target_prediction_metrics IS 'Aggregate accuracy metrics by target';

-- ==================== STEP 5: Prediction Patterns (Optional) ====================

CREATE TABLE IF NOT EXISTS prediction_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,

  -- Pattern definition
  pattern_name VARCHAR(255) NOT NULL,
  pattern_description TEXT,
  category VARCHAR(50), -- Same as prediction categories

  -- Trigger signals
  trigger_signals JSONB DEFAULT '[]'::jsonb,
  trigger_keywords TEXT[],

  -- Expected outcome
  typical_outcome TEXT NOT NULL,
  typical_timeframe VARCHAR(50) NOT NULL,
  typical_impact VARCHAR(20),

  -- Confidence and usage
  confidence_threshold INTEGER DEFAULT 60,
  historical_accuracy DECIMAL(5,2) DEFAULT 0,
  sample_size INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Learning
  enabled BOOLEAN DEFAULT TRUE,
  auto_refine BOOLEAN DEFAULT TRUE,
  refinement_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_patterns_org ON prediction_patterns(organization_id);
CREATE INDEX IF NOT EXISTS idx_prediction_patterns_target ON prediction_patterns(target_id);
CREATE INDEX IF NOT EXISTS idx_prediction_patterns_enabled ON prediction_patterns(enabled);
CREATE INDEX IF NOT EXISTS idx_prediction_patterns_accuracy ON prediction_patterns(historical_accuracy DESC);

COMMENT ON TABLE prediction_patterns IS 'Reusable prediction patterns learned from validated outcomes';

-- ==================== STEP 6: Views for Easy Querying ====================

-- Predictions with full monitoring and outcome data
CREATE OR REPLACE VIEW predictions_with_monitoring AS
SELECT
  p.*,
  t.name as target_name_full,
  t.type as target_type_full,
  t.priority as target_priority,
  m.monitoring_status,
  m.supporting_signals_count,
  m.contradicting_signals_count,
  m.confidence_trend,
  m.last_checked_at,
  o.outcome_occurred,
  o.overall_accuracy as outcome_accuracy,
  o.validated_at
FROM predictions p
LEFT JOIN intelligence_targets t ON p.target_id = t.id
LEFT JOIN prediction_monitoring m ON p.id = m.prediction_id
LEFT JOIN prediction_outcomes o ON p.id = o.prediction_id;

GRANT SELECT ON predictions_with_monitoring TO authenticated, anon, service_role;

-- Target accuracy summary
CREATE OR REPLACE VIEW target_accuracy_summary AS
SELECT
  t.id as target_id,
  t.organization_id,
  t.name as target_name,
  t.type as target_type,
  t.priority,
  COUNT(p.id) as total_predictions,
  COUNT(CASE WHEN p.status = 'validated' THEN 1 END) as validated_count,
  COUNT(CASE WHEN o.outcome_occurred = true THEN 1 END) as successful_count,
  ROUND(
    CASE
      WHEN COUNT(CASE WHEN p.status = 'validated' THEN 1 END) > 0
      THEN (COUNT(CASE WHEN o.outcome_occurred = true THEN 1 END)::DECIMAL /
            COUNT(CASE WHEN p.status = 'validated' THEN 1 END)::DECIMAL) * 100
      ELSE 0
    END,
    2
  ) as accuracy_percentage
FROM intelligence_targets t
LEFT JOIN predictions p ON t.id = p.target_id
LEFT JOIN prediction_outcomes o ON p.id = o.prediction_id
GROUP BY t.id, t.organization_id, t.name, t.type, t.priority;

GRANT SELECT ON target_accuracy_summary TO authenticated, anon, service_role;

-- ==================== STEP 7: Functions ====================

-- Function to update target metrics when prediction is validated
CREATE OR REPLACE FUNCTION update_target_metrics_on_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert metrics for this target
  INSERT INTO target_prediction_metrics (
    organization_id,
    target_id,
    total_predictions,
    validated_predictions,
    successful_predictions,
    failed_predictions,
    overall_accuracy,
    last_updated_at
  )
  SELECT
    p.organization_id,
    p.target_id,
    COUNT(*),
    COUNT(CASE WHEN p.status IN ('validated', 'invalidated', 'expired') THEN 1 END),
    COUNT(CASE WHEN o.outcome_occurred = true THEN 1 END),
    COUNT(CASE WHEN o.outcome_occurred = false THEN 1 END),
    ROUND(
      CASE
        WHEN COUNT(CASE WHEN p.status IN ('validated', 'invalidated') THEN 1 END) > 0
        THEN (COUNT(CASE WHEN o.outcome_occurred = true THEN 1 END)::DECIMAL /
              COUNT(CASE WHEN p.status IN ('validated', 'invalidated') THEN 1 END)::DECIMAL) * 100
        ELSE 0
      END,
      2
    ),
    NOW()
  FROM predictions p
  LEFT JOIN prediction_outcomes o ON p.id = o.prediction_id
  WHERE p.id = NEW.prediction_id
  GROUP BY p.organization_id, p.target_id
  ON CONFLICT (organization_id, target_id)
  DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    validated_predictions = EXCLUDED.validated_predictions,
    successful_predictions = EXCLUDED.successful_predictions,
    failed_predictions = EXCLUDED.failed_predictions,
    overall_accuracy = EXCLUDED.overall_accuracy,
    last_updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics when outcome is recorded
DROP TRIGGER IF EXISTS update_target_metrics_trigger ON prediction_outcomes;
CREATE TRIGGER update_target_metrics_trigger
  AFTER INSERT OR UPDATE ON prediction_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION update_target_metrics_on_validation();

-- ==================== STEP 8: RLS Policies ====================

-- prediction_outcomes
ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON prediction_outcomes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view outcomes" ON prediction_outcomes
  FOR SELECT TO authenticated, anon USING (true);

-- prediction_monitoring
ALTER TABLE prediction_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON prediction_monitoring
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view monitoring" ON prediction_monitoring
  FOR SELECT TO authenticated, anon USING (true);

-- target_prediction_metrics
ALTER TABLE target_prediction_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON target_prediction_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view metrics" ON target_prediction_metrics
  FOR SELECT TO authenticated, anon USING (true);

-- prediction_patterns
ALTER TABLE prediction_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON prediction_patterns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view patterns" ON prediction_patterns
  FOR SELECT TO authenticated, anon USING (true);

-- ==================== STEP 9: Grants ====================

GRANT ALL ON prediction_outcomes TO service_role;
GRANT SELECT ON prediction_outcomes TO authenticated, anon;

GRANT ALL ON prediction_monitoring TO service_role;
GRANT SELECT ON prediction_monitoring TO authenticated, anon;

GRANT ALL ON target_prediction_metrics TO service_role;
GRANT SELECT ON target_prediction_metrics TO authenticated, anon;

GRANT ALL ON prediction_patterns TO service_role;
GRANT SELECT ON prediction_patterns TO authenticated, anon;
