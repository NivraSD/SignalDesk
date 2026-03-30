-- =============================================
-- UNIFIED SIGNALS SCHEMA - PART 1: TABLES
-- Run this first, then part2, then part3
-- =============================================

-- Drop indexes first (in case tables don't exist but indexes do from partial run)
DROP INDEX IF EXISTS idx_signals_org_status;
DROP INDEX IF EXISTS idx_signals_org_type;
DROP INDEX IF EXISTS idx_signals_org_urgency;
DROP INDEX IF EXISTS idx_signals_primary_target;
DROP INDEX IF EXISTS idx_signals_feedback;
DROP INDEX IF EXISTS idx_signals_detected;
DROP INDEX IF EXISTS idx_intelligence_targets_org;
DROP INDEX IF EXISTS idx_intelligence_targets_type;
DROP INDEX IF EXISTS idx_target_intel_events_target;
DROP INDEX IF EXISTS idx_target_intel_events_org_date;
DROP INDEX IF EXISTS idx_target_intel_events_type;
DROP INDEX IF EXISTS idx_platform_analytics_period;
DROP INDEX IF EXISTS idx_platform_analytics_type;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS platform_pattern_library CASCADE;
DROP TABLE IF EXISTS platform_signal_analytics CASCADE;
DROP TABLE IF EXISTS signals CASCADE;
DROP TABLE IF EXISTS target_intel_events CASCADE;
DROP TABLE IF EXISTS intelligence_targets CASCADE;

-- =============================================
-- 1. INTELLIGENCE TARGETS
-- =============================================
CREATE TABLE intelligence_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Target identity
  name TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('competitor', 'stakeholder', 'regulator', 'customer', 'partner', 'influencer')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  category TEXT,

  -- Monitoring config
  monitoring_keywords TEXT[] DEFAULT '{}',
  monitoring_context TEXT,

  -- Accumulated intelligence
  accumulated_context JSONB DEFAULT '{}',
  baseline_metrics JSONB DEFAULT '{}',

  -- Activity tracking
  last_activity_at TIMESTAMPTZ,
  last_activity_summary TEXT,
  activity_count INTEGER DEFAULT 0,

  -- Source tracking
  synced_from TEXT DEFAULT 'company_profile',

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, name, target_type)
);

CREATE INDEX idx_intelligence_targets_org ON intelligence_targets(organization_id) WHERE is_active = true;
CREATE INDEX idx_intelligence_targets_type ON intelligence_targets(organization_id, target_type) WHERE is_active = true;

-- =============================================
-- 2. TARGET INTEL EVENTS
-- =============================================
CREATE TABLE target_intel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
  target_name TEXT NOT NULL,

  -- Event details
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'product_launch', 'product_update', 'product_discontinue',
    'hiring', 'layoffs', 'executive_move', 'executive_departure',
    'funding', 'acquisition', 'ipo', 'divestiture', 'bankruptcy',
    'partnership', 'partnership_end', 'contract_win', 'contract_loss',
    'expansion', 'contraction', 'restructuring', 'merger',
    'regulatory_action', 'regulatory_approval', 'legal_filing', 'legal_settlement', 'investigation',
    'earnings', 'guidance', 'analyst_rating', 'credit_rating',
    'crisis', 'scandal', 'pr_event', 'award', 'recognition',
    'market_entry', 'market_exit', 'pricing_change',
    'other'
  )),

  headline TEXT NOT NULL,
  summary TEXT,

  source_article_ids UUID[],
  source_urls TEXT[],
  source_names TEXT[],

  sentiment NUMERIC CHECK (sentiment >= -1 AND sentiment <= 1),
  significance_score INTEGER CHECK (significance_score >= 1 AND significance_score <= 100),

  extracted_data JSONB DEFAULT '{}',
  extracted_by TEXT,
  raw_extraction JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_target_intel_events_target ON target_intel_events(target_id, event_date DESC);
CREATE INDEX idx_target_intel_events_org_date ON target_intel_events(organization_id, event_date DESC);
CREATE INDEX idx_target_intel_events_type ON target_intel_events(target_id, event_type, event_date DESC);

