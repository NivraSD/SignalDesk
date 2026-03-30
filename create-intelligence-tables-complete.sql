-- Complete Intelligence Tables Setup for Supabase
-- Run this in Supabase SQL Editor

-- 1. Organization Profiles table
CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    organization_id TEXT,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Intelligence Stage Data table
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Intelligence Targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Source Registry table (for RSS feeds and monitoring sources)
CREATE TABLE IF NOT EXISTS source_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- 'rss', 'api', 'website'
    industry TEXT,
    tags TEXT[],
    active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Monitoring Results table
CREATE TABLE IF NOT EXISTS monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    source TEXT NOT NULL,
    signals JSONB,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_created ON intelligence_stage_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_org ON monitoring_results(organization_name, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_industry ON source_registry(industry, active);

-- Enable Row Level Security
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for testing)
-- In production, replace with proper user-based policies

CREATE POLICY "Allow anon access to organization_profiles" ON organization_profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to intelligence_stage_data" ON intelligence_stage_data
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to intelligence_targets" ON intelligence_targets
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to source_registry" ON source_registry
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon access to monitoring_results" ON monitoring_results
    FOR ALL USING (true) WITH CHECK (true);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_organization_profiles_updated_at ON organization_profiles;
CREATE TRIGGER update_organization_profiles_updated_at
    BEFORE UPDATE ON organization_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intelligence_targets_updated_at ON intelligence_targets;
CREATE TRIGGER update_intelligence_targets_updated_at
    BEFORE UPDATE ON intelligence_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_source_registry_updated_at ON source_registry;
CREATE TRIGGER update_source_registry_updated_at
    BEFORE UPDATE ON source_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default RSS sources for testing
INSERT INTO source_registry (name, url, type, industry, tags)
VALUES 
    ('TechCrunch', 'https://techcrunch.com/feed/', 'rss', 'technology', ARRAY['tech', 'startups', 'news']),
    ('VentureBeat', 'https://feeds.feedburner.com/venturebeat/SZYF', 'rss', 'technology', ARRAY['tech', 'ai', 'enterprise']),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss', 'technology', ARRAY['tech', 'consumer', 'gadgets']),
    ('Business Wire Tech', 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtRWA==', 'rss', 'business', ARRAY['pr', 'announcements']),
    ('PR Newswire Tech', 'https://www.prnewswire.com/rss/technology-latest-news/technology-latest-news-list.rss', 'rss', 'technology', ARRAY['pr', 'news'])
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'organization_profiles', 
    'intelligence_stage_data', 
    'intelligence_targets',
    'source_registry',
    'monitoring_results'
);