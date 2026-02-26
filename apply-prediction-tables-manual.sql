-- Manual Complete Prediction System Setup
-- Run this directly in Supabase SQL Editor

-- 1. Create stakeholder_profiles if not exists
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

-- 2. Create stakeholder_predictions if not exists
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

-- 3. Now create the rest (patterns, history, metrics)
-- These are in the fix migration

SELECT 'Prediction tables setup complete!' as status;
