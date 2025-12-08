-- =============================================
-- UNIFIED SIGNALS SCHEMA - PART 3: TRIGGERS & RLS
-- Run after Part 2
-- =============================================

-- =============================================
-- TRIGGERS (without the organizations trigger for now)
-- =============================================

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_intelligence_targets_updated ON intelligence_targets;
CREATE TRIGGER trg_intelligence_targets_updated
  BEFORE UPDATE ON intelligence_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_signals_updated ON signals;
CREATE TRIGGER trg_signals_updated
  BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_intel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_signal_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_pattern_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own org intelligence_targets" ON intelligence_targets;
DROP POLICY IF EXISTS "Users can view own org target_intel_events" ON target_intel_events;
DROP POLICY IF EXISTS "Users can view own org signals" ON signals;
DROP POLICY IF EXISTS "Users can update own org signals" ON signals;
DROP POLICY IF EXISTS "Service role full access to intelligence_targets" ON intelligence_targets;
DROP POLICY IF EXISTS "Service role full access to target_intel_events" ON target_intel_events;
DROP POLICY IF EXISTS "Service role full access to signals" ON signals;
DROP POLICY IF EXISTS "Only service role can access platform_signal_analytics" ON platform_signal_analytics;
DROP POLICY IF EXISTS "Only service role can access platform_pattern_library" ON platform_pattern_library;

-- User policies
CREATE POLICY "Users can view own org intelligence_targets"
  ON intelligence_targets FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org target_intel_events"
  ON target_intel_events FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org signals"
  ON signals FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own org signals"
  ON signals FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM org_users WHERE user_id = auth.uid()
  ));

-- Service role policies
CREATE POLICY "Service role full access to intelligence_targets"
  ON intelligence_targets FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to target_intel_events"
  ON target_intel_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to signals"
  ON signals FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access platform_signal_analytics"
  ON platform_signal_analytics FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Only service role can access platform_pattern_library"
  ON platform_pattern_library FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE intelligence_targets IS 'Entities being tracked for each organization (competitors, stakeholders, regulators). Synced from company_profile.';
COMMENT ON TABLE target_intel_events IS 'Historical events detected for each intelligence target. Used for trend analysis and movement detection.';
COMMENT ON TABLE signals IS 'Unified signals table - combines predictions, connections, movements, and opportunities.';
COMMENT ON TABLE platform_signal_analytics IS 'Aggregated, anonymized signal performance data for platform-wide learning.';
COMMENT ON TABLE platform_pattern_library IS 'Library of detection patterns with performance metrics.';

-- =============================================
-- DONE - Part 3 Complete
-- Now run Part 4 (data sync - can be run separately)
-- =============================================
