-- Fix Intelligence Pipeline Tables for SignalDesk
-- This script creates/fixes all required tables for the intelligence pipeline
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing problematic tables to start fresh (comment out if you need to preserve data)
-- DROP TABLE IF EXISTS intelligence_stage_data CASCADE;
-- DROP TABLE IF EXISTS organization_profiles CASCADE;
-- DROP TABLE IF EXISTS intelligence_targets CASCADE;
-- DROP TABLE IF EXISTS source_registry CASCADE;
-- DROP TABLE IF EXISTS monitoring_results CASCADE;

-- =====================================================
-- CORE TABLES REQUIRED BY EDGE FUNCTIONS
-- =====================================================

-- 1. Organization Profiles Table (Expected by Edge Functions)
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL UNIQUE,
    profile_data JSONB NOT NULL DEFAULT '{}',
    industry TEXT,
    competitors TEXT[] DEFAULT '{}',
    stakeholders TEXT[] DEFAULT '{}',
    focus_topics TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
    -- Check and add organization_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='organization_profiles' 
                  AND column_name='organization_name') THEN
        ALTER TABLE organization_profiles ADD COLUMN organization_name TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- Check and add profile_data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='organization_profiles' 
                  AND column_name='profile_data') THEN
        ALTER TABLE organization_profiles ADD COLUMN profile_data JSONB NOT NULL DEFAULT '{}';
    END IF;
END $$;

-- 2. Intelligence Stage Data Table (Expected by Edge Functions)
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_name, stage_name)
);

-- 3. Intelligence Targets Table (Enhanced)
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    competitors TEXT[] DEFAULT '{}',
    stakeholders TEXT[] DEFAULT '{}',
    topics TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Source Registry Table
CREATE TABLE IF NOT EXISTS source_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'news', 'social', 'financial', 'competitor', etc.
    source_name TEXT NOT NULL,
    source_url TEXT,
    api_endpoint TEXT,
    api_key_ref TEXT, -- Reference to secure key storage
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Monitoring Results Table
CREATE TABLE IF NOT EXISTS monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    monitoring_type TEXT NOT NULL, -- 'competitor', 'stakeholder', 'topic', etc.
    target_name TEXT,
    findings JSONB NOT NULL DEFAULT '{}',
    sentiment TEXT,
    relevance_score DECIMAL(3,2),
    source TEXT,
    source_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organization Profiles indexes
CREATE INDEX IF NOT EXISTS idx_org_profiles_name ON organization_profiles(organization_name);
CREATE INDEX IF NOT EXISTS idx_org_profiles_created ON organization_profiles(created_at DESC);

