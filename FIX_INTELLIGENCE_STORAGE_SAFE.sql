-- Fix Intelligence Data Storage Issue (Safe Version)
-- This script ensures all monitoring and synthesis data can be properly stored
-- Works with existing schema

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
-- 4. Check if intelligence_findings exists and add organization_name if needed
-- ============================================
DO $$ 
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'intelligence_findings') THEN
    -- Check if organization_name column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'intelligence_findings' 
                   AND column_name = 'organization_name') THEN
      -- Add the column
      ALTER TABLE intelligence_findings 
      ADD COLUMN organization_name VARCHAR(255);
      
      -- Update existing records with a default organization name
      UPDATE intelligence_findings 
      SET organization_name = COALESCE(
        (metadata->>'organization')::text,
        'DefaultOrg'
      )
      WHERE organization_name IS NULL;
      
      -- Make it NOT NULL after updating
      ALTER TABLE intelligence_findings 
      ALTER COLUMN organization_name SET NOT NULL;
      
      -- Create index
      CREATE INDEX IF NOT EXISTS idx_findings_org 
      ON intelligence_findings(organization_name);
    END IF;
  ELSE
    -- Create the table if it doesn't exist
    CREATE TABLE intelligence_findings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_name VARCHAR(255) NOT NULL,
      target_id UUID,
      target_type VARCHAR(50),
      target_name VARCHAR(255),
      source_id UUID,
      source_type VARCHAR(50),
      title TEXT,
      content TEXT,
      url TEXT,
      author VARCHAR(255),
      published_at TIMESTAMP,
      sentiment_score DECIMAL(3,2),
      relevance_score DECIMAL(3,2),
      importance VARCHAR(20),
      finding_type VARCHAR(50),
      extracted_entities JSONB DEFAULT '[]'::jsonb,
      keywords_matched TEXT[],
      metadata JSONB DEFAULT '{}'::jsonb,
      processed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes
    CREATE INDEX idx_findings_org ON intelligence_findings(organization_name);
    CREATE INDEX idx_findings_date ON intelligence_findings(published_at DESC);
    CREATE INDEX idx_findings_processed ON intelligence_findings(processed, created_at);
    CREATE INDEX idx_findings_importance ON intelligence_findings(importance, relevance_score DESC);
  END IF;
END $$;

-- ============================================
-- 5. Create opportunities table if needed
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  organization_name VARCHAR(255),
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

-- Add organization_name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'opportunities' 
                 AND column_name = 'organization_name') THEN
    ALTER TABLE opportunities ADD COLUMN organization_name VARCHAR(255);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_org 
  ON opportunities(organization_name);
CREATE INDEX IF NOT EXISTS idx_opportunities_status 
  ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_urgency 
  ON opportunities(urgency, expires_at);

-- ============================================
-- 6. Create monitoring_metrics table
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
-- 7. Enable Row Level Security (RLS) safely
-- ============================================
DO $$
BEGIN
  -- Enable RLS on tables if they exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'intelligence_stage_data') THEN
    ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organization_profiles') THEN
    ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'intelligence_targets') THEN
    ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'intelligence_findings') THEN
    ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'opportunities') THEN
    ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'monitoring_metrics') THEN
    ALTER TABLE monitoring_metrics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- 8. Create RLS policies (drop existing first to avoid conflicts)
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all for intelligence_stage_data" ON intelligence_stage_data;
DROP POLICY IF EXISTS "Enable all for organization_profiles" ON organization_profiles;
DROP POLICY IF EXISTS "Enable all for intelligence_targets" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable all for intelligence_findings" ON intelligence_findings;
DROP POLICY IF EXISTS "Enable all for opportunities" ON opportunities;
DROP POLICY IF EXISTS "Enable all for monitoring_metrics" ON monitoring_metrics;

-- Create new policies
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
-- 9. Test the storage with sample data
-- ============================================
-- Insert test stage data
INSERT INTO intelligence_stage_data (
  organization_name,
  stage_name,
  stage_data
) VALUES (
  'TestOrg',
  'test_stage',
  jsonb_build_object(
    'test', 'This is test stage data',
    'timestamp', NOW()::text,
    'status', 'success'
  )
);

-- Insert test profile
INSERT INTO organization_profiles (
  organization_name,
  profile_data
) VALUES (
  'TestOrg',
  jsonb_build_object(
    'organization', jsonb_build_object(
      'name', 'TestOrg',
      'industry', 'technology'
    ),
    'competitors', jsonb_build_object(
      'direct', ARRAY['Comp1', 'Comp2'],
      'indirect', ARRAY['Comp3']
    )
  )
) ON CONFLICT (organization_name) DO UPDATE
SET profile_data = EXCLUDED.profile_data,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- 10. Verify data was stored
-- ============================================
SELECT 'Tables created/updated:' as status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_name IN (
  'intelligence_stage_data',
  'organization_profiles',
  'intelligence_targets',
  'intelligence_findings',
  'opportunities',
  'monitoring_metrics'
)
ORDER BY table_name;

-- Count records in each table
SELECT 'Record counts:' as status;

SELECT 'intelligence_stage_data' as table_name, COUNT(*) as records 
FROM intelligence_stage_data
UNION ALL
SELECT 'organization_profiles', COUNT(*) 
FROM organization_profiles
UNION ALL
SELECT 'intelligence_targets', COUNT(*) 
FROM intelligence_targets
UNION ALL
SELECT 'intelligence_findings', COUNT(*) 
FROM intelligence_findings
UNION ALL
SELECT 'opportunities', COUNT(*) 
FROM opportunities
UNION ALL
SELECT 'monitoring_metrics', COUNT(*) 
FROM monitoring_metrics
ORDER BY table_name;

-- ============================================
-- 11. Grant permissions to service role
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Success message
SELECT '✅ Intelligence storage tables configured successfully!' as status,
       '📝 Run test-intelligence-storage.sh to verify' as next_step;