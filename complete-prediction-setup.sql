-- Complete Prediction System Setup
-- Run this entire file in Supabase SQL Editor

-- ============================================================================
-- STEP 1: CREATE TABLES
-- ============================================================================

-- 1. Stakeholder Profiles Table
CREATE TABLE IF NOT EXISTS stakeholder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stakeholder_name VARCHAR(255) NOT NULL,
  stakeholder_type VARCHAR(50) NOT NULL,
  influence_score DECIMAL(3,2) CHECK (influence_score >= 0 AND influence_score <= 1),
  predictability_score DECIMAL(3,2) CHECK (predictability_score >= 0 AND predictability_score <= 1),
  typical_response_time_days INTEGER,
  behavioral_profile JSONB DEFAULT '{}',
  historical_actions JSONB DEFAULT '[]',
  trigger_patterns JSONB DEFAULT '[]',
  communication_style JSONB DEFAULT '{}',
  network_connections JSONB DEFAULT '[]',
  last_action_date DATE,
  data_quality VARCHAR(20) DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, stakeholder_name)
);

-- 2. Stakeholder Predictions Table
CREATE TABLE IF NOT EXISTS stakeholder_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id UUID REFERENCES stakeholder_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  predicted_action VARCHAR(255) NOT NULL,
  action_category VARCHAR(50),
  probability DECIMAL(3,2) CHECK (probability >= 0 AND probability <= 1),
  expected_timeframe VARCHAR(50),
  expected_date_min DATE,
  expected_date_max DATE,
  trigger_signals JSONB DEFAULT '[]',
  supporting_evidence JSONB DEFAULT '[]',
  confidence_level VARCHAR(20),
  pattern_matched VARCHAR(100),
  match_score DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'active',
  actual_action TEXT,
  actual_date DATE,
  prediction_accuracy DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CHECK (expected_date_min <= expected_date_max)
);

-- 3. Stakeholder Patterns Table (Pattern Library)
CREATE TABLE IF NOT EXISTS stakeholder_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(255) NOT NULL UNIQUE,
  stakeholder_type VARCHAR(50) NOT NULL,
  pattern_description TEXT,
  early_signals JSONB NOT NULL,
  typical_actions JSONB DEFAULT '[]',
  avg_lead_time_days INTEGER,
  reliability_score DECIMAL(3,2) DEFAULT 0.50,
  total_matches INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  discovered_by VARCHAR(50) DEFAULT 'manual',
  validated_instances INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Stakeholder Action History Table
CREATE TABLE IF NOT EXISTS stakeholder_action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id UUID REFERENCES stakeholder_profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_category VARCHAR(50),
  action_details TEXT,
  action_date DATE NOT NULL,
  preceded_by_signals JSONB DEFAULT '[]',
  lead_time_days INTEGER,
  signal_timeline JSONB DEFAULT '{}',
  impact_magnitude VARCHAR(20),
  impact_details JSONB DEFAULT '{}',
  company_response JSONB DEFAULT '{}',
  outcome JSONB DEFAULT '{}',
  was_predicted BOOLEAN DEFAULT false,
  prediction_id UUID,
  pattern_reliability_update DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  intelligence_source_id UUID
);

-- 5. Prediction Metrics Table
CREATE TABLE IF NOT EXISTS prediction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  incorrect_predictions INTEGER DEFAULT 0,
  expired_predictions INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(3,2),
  high_confidence_accuracy DECIMAL(3,2),
  medium_confidence_accuracy DECIMAL(3,2),
  low_confidence_accuracy DECIMAL(3,2),
  regulator_accuracy DECIMAL(3,2),
  activist_accuracy DECIMAL(3,2),
  investor_accuracy DECIMAL(3,2),
  competitor_accuracy DECIMAL(3,2),
  avg_lead_time_days INTEGER,
  avg_lead_time_accuracy DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: INSERT DEFAULT PATTERNS
-- ============================================================================

