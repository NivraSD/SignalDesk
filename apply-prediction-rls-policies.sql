-- Apply RLS Policies to Prediction Tables
-- Run this in Supabase SQL Editor to fix permission issues

-- Enable RLS on all tables
ALTER TABLE stakeholder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "org_profiles_policy" ON stakeholder_profiles;
DROP POLICY IF EXISTS "org_predictions_policy" ON stakeholder_predictions;
DROP POLICY IF EXISTS "public_patterns_read_policy" ON stakeholder_patterns;
DROP POLICY IF EXISTS "org_patterns_write_policy" ON stakeholder_patterns;
DROP POLICY IF EXISTS "org_action_history_policy" ON stakeholder_action_history;
DROP POLICY IF EXISTS "org_metrics_policy" ON prediction_metrics;

-- Stakeholder Profiles: Organization access
CREATE POLICY "org_profiles_policy" ON stakeholder_profiles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Stakeholder Predictions: Organization access
CREATE POLICY "org_predictions_policy" ON stakeholder_predictions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Stakeholder Patterns: Public read, organization write
CREATE POLICY "public_patterns_read_policy" ON stakeholder_patterns
  FOR SELECT USING (true);

CREATE POLICY "org_patterns_write_policy" ON stakeholder_patterns
  FOR INSERT WITH CHECK (true);

-- Action History: Organization access
CREATE POLICY "org_action_history_policy" ON stakeholder_action_history
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Prediction Metrics: Organization access
CREATE POLICY "org_metrics_policy" ON prediction_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_org ON stakeholder_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON stakeholder_profiles(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_profiles_influence ON stakeholder_profiles(influence_score DESC);

CREATE INDEX IF NOT EXISTS idx_predictions_stakeholder ON stakeholder_predictions(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_predictions_org ON stakeholder_predictions(organization_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON stakeholder_predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON stakeholder_predictions(confidence_level);
CREATE INDEX IF NOT EXISTS idx_predictions_probability ON stakeholder_predictions(probability DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON stakeholder_predictions(expected_date_min);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON stakeholder_patterns(stakeholder_type);
CREATE INDEX IF NOT EXISTS idx_patterns_reliability ON stakeholder_patterns(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON stakeholder_patterns(is_active);

CREATE INDEX IF NOT EXISTS idx_action_history_stakeholder ON stakeholder_action_history(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_action_history_org ON stakeholder_action_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_history_date ON stakeholder_action_history(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_action_history_category ON stakeholder_action_history(action_category);
CREATE INDEX IF NOT EXISTS idx_action_history_was_predicted ON stakeholder_action_history(was_predicted);

CREATE INDEX IF NOT EXISTS idx_metrics_org ON prediction_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrics_period ON prediction_metrics(period_start, period_end);

-- Create or replace the pattern reliability update function
CREATE OR REPLACE FUNCTION update_pattern_reliability()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'occurred' OR NEW.status = 'incorrect') AND OLD.status = 'active' THEN
    UPDATE stakeholder_patterns
    SET
      total_matches = total_matches + 1,
      successful_predictions = CASE
        WHEN NEW.status = 'occurred' THEN successful_predictions + 1
        ELSE successful_predictions
      END,
      reliability_score = (
        CASE
          WHEN NEW.status = 'occurred' THEN successful_predictions + 1
          ELSE successful_predictions
        END::DECIMAL / (total_matches + 1)
      ),
      updated_at = NOW()
    WHERE pattern_name = NEW.pattern_matched;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_pattern_reliability_trigger ON stakeholder_predictions;
CREATE TRIGGER update_pattern_reliability_trigger
  AFTER UPDATE ON stakeholder_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_reliability();

-- Create or replace the view for high priority predictions
CREATE OR REPLACE VIEW active_high_priority_predictions AS
SELECT
  p.*,
  sp.stakeholder_name,
  sp.stakeholder_type,
  sp.influence_score,
  o.name as organization_name
FROM stakeholder_predictions p
JOIN stakeholder_profiles sp ON p.stakeholder_id = sp.id
JOIN organizations o ON p.organization_id = o.id
WHERE
  p.status = 'active'
  AND p.confidence_level = 'high'
  AND p.probability >= 0.70
  AND p.expected_date_max >= CURRENT_DATE
ORDER BY p.probability DESC, p.expected_date_min ASC;

SELECT 'RLS policies and indexes applied successfully!' as status;
