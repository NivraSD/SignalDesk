-- Migration script to fix existing tables for intelligence pipeline

-- 1. Fix organization_profiles table
-- Add the missing columns that Edge Functions expect
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS organization_name TEXT UNIQUE;

-- Copy existing name data to organization_name
UPDATE organization_profiles 
SET organization_name = name 
WHERE organization_name IS NULL;

-- Add profile_data column for storing complete profile
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS profile_data JSONB;

-- Update profile_data with existing data
UPDATE organization_profiles 
SET profile_data = jsonb_build_object(
    'name', name,
    'type', type,
    'description', description,
    'keywords', keywords,
    'focus_areas', focus_areas,
    'settings', settings,
    'metadata', metadata
)
WHERE profile_data IS NULL;

-- 2. Create intelligence_stage_data if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create intelligence_targets if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create source_registry for RSS and monitoring sources
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

-- 5. Create monitoring_results for storing collected signals
CREATE TABLE IF NOT EXISTS monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    source TEXT NOT NULL,
    signals JSONB,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 6. Create intelligence_findings table for storing analysis results
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    finding_type TEXT NOT NULL,
    severity TEXT,
    confidence DECIMAL(3,2),
    title TEXT,
    description TEXT,
    evidence JSONB,
    recommendations JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create opportunities table for opportunity engine
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    opportunity_type TEXT,
    score DECIMAL(5,2),
    urgency TEXT,
    impact TEXT,
    cascade_risk_score DECIMAL(3,2),
    narrative_vacuum_score DECIMAL(3,2),
    recommended_actions JSONB,
    metadata JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_created ON intelligence_stage_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_org ON monitoring_results(organization_name, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_industry ON source_registry(industry, active);
CREATE INDEX IF NOT EXISTS idx_findings_org ON intelligence_findings(organization_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_name, score DESC);

-- Enable Row Level Security
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create or update policies for anonymous access (for testing)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow anon access" ON organization_profiles;
    DROP POLICY IF EXISTS "Allow anon access" ON intelligence_stage_data;
    DROP POLICY IF EXISTS "Allow anon access" ON intelligence_targets;
    DROP POLICY IF EXISTS "Allow anon access" ON source_registry;
    DROP POLICY IF EXISTS "Allow anon access" ON monitoring_results;
    DROP POLICY IF EXISTS "Allow anon access" ON intelligence_findings;
    DROP POLICY IF EXISTS "Allow anon access" ON opportunities;
    
    -- Create new policies
    CREATE POLICY "Allow anon access" ON organization_profiles FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow anon access" ON intelligence_stage_data FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow anon access" ON intelligence_targets FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow anon access" ON source_registry FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow anon access" ON monitoring_results FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow anon access" ON intelligence_findings FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow anon access" ON opportunities FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Insert default RSS sources
INSERT INTO source_registry (name, url, type, industry, tags)
VALUES 
    ('TechCrunch', 'https://techcrunch.com/feed/', 'rss', 'technology', ARRAY['tech', 'startups', 'news']),
    ('VentureBeat', 'https://feeds.feedburner.com/venturebeat/SZYF', 'rss', 'technology', ARRAY['tech', 'ai', 'enterprise']),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss', 'technology', ARRAY['tech', 'consumer', 'gadgets']),
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss', 'technology', ARRAY['tech', 'science', 'policy']),
    ('Wired', 'https://www.wired.com/feed/rss', 'rss', 'technology', ARRAY['tech', 'culture', 'business']),
    ('MIT Tech Review', 'https://www.technologyreview.com/feed/', 'rss', 'technology', ARRAY['tech', 'research', 'innovation']),
    ('Business Wire Tech', 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtRWA==', 'rss', 'business', ARRAY['pr', 'announcements']),
    ('PR Newswire Tech', 'https://www.prnewswire.com/rss/technology-latest-news/technology-latest-news-list.rss', 'rss', 'technology', ARRAY['pr', 'news']),
    ('Reuters Tech', 'https://www.reutersagency.com/feed/?best-topics=tech&post_type=best', 'rss', 'news', ARRAY['tech', 'business', 'global']),
    ('Bloomberg Tech', 'https://feeds.bloomberg.com/technology/news.rss', 'rss', 'business', ARRAY['tech', 'finance', 'markets'])
ON CONFLICT DO NOTHING;

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
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

DROP TRIGGER IF EXISTS update_intelligence_findings_updated_at ON intelligence_findings;
CREATE TRIGGER update_intelligence_findings_updated_at
    BEFORE UPDATE ON intelligence_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the migration
SELECT 
    'Migration Complete' as status,
    COUNT(*) as tables_ready,
    string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'organization_profiles', 
    'intelligence_stage_data', 
    'intelligence_targets',
    'source_registry',
    'monitoring_results',
    'intelligence_findings',
    'opportunities'
);

-- Show organization_profiles structure after migration
SELECT 
    column_name,
    data_type,
    CASE WHEN column_name IN ('organization_name', 'profile_data') THEN '✅ NEW' ELSE '' END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
ORDER BY ordinal_position;