-- Fix Intelligence Data Storage Issue
-- This script ensures all monitoring and synthesis data can be properly stored

-- ============================================
-- 1. Create intelligence_stage_data table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  stage_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stage_data_org_stage 
  ON intelligence_stage_data(organization_name, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_data_created 
  ON intelligence_stage_data(created_at DESC);

-- ============================================
-- 2. Create organization_profiles table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) UNIQUE NOT NULL,
  organization_id VARCHAR(255),
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_profiles_name 
  ON organization_profiles(organization_name);

-- ============================================
-- 3. Create intelligence_targets table (for competitors/stakeholders)
-- ============================================
CREATE TABLE IF NOT EXISTS intelligence_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) UNIQUE NOT NULL,
  competitors JSONB DEFAULT '{}'::jsonb,
  stakeholders JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_intel_targets_org 
  ON intelligence_targets(organization_name);

-- ============================================
-- 4. Create intelligence_findings table for raw monitoring data
-- ============================================
CREATE TABLE IF NOT EXISTS intelligence_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  target_type VARCHAR(50), -- 'competitor', 'topic', 'media', etc
  target_name VARCHAR(255),
  source_type VARCHAR(50), -- 'news', 'social', 'academic', etc
  title TEXT,
  content TEXT,
  url TEXT,
  author VARCHAR(255),
  published_at TIMESTAMP,
  sentiment_score DECIMAL(3,2),
  relevance_score DECIMAL(3,2),
  importance VARCHAR(20),
  extracted_entities JSONB DEFAULT '[]'::jsonb,
  keywords_matched TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_findings_org 
  ON intelligence_findings(organization_name);
CREATE INDEX IF NOT EXISTS idx_findings_date 
  ON intelligence_findings(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_processed 
  ON intelligence_findings(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_findings_importance 
  ON intelligence_findings(importance, relevance_score DESC);

-- ============================================
-- 5. Create opportunities table
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  opportunity_type VARCHAR(50),
  nvs_score DECIMAL(5,2),
  confidence_score DECIMAL(3,2),
  urgency VARCHAR(20),
  status VARCHAR(20) DEFAULT 'identified',
  supporting_findings UUID[],
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_org 
  ON opportunities(organization_name);
CREATE INDEX IF NOT EXISTS idx_opportunities_status 
  ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_urgency 
  ON opportunities(urgency, expires_at);

-- ============================================
-- 6. Create monitoring_metrics table for analytics
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

-- ============================================
-- 7. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. Create RLS policies for public access (adjust as needed)
-- ============================================
-- Allow all operations for now (you can restrict later based on auth)
CREATE POLICY "Enable all for intelligence_stage_data" ON intelligence_stage_data
  FOR ALL TO public USING (true) WITH CHECK (true);
  
CREATE POLICY "Enable all for organization_profiles" ON organization_profiles
  FOR ALL TO public USING (true) WITH CHECK (true);
  
CREATE POLICY "Enable all for intelligence_targets" ON intelligence_targets
  FOR ALL TO public USING (true) WITH CHECK (true);
  
CREATE POLICY "Enable all for intelligence_findings" ON intelligence_findings
  FOR ALL TO public USING (true) WITH CHECK (true);
  
CREATE POLICY "Enable all for opportunities" ON opportunities
  FOR ALL TO public USING (true) WITH CHECK (true);
  
CREATE POLICY "Enable all for monitoring_metrics" ON monitoring_metrics
  FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================
-- 9. Create helper function to save monitoring data
-- ============================================
CREATE OR REPLACE FUNCTION save_monitoring_data(
  p_org_name VARCHAR,
  p_target_type VARCHAR,
  p_target_name VARCHAR,
  p_source_type VARCHAR,
  p_title TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_finding_id UUID;
BEGIN
  INSERT INTO intelligence_findings (
    organization_name,
    target_type,
    target_name,
    source_type,
    title,
    content,
    metadata,
    published_at
  ) VALUES (
    p_org_name,
    p_target_type,
    p_target_name,
    p_source_type,
    p_title,
    p_content,
    p_metadata,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_finding_id;
  
  RETURN v_finding_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Test the storage with sample data
-- ============================================
-- Insert test monitoring data
INSERT INTO intelligence_findings (
  organization_name,
  target_type,
  target_name,
  source_type,
  title,
  content,
  relevance_score,
  importance
) VALUES (
  'TestOrg',
  'competitor',
  'TestCompetitor',
  'news',
  'Test Finding for Storage Verification',
  'This is a test finding to verify that monitoring data can be stored properly.',
  0.85,
  'medium'
) ON CONFLICT DO NOTHING;

-- Insert test stage data
INSERT INTO intelligence_stage_data (
  organization_name,
  stage_name,
  stage_data
) VALUES (
  'TestOrg',
  'test_stage',
  '{"test": "This is test stage data", "timestamp": "'|| NOW() ||'"}'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================
-- 11. Verify data was stored
-- ============================================
SELECT 'intelligence_findings count:' as table_name, COUNT(*) as records 
FROM intelligence_findings 
WHERE organization_name = 'TestOrg'
UNION ALL
SELECT 'intelligence_stage_data count:', COUNT(*) 
FROM intelligence_stage_data 
WHERE organization_name = 'TestOrg'
UNION ALL
SELECT 'Total monitoring records:', COUNT(*) 
FROM intelligence_findings;

-- ============================================
-- 12. Grant permissions to service role
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Success message
SELECT '✅ Intelligence storage tables created and configured successfully!' as status;