INSERT INTO stakeholder_patterns (pattern_name, stakeholder_type, pattern_description, early_signals, typical_actions, avg_lead_time_days, reliability_score)
VALUES
(
  'Regulatory Enforcement Pattern',
  'regulator',
  'Pattern indicating likely regulatory enforcement action against company or industry',
  '{"T90": ["Peer company enforcement actions", "Industry-wide investigations"], "T60": ["Congressional hearing mentions", "Regulator speech references"], "T30": ["Informal inquiries", "Document requests"], "T14": ["Wells notice issued", "Settlement discussions"], "T7": ["Enforcement action filed", "Public announcement"]}',
  '["Fines", "Consent orders", "Business restrictions", "Enhanced oversight"]',
  45,
  0.78
),
(
  'Activist Campaign Pattern',
  'activist',
  'Pattern indicating activist investor preparing campaign against company',
  '{"T90": ["Initial stake building (<5%)", "Industry white papers"], "T60": ["Stake increase (5-10%)", "Private engagement attempts"], "T30": ["13D filing", "Public criticism"], "T14": ["Proxy fight announcement", "Media campaign"], "T7": ["Shareholder proposal", "Board nominations"]}',
  '["Board changes", "Strategy shifts", "Asset sales", "Management changes"]',
  60,
  0.82
),
(
  'Institutional Selloff Pattern',
  'investor',
  'Pattern indicating institutional investors reducing positions',
  '{"T60": ["Reduced analyst coverage", "Negative research notes"], "T30": ["Small position reductions", "Reduced conference participation"], "T14": ["Accelerated selling", "Public concerns expressed"], "T7": ["Major position exit", "Downgrades"]}',
  '["Stock pressure", "Liquidity issues", "Credit impacts", "Valuation decline"]',
  30,
  0.75
),
(
  'Customer Revolt Pattern',
  'customer',
  'Pattern indicating customer backlash and potential boycott',
  '{"T30": ["Social media complaint velocity +50%", "Support ticket spike"], "T14": ["Viral negative post", "Influencer criticism"], "T7": ["Organized boycott calls", "Media coverage"], "T3": ["Hashtag trending", "Competitor positioning"]}',
  '["Revenue impact", "Brand damage", "Churn spike", "PR crisis"]',
  14,
  0.71
),
(
  'Employee Exodus Pattern',
  'employee',
  'Pattern indicating mass employee departures or unionization effort',
  '{"T60": ["Glassdoor rating decline", "Reduced job posting responses"], "T30": ["LinkedIn profile update spike", "Internal survey negativity"], "T14": ["Key talent departures", "Recruiting difficulty"], "T7": ["Mass resignation threats", "Union activity"]}',
  '["Productivity loss", "Knowledge drain", "Morale crisis", "Union vote"]',
  30,
  0.73
),
(
  'Competitor Product Launch Pattern',
  'competitor',
  'Pattern indicating competitor preparing major product launch',
  '{"T90": ["Increased hiring", "Patent filings"], "T60": ["Supply chain movements", "Marketing job postings"], "T30": ["Press briefing invitations", "Beta testing signals"], "T14": ["Launch event announced", "Marketing campaign starts"], "T7": ["Product revealed", "Pre-orders open"]}',
  '["Market share threat", "Pricing pressure", "Feature comparison", "Customer churn risk"]',
  45,
  0.68
),
(
  'Media Investigation Pattern',
  'media',
  'Pattern indicating journalist preparing investigative report',
  '{"T60": ["Source requests", "Document FOIA filings"], "T30": ["Employee interviews", "Former executive contacts"], "T14": ["Company comment request", "Legal review"], "T7": ["Publication scheduled", "Fact-checking queries"]}',
  '["Negative coverage", "Stock impact", "Reputation damage", "Legal exposure"]',
  40,
  0.70
)
ON CONFLICT (pattern_name) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

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

-- ============================================================================
-- STEP 4: ENABLE RLS
-- ============================================================================

ALTER TABLE stakeholder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES (Fixed for your profiles table structure)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "org_profiles_policy" ON stakeholder_profiles;
DROP POLICY IF EXISTS "org_predictions_policy" ON stakeholder_predictions;
DROP POLICY IF EXISTS "public_patterns_read_policy" ON stakeholder_patterns;
DROP POLICY IF EXISTS "org_patterns_write_policy" ON stakeholder_patterns;
DROP POLICY IF EXISTS "org_action_history_policy" ON stakeholder_action_history;
DROP POLICY IF EXISTS "org_metrics_policy" ON prediction_metrics;

-- Stakeholder Profiles: User can access their organization's profiles
CREATE POLICY "org_profiles_policy" ON stakeholder_profiles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Stakeholder Predictions: User can access their organization's predictions
CREATE POLICY "org_predictions_policy" ON stakeholder_predictions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Stakeholder Patterns: Everyone can read, authenticated users can write
CREATE POLICY "public_patterns_read_policy" ON stakeholder_patterns
  FOR SELECT USING (true);

CREATE POLICY "org_patterns_write_policy" ON stakeholder_patterns
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Action History: User can access their organization's history
CREATE POLICY "org_action_history_policy" ON stakeholder_action_history
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Prediction Metrics: User can access their organization's metrics
CREATE POLICY "org_metrics_policy" ON prediction_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 6: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update pattern reliability based on prediction outcomes
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

-- Trigger for pattern reliability updates
DROP TRIGGER IF EXISTS update_pattern_reliability_trigger ON stakeholder_predictions;
CREATE TRIGGER update_pattern_reliability_trigger
  AFTER UPDATE ON stakeholder_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_reliability();

-- ============================================================================
-- STEP 7: CREATE VIEW
-- ============================================================================

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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Prediction system setup complete!' as status;
SELECT COUNT(*) as pattern_count FROM stakeholder_patterns;
