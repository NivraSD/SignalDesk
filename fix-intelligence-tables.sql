-- Fix Intelligence Tables for Supabase
-- This script checks existing tables and adds missing ones

-- First, let's check what tables already exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('organization_profiles', 'intelligence_stage_data', 'intelligence_targets')
ORDER BY table_name, ordinal_position;

-- If organization_profiles exists but with different columns, alter it
DO $$
BEGIN
    -- Check if organization_profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_profiles') THEN
        -- Add organization_name column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'organization_profiles' 
                      AND column_name = 'organization_name') THEN
            -- Check if there's an 'org_name' or 'name' column we should rename
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'organization_profiles' 
                      AND column_name = 'org_name') THEN
                ALTER TABLE organization_profiles RENAME COLUMN org_name TO organization_name;
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'organization_profiles' 
                         AND column_name = 'name') THEN
                ALTER TABLE organization_profiles RENAME COLUMN name TO organization_name;
            ELSE
                -- Add the column if it doesn't exist in any form
                ALTER TABLE organization_profiles ADD COLUMN organization_name TEXT UNIQUE;
            END IF;
        END IF;
        
        -- Add other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'organization_profiles' 
                      AND column_name = 'organization_id') THEN
            ALTER TABLE organization_profiles ADD COLUMN organization_id TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'organization_profiles' 
                      AND column_name = 'profile_data') THEN
            ALTER TABLE organization_profiles ADD COLUMN profile_data JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'organization_profiles' 
                      AND column_name = 'updated_at') THEN
            ALTER TABLE organization_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE organization_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_name TEXT UNIQUE NOT NULL,
            organization_id TEXT,
            profile_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create intelligence_stage_data if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create intelligence_targets if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create source_registry if it doesn't exist
CREATE TABLE IF NOT EXISTS source_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    industry TEXT,
    tags TEXT[],
    active BOOLEAN DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monitoring_results if it doesn't exist
CREATE TABLE IF NOT EXISTS monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    source TEXT NOT NULL,
    signals JSONB,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_created ON intelligence_stage_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_org ON monitoring_results(organization_name, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_industry ON source_registry(industry, active);

-- Enable RLS (safe to run multiple times)
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow anon access to organization_profiles" ON organization_profiles;
CREATE POLICY "Allow anon access to organization_profiles" ON organization_profiles
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to intelligence_stage_data" ON intelligence_stage_data;
CREATE POLICY "Allow anon access to intelligence_stage_data" ON intelligence_stage_data
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to intelligence_targets" ON intelligence_targets;
CREATE POLICY "Allow anon access to intelligence_targets" ON intelligence_targets
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to source_registry" ON source_registry;
CREATE POLICY "Allow anon access to source_registry" ON source_registry
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon access to monitoring_results" ON monitoring_results;
CREATE POLICY "Allow anon access to monitoring_results" ON monitoring_results
    FOR ALL USING (true) WITH CHECK (true);

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers (DROP IF EXISTS first to avoid errors)
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

-- Insert default RSS sources (with ON CONFLICT to avoid duplicates)
INSERT INTO source_registry (name, url, type, industry, tags)
VALUES 
    ('TechCrunch', 'https://techcrunch.com/feed/', 'rss', 'technology', ARRAY['tech', 'startups', 'news']),
    ('VentureBeat', 'https://feeds.feedburner.com/venturebeat/SZYF', 'rss', 'technology', ARRAY['tech', 'ai', 'enterprise']),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss', 'technology', ARRAY['tech', 'consumer', 'gadgets']),
    ('Business Wire Tech', 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtRWA==', 'rss', 'business', ARRAY['pr', 'announcements']),
    ('PR Newswire Tech', 'https://www.prnewswire.com/rss/technology-latest-news/technology-latest-news-list.rss', 'rss', 'technology', ARRAY['pr', 'news'])
ON CONFLICT DO NOTHING;

-- Final verification
SELECT 
    'Tables Created/Fixed:' as status,
    COUNT(*) as table_count,
    string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'organization_profiles', 
    'intelligence_stage_data', 
    'intelligence_targets',
    'source_registry',
    'monitoring_results'
);

-- Show the structure of organization_profiles to confirm
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
ORDER BY ordinal_position;