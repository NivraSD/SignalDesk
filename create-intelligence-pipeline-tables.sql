-- SignalDesk Intelligence Pipeline Tables
-- Run this in Supabase SQL Editor to create all required tables

-- 1. Organization Profiles Table
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT UNIQUE NOT NULL,
    organization_id TEXT,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_profiles_name ON organization_profiles(organization_name);

-- Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for anon access (adjust as needed)
CREATE POLICY "Enable read access for all users" ON organization_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON organization_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON organization_profiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Intelligence Stage Data Table
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create composite index for org + stage lookups
CREATE INDEX IF NOT EXISTS idx_stage_data_org_stage ON intelligence_stage_data(organization_name, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_data_created ON intelligence_stage_data(created_at DESC);

-- Enable RLS
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON intelligence_stage_data
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON intelligence_stage_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON intelligence_stage_data
    FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Intelligence Targets Table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB DEFAULT '[]',
    stakeholders JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_targets_org_name ON intelligence_targets(organization_name);

-- Enable RLS
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON intelligence_targets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON intelligence_targets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON intelligence_targets
    FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Organizations Table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    domain TEXT,
    industry TEXT,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON organizations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON organizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON organizations
    FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Monitoring Configs Table
CREATE TABLE IF NOT EXISTS monitoring_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT NOT NULL,
    config_type TEXT NOT NULL, -- 'firecrawl', 'rss', 'api', etc.
    config_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_configs_org ON monitoring_configs(organization_name);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_type ON monitoring_configs(config_type);

-- Enable RLS
ALTER TABLE monitoring_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON monitoring_configs
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON monitoring_configs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON monitoring_configs
    FOR UPDATE USING (true) WITH CHECK (true);

-- 6. Source Registry Table
CREATE TABLE IF NOT EXISTS source_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'rss', 'website', 'api'
    source_url TEXT NOT NULL,
    source_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_registry_org ON source_registry(organization_name);
CREATE INDEX IF NOT EXISTS idx_source_registry_type ON source_registry(source_type);

-- Enable RLS
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON source_registry
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON source_registry
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON source_registry
    FOR UPDATE USING (true) WITH CHECK (true);

-- 7. Intelligence Findings Table (for collected signals)
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT NOT NULL,
    source TEXT NOT NULL,
    finding_type TEXT NOT NULL,
    content JSONB DEFAULT '{}',
    relevance_score DECIMAL(3,2),
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_org ON intelligence_findings(organization_name);
CREATE INDEX IF NOT EXISTS idx_findings_processed ON intelligence_findings(processed);
CREATE INDEX IF NOT EXISTS idx_findings_created ON intelligence_findings(created_at DESC);

-- Enable RLS
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON intelligence_findings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON intelligence_findings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON intelligence_findings
    FOR UPDATE USING (true) WITH CHECK (true);

-- 8. Monitoring Alerts Table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_org ON monitoring_alerts(organization_name);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON monitoring_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON monitoring_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON monitoring_alerts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON monitoring_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON monitoring_alerts
    FOR UPDATE USING (true) WITH CHECK (true);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
CREATE TRIGGER update_organization_profiles_updated_at BEFORE UPDATE ON organization_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_stage_data_updated_at BEFORE UPDATE ON intelligence_stage_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_targets_updated_at BEFORE UPDATE ON intelligence_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_configs_updated_at BEFORE UPDATE ON monitoring_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_source_registry_updated_at BEFORE UPDATE ON source_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_findings_updated_at BEFORE UPDATE ON intelligence_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_alerts_updated_at BEFORE UPDATE ON monitoring_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial test data
INSERT INTO organizations (name, domain, industry, description)
VALUES 
    ('Sprout Social', 'sproutsocial.com', 'Social Media Management', 'Leading social media management platform')
ON CONFLICT (name) DO NOTHING;

INSERT INTO intelligence_targets (organization_name, competitors, stakeholders)
VALUES 
    ('Sprout Social', 
     '["Hootsuite", "Buffer", "Sprinklr", "Agorapulse", "Later"]'::jsonb,
     '["marketing_managers", "social_media_managers", "agencies", "enterprise_clients"]'::jsonb)
ON CONFLICT (organization_name) DO NOTHING;

INSERT INTO source_registry (organization_name, source_type, source_url, source_config)
VALUES 
    ('Sprout Social', 'rss', 'https://sproutsocial.com/insights/feed/', '{"check_frequency": "hourly"}'::jsonb),
    ('Sprout Social', 'website', 'https://sproutsocial.com', '{"crawl_depth": 2}'::jsonb)
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 
    tablename,
    (SELECT COUNT(*) FROM pg_attribute WHERE attrelid = (quote_ident(schemaname)||'.'||quote_ident(tablename))::regclass AND attnum > 0 AND NOT attisdropped) as column_count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'organization_profiles',
        'intelligence_stage_data',
        'intelligence_targets',
        'organizations',
        'monitoring_configs',
        'source_registry',
        'intelligence_findings',
        'monitoring_alerts'
    )
ORDER BY tablename;