-- =============================================
-- 3. SIGNALS (unified)
-- =============================================
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Signal classification
  signal_type TEXT NOT NULL CHECK (signal_type IN ('movement', 'connection', 'predictive', 'opportunity')),
  signal_subtype TEXT,

  -- Signal content
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Primary entity
  primary_target_id UUID REFERENCES intelligence_targets(id),
  primary_target_name TEXT,
  primary_target_type TEXT,

  -- Related entities
  related_target_ids UUID[],
  related_target_names TEXT[],
  related_entities JSONB DEFAULT '[]',

  -- Scoring
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 100),
  significance_score INTEGER CHECK (significance_score >= 1 AND significance_score <= 100),
  urgency TEXT DEFAULT 'near_term' CHECK (urgency IN ('immediate', 'near_term', 'monitoring')),
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('critical', 'high', 'medium', 'low')),

  -- Evidence & reasoning
  evidence JSONB NOT NULL DEFAULT '{}',
  reasoning TEXT,
  pattern_data JSONB DEFAULT '{}',

  -- Business implications
  business_implication TEXT,
  suggested_action TEXT,
  opportunity_type TEXT CHECK (opportunity_type IN (
    'advisory', 'competitive_response', 'partnership', 'sales',
    'risk_mitigation', 'pr_response', 'investment', 'talent', 'other'
  )),

  -- Timeline
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  signal_start_date TIMESTAMPTZ,
  signal_peak_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'monitoring', 'actioned', 'resolved', 'dismissed', 'expired'
  )),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,

  -- Outcome tracking
  user_feedback TEXT CHECK (user_feedback IN (
    'accurate', 'inaccurate', 'partially_accurate', 'too_early', 'not_relevant', 'pending'
  )) DEFAULT 'pending',
  outcome_value TEXT CHECK (outcome_value IN (
    'high_value', 'some_value', 'no_value', 'negative', 'pending'
  )) DEFAULT 'pending',
  outcome_notes TEXT,
  feedback_recorded_at TIMESTAMPTZ,
  feedback_recorded_by UUID,

  -- Metadata
  source_pipeline TEXT,
  model_version TEXT,
  generation_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_org_status ON signals(organization_id, status) WHERE status IN ('active', 'monitoring');
CREATE INDEX idx_signals_org_type ON signals(organization_id, signal_type, detected_at DESC);
CREATE INDEX idx_signals_org_urgency ON signals(organization_id, urgency, detected_at DESC) WHERE status = 'active';
CREATE INDEX idx_signals_primary_target ON signals(primary_target_id) WHERE primary_target_id IS NOT NULL;
CREATE INDEX idx_signals_feedback ON signals(organization_id, user_feedback) WHERE user_feedback IS NOT NULL;
CREATE INDEX idx_signals_detected ON signals(detected_at DESC);

-- =============================================
-- 4. PLATFORM ANALYTICS TABLES
-- =============================================
CREATE TABLE platform_signal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  signal_type TEXT NOT NULL,
  signal_subtype TEXT,
  pattern_type TEXT,
  industry TEXT,

  total_signals INTEGER DEFAULT 0,
  unique_organizations INTEGER DEFAULT 0,
  signals_actioned INTEGER DEFAULT 0,
  signals_dismissed INTEGER DEFAULT 0,
  signals_expired INTEGER DEFAULT 0,
  avg_time_to_action_hours NUMERIC,

  feedback_count INTEGER DEFAULT 0,
  accurate_count INTEGER DEFAULT 0,
  inaccurate_count INTEGER DEFAULT 0,
  partially_accurate_count INTEGER DEFAULT 0,
  accuracy_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN feedback_count > 0
    THEN (accurate_count + partially_accurate_count * 0.5)::NUMERIC / feedback_count
    ELSE NULL END
  ) STORED,

  value_feedback_count INTEGER DEFAULT 0,
  high_value_count INTEGER DEFAULT 0,
  some_value_count INTEGER DEFAULT 0,
  no_value_count INTEGER DEFAULT 0,
  value_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN value_feedback_count > 0
    THEN (high_value_count + some_value_count * 0.5)::NUMERIC / value_feedback_count
    ELSE NULL END
  ) STORED,

  avg_confidence_score NUMERIC,
  avg_significance_score NUMERIC,
  confidence_calibration NUMERIC,
  avg_evidence_count NUMERIC,
  avg_signal_lifespan_days NUMERIC,
  pattern_metrics JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(period_start, period_end, period_type, signal_type, signal_subtype, industry)
);

CREATE INDEX idx_platform_analytics_period ON platform_signal_analytics(period_type, period_start DESC);
CREATE INDEX idx_platform_analytics_type ON platform_signal_analytics(signal_type, signal_subtype);

CREATE TABLE platform_pattern_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL UNIQUE,
  pattern_type TEXT NOT NULL,
  pattern_version TEXT DEFAULT '1.0',
  description TEXT NOT NULL,
  indicators JSONB NOT NULL,
  applicable_industries TEXT[],
  applicable_target_types TEXT[],
  times_triggered INTEGER DEFAULT 0,
  accuracy_rate NUMERIC,
  value_rate NUMERIC,
  avg_confidence NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'testing', 'deprecated')),
  min_confidence_threshold INTEGER DEFAULT 50,
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DONE - Part 1 Complete
-- Now run Part 2 (functions)
-- =============================================
