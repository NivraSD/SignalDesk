-- Fix remaining table issues
-- Run this after the main script to complete the setup

-- ============================================
-- 1. Fix opportunities table - add expires_at if missing
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'opportunities' 
                 AND column_name = 'expires_at') THEN
    ALTER TABLE opportunities ADD COLUMN expires_at TIMESTAMP;
  END IF;
END $$;

-- Now create the index that was failing
CREATE INDEX IF NOT EXISTS idx_opportunities_urgency 
  ON opportunities(urgency, expires_at);

-- ============================================
-- 2. Create monitoring_metrics table (fixed syntax)
-- ============================================
CREATE TABLE IF NOT EXISTS monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  metric_date DATE NOT NULL,
  findings_count INTEGER DEFAULT 0,
  opportunities_identified INTEGER DEFAULT 0,
  average_relevance DECIMAL(3,2),
  average_sentiment DECIMAL(3,2),
  source_coverage DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_name, metric_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_metrics_org_date 
  ON monitoring_metrics(organization_name, metric_date DESC);

-- Enable RLS
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Enable all for monitoring_metrics" ON monitoring_metrics;
CREATE POLICY "Enable all for monitoring_metrics" ON monitoring_metrics
  FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================
-- 3. Verify all tables exist and have proper structure
-- ============================================
SELECT 
  'Table Status Report' as report_type,
  COUNT(*) as tables_ready
FROM information_schema.tables 
WHERE table_name IN (
  'intelligence_stage_data',
  'organization_profiles', 
  'intelligence_targets',
  'intelligence_findings',
  'opportunities',
  'monitoring_metrics'
);

-- ============================================
-- 4. Insert test data to verify everything works
-- ============================================
-- Test monitoring metrics
INSERT INTO monitoring_metrics (
  organization_name,
  metric_date,
  findings_count,
  opportunities_identified
) VALUES (
  'TestOrg',
  CURRENT_DATE,
  10,
  3
) ON CONFLICT (organization_name, metric_date) DO UPDATE
SET findings_count = EXCLUDED.findings_count,
    opportunities_identified = EXCLUDED.opportunities_identified;

-- Test opportunity with all fields
INSERT INTO opportunities (
  organization_name,
  title,
  description,
  opportunity_type,
  urgency,
  status,
  expires_at
) VALUES (
  'TestOrg',
  'Test Opportunity for Storage Verification',
  'This verifies that opportunities can be stored with all fields',
  'test',
  'medium',
  'identified',
  CURRENT_TIMESTAMP + INTERVAL '7 days'
);

-- ============================================
-- 5. Final verification - count all records
-- ============================================
SELECT 
  'Storage System Status' as system,
  (SELECT COUNT(*) FROM intelligence_stage_data) as stage_data_records,
  (SELECT COUNT(*) FROM organization_profiles) as profiles,
  (SELECT COUNT(*) FROM intelligence_targets) as targets,
  (SELECT COUNT(*) FROM intelligence_findings) as findings,
  (SELECT COUNT(*) FROM opportunities) as opportunities,
  (SELECT COUNT(*) FROM monitoring_metrics) as metrics;

-- ============================================
-- Success message
-- ============================================
SELECT 
  '✅ All tables configured successfully!' as status,
  '🎯 Storage system ready for monitoring data' as message,
  '📊 Run test-intelligence-storage.sh to test the pipeline' as next_step;