-- Intelligence Stage Data indexes
CREATE INDEX IF NOT EXISTS idx_stage_data_org ON intelligence_stage_data(organization_name);
CREATE INDEX IF NOT EXISTS idx_stage_data_stage ON intelligence_stage_data(stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_data_status ON intelligence_stage_data(status);
CREATE INDEX IF NOT EXISTS idx_stage_data_created ON intelligence_stage_data(created_at DESC);

-- Intelligence Targets indexes
CREATE INDEX IF NOT EXISTS idx_targets_org ON intelligence_targets(organization_name);
CREATE INDEX IF NOT EXISTS idx_targets_active ON intelligence_targets(active);

-- Source Registry indexes
CREATE INDEX IF NOT EXISTS idx_source_registry_org ON source_registry(organization_name);
CREATE INDEX IF NOT EXISTS idx_source_registry_type ON source_registry(source_type);
CREATE INDEX IF NOT EXISTS idx_source_registry_active ON source_registry(active);

-- Monitoring Results indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_org ON monitoring_results(organization_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_type ON monitoring_results(monitoring_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_created ON monitoring_results(created_at DESC);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_findings_search 
    ON monitoring_results USING gin(findings);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - ANONYMOUS ACCESS FOR TESTING
-- =====================================================

-- Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access" ON organization_profiles;
DROP POLICY IF EXISTS "Allow anonymous write access" ON organization_profiles;
DROP POLICY IF EXISTS "Allow anonymous read access" ON intelligence_stage_data;
DROP POLICY IF EXISTS "Allow anonymous write access" ON intelligence_stage_data;
DROP POLICY IF EXISTS "Allow anonymous read access" ON intelligence_targets;
DROP POLICY IF EXISTS "Allow anonymous write access" ON intelligence_targets;
DROP POLICY IF EXISTS "Allow anonymous read access" ON source_registry;
DROP POLICY IF EXISTS "Allow anonymous write access" ON source_registry;
DROP POLICY IF EXISTS "Allow anonymous read access" ON monitoring_results;
DROP POLICY IF EXISTS "Allow anonymous write access" ON monitoring_results;

-- Create permissive policies for testing (TEMPORARY - REPLACE WITH PROPER AUTH LATER)
-- Organization Profiles
CREATE POLICY "Allow anonymous read access" ON organization_profiles
    FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON organization_profiles
    FOR ALL USING (true);

-- Intelligence Stage Data
CREATE POLICY "Allow anonymous read access" ON intelligence_stage_data
    FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON intelligence_stage_data
    FOR ALL USING (true);

-- Intelligence Targets
CREATE POLICY "Allow anonymous read access" ON intelligence_targets
    FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON intelligence_targets
    FOR ALL USING (true);

-- Source Registry
CREATE POLICY "Allow anonymous read access" ON source_registry
    FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON source_registry
    FOR ALL USING (true);

-- Monitoring Results
CREATE POLICY "Allow anonymous read access" ON monitoring_results
    FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON monitoring_results
    FOR ALL USING (true);

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_org_profiles_updated_at ON organization_profiles;
CREATE TRIGGER update_org_profiles_updated_at 
    BEFORE UPDATE ON organization_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stage_data_updated_at ON intelligence_stage_data;
CREATE TRIGGER update_stage_data_updated_at 
    BEFORE UPDATE ON intelligence_stage_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_targets_updated_at ON intelligence_targets;
CREATE TRIGGER update_targets_updated_at 
    BEFORE UPDATE ON intelligence_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_source_registry_updated_at ON source_registry;
CREATE TRIGGER update_source_registry_updated_at 
    BEFORE UPDATE ON source_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON organization_profiles TO anon, authenticated;
GRANT ALL ON intelligence_stage_data TO anon, authenticated;
GRANT ALL ON intelligence_targets TO anon, authenticated;
GRANT ALL ON source_registry TO anon, authenticated;
GRANT ALL ON monitoring_results TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- INSERT TEST DATA
-- =====================================================

-- Insert a test organization profile
INSERT INTO organization_profiles (
    organization_name,
    profile_data,
    industry,
    competitors,
    stakeholders,
    focus_topics
) VALUES (
    'test-org',
    '{"description": "Test Organization", "size": "medium", "founded": "2020"}',
    'Technology',
    ARRAY['Competitor1', 'Competitor2', 'Competitor3'],
    ARRAY['investors', 'customers', 'employees', 'media'],
    ARRAY['AI', 'Cloud Computing', 'Cybersecurity']
) ON CONFLICT (organization_name) DO UPDATE SET
    profile_data = EXCLUDED.profile_data,
    industry = EXCLUDED.industry,
    competitors = EXCLUDED.competitors,
    stakeholders = EXCLUDED.stakeholders,
    focus_topics = EXCLUDED.focus_topics,
    updated_at = NOW();

-- Insert test intelligence targets
INSERT INTO intelligence_targets (
    organization_name,
    competitors,
    stakeholders,
    topics,
    keywords,
    active
) VALUES (
    'test-org',
    ARRAY['Competitor1', 'Competitor2', 'Competitor3'],
    ARRAY['investors', 'customers', 'employees'],
    ARRAY['Product Launch', 'Market Expansion', 'Technology Innovation'],
    ARRAY['AI', 'machine learning', 'cloud', 'innovation'],
    true
) ON CONFLICT DO NOTHING;

-- Insert test source registry entries
INSERT INTO source_registry (
    organization_name,
    source_type,
    source_name,
    source_url,
    active
) VALUES 
    ('test-org', 'news', 'TechCrunch', 'https://techcrunch.com/feed/', true),
    ('test-org', 'news', 'Reuters Tech', 'https://www.reuters.com/technology/', true),
    ('test-org', 'social', 'Twitter API', 'https://api.twitter.com/2/', true),
    ('test-org', 'financial', 'Yahoo Finance', 'https://finance.yahoo.com/', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (RUN THESE TO CHECK SETUP)
-- =====================================================

-- Check tables exist with correct columns
SELECT 'organization_profiles' as table_name, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_profiles') as exists,
       COUNT(*) as row_count FROM organization_profiles
UNION ALL
SELECT 'intelligence_stage_data', 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_stage_data'),
       COUNT(*) FROM intelligence_stage_data
UNION ALL
SELECT 'intelligence_targets', 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_targets'),
       COUNT(*) FROM intelligence_targets
UNION ALL
SELECT 'source_registry', 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'source_registry'),
       COUNT(*) FROM source_registry
UNION ALL
SELECT 'monitoring_results', 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'monitoring_results'),
       COUNT(*) FROM monitoring_results;

-- Check columns for organization_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organization_profiles'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Intelligence Pipeline tables have been created/fixed successfully!';
    RAISE NOTICE '📊 Tables created: organization_profiles, intelligence_stage_data, intelligence_targets, source_registry, monitoring_results';
    RAISE NOTICE '🔓 Anonymous access enabled for testing (remember to add proper auth later)';
    RAISE NOTICE '📝 Test data inserted for organization: test-org';
END $$;