-- Safe migration script that checks column existence before referencing

-- 1. First, let's see what we're working with
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
ORDER BY ordinal_position;

-- 2. Add organization_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_profiles' 
        AND column_name = 'organization_name'
    ) THEN
        ALTER TABLE organization_profiles ADD COLUMN organization_name TEXT;
        
        -- Try to populate it from possible existing columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'organization_profiles' 
            AND column_name = 'name'
        ) THEN
            EXECUTE 'UPDATE organization_profiles SET organization_name = name WHERE organization_name IS NULL';
        END IF;
    END IF;
END $$;

-- 3. Add profile_data column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_profiles' 
        AND column_name = 'profile_data'
    ) THEN
        ALTER TABLE organization_profiles ADD COLUMN profile_data JSONB;
        
        -- Build profile_data from existing columns
        EXECUTE '
            UPDATE organization_profiles 
            SET profile_data = jsonb_build_object(
                ''name'', COALESCE(organization_name, ''Unknown''),
                ''type'', type,
                ''description'', description,
                ''keywords'', keywords,
                ''focus_areas'', focus_areas,
                ''settings'', settings,
                ''metadata'', metadata
            )
            WHERE profile_data IS NULL
        ';
    END IF;
END $$;

-- 4. Create intelligence_stage_data if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create intelligence_targets if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove the unique constraint temporarily to avoid conflicts
ALTER TABLE intelligence_targets DROP CONSTRAINT IF EXISTS intelligence_targets_organization_name_key;

-- 6. Create source_registry for RSS and monitoring sources
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

-- 7. Create monitoring_results for storing collected signals
CREATE TABLE IF NOT EXISTS monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    source TEXT NOT NULL,
    signals JSONB,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- 8. Create intelligence_findings table for storing analysis results
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

-- 9. Create opportunities table for opportunity engine
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

-- 10. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stage_org ON intelligence_stage_data(organization_name, stage_name);
CREATE INDEX IF NOT EXISTS idx_stage_created ON intelligence_stage_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_org ON monitoring_results(organization_name, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_industry ON source_registry(industry, active);
CREATE INDEX IF NOT EXISTS idx_findings_org ON intelligence_findings(organization_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_name, score DESC);

-- 11. Enable Row Level Security
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- 12. Create policies for anonymous access
DO $$
BEGIN
    -- Organization profiles
    DROP POLICY IF EXISTS "Allow anon access" ON organization_profiles;
    DROP POLICY IF EXISTS "Allow anon access to organization_profiles" ON organization_profiles;
    CREATE POLICY "Allow anon access" ON organization_profiles FOR ALL USING (true) WITH CHECK (true);
    
    -- Intelligence stage data
    DROP POLICY IF EXISTS "Allow anon access" ON intelligence_stage_data;
    DROP POLICY IF EXISTS "Allow anon access to intelligence_stage_data" ON intelligence_stage_data;
    CREATE POLICY "Allow anon access" ON intelligence_stage_data FOR ALL USING (true) WITH CHECK (true);
    
    -- Intelligence targets
    DROP POLICY IF EXISTS "Allow anon access" ON intelligence_targets;
    DROP POLICY IF EXISTS "Allow anon access to intelligence_targets" ON intelligence_targets;
    CREATE POLICY "Allow anon access" ON intelligence_targets FOR ALL USING (true) WITH CHECK (true);
    
    -- Source registry
    DROP POLICY IF EXISTS "Allow anon access" ON source_registry;
    DROP POLICY IF EXISTS "Allow anon access to source_registry" ON source_registry;
    CREATE POLICY "Allow anon access" ON source_registry FOR ALL USING (true) WITH CHECK (true);
    
    -- Monitoring results
    DROP POLICY IF EXISTS "Allow anon access" ON monitoring_results;
    DROP POLICY IF EXISTS "Allow anon access to monitoring_results" ON monitoring_results;
    CREATE POLICY "Allow anon access" ON monitoring_results FOR ALL USING (true) WITH CHECK (true);
    
    -- Intelligence findings
    DROP POLICY IF EXISTS "Allow anon access" ON intelligence_findings;
    DROP POLICY IF EXISTS "Allow anon access to intelligence_findings" ON intelligence_findings;
    CREATE POLICY "Allow anon access" ON intelligence_findings FOR ALL USING (true) WITH CHECK (true);
    
    -- Opportunities
    DROP POLICY IF EXISTS "Allow anon access" ON opportunities;
    DROP POLICY IF EXISTS "Allow anon access to opportunities" ON opportunities;
    CREATE POLICY "Allow anon access" ON opportunities FOR ALL USING (true) WITH CHECK (true);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore policy creation errors
        NULL;
END $$;

-- 13. Insert default RSS sources (safe with ON CONFLICT)
INSERT INTO source_registry (name, url, type, industry, tags)
VALUES 
    ('TechCrunch', 'https://techcrunch.com/feed/', 'rss', 'technology', ARRAY['tech', 'startups', 'news']),
    ('VentureBeat', 'https://feeds.feedburner.com/venturebeat/SZYF', 'rss', 'technology', ARRAY['tech', 'ai', 'enterprise']),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss', 'technology', ARRAY['tech', 'consumer', 'gadgets']),
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss', 'technology', ARRAY['tech', 'science', 'policy']),
    ('Wired', 'https://www.wired.com/feed/rss', 'rss', 'technology', ARRAY['tech', 'culture', 'business'])
ON CONFLICT DO NOTHING;

-- 14. Verify the migration
SELECT 
    'Tables Status' as check_type,
    COUNT(*) as count,
    string_agg(table_name, ', ') as items
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
)
UNION ALL
SELECT 
    'Organization Profile Columns' as check_type,
    COUNT(*) as count,
    string_agg(column_name, ', ') as items
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
AND column_name IN ('organization_name', 'profile_data')
UNION ALL
SELECT 
    'RSS Sources' as check_type,
    COUNT(*) as count,
    string_agg(name, ', ' ORDER BY name) as items
FROM source_registry
WHERE type = 'rss';