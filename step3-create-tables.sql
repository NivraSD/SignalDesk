-- STEP 3: Create all other required tables
-- Run this after steps 1 and 2

-- Create intelligence_stage_data
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create intelligence_targets
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create source_registry for RSS and monitoring sources
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

-- Create monitoring_results
CREATE TABLE IF NOT EXISTS monitoring_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    source TEXT NOT NULL,
    signals JSONB,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create intelligence_findings
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

-- Create opportunities table
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

-- Create indexes
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

-- Create policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Allow anon access" ON organization_profiles;
DROP POLICY IF EXISTS "Allow anon access" ON intelligence_stage_data;
DROP POLICY IF EXISTS "Allow anon access" ON intelligence_targets;
DROP POLICY IF EXISTS "Allow anon access" ON source_registry;
DROP POLICY IF EXISTS "Allow anon access" ON monitoring_results;
DROP POLICY IF EXISTS "Allow anon access" ON intelligence_findings;
DROP POLICY IF EXISTS "Allow anon access" ON opportunities;

CREATE POLICY "Allow anon access" ON organization_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON intelligence_stage_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON intelligence_targets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON source_registry FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON monitoring_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON intelligence_findings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access" ON opportunities FOR ALL USING (true) WITH CHECK (true);

-- Insert RSS sources
INSERT INTO source_registry (name, url, type, industry, tags)
VALUES 
    ('TechCrunch', 'https://techcrunch.com/feed/', 'rss', 'technology', ARRAY['tech', 'startups', 'news']),
    ('VentureBeat', 'https://feeds.feedburner.com/venturebeat/SZYF', 'rss', 'technology', ARRAY['tech', 'ai', 'enterprise']),
    ('The Verge', 'https://www.theverge.com/rss/index.xml', 'rss', 'technology', ARRAY['tech', 'consumer', 'gadgets']),
    ('Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss', 'technology', ARRAY['tech', 'science', 'policy']),
    ('Wired', 'https://www.wired.com/feed/rss', 'rss', 'technology', ARRAY['tech', 'culture', 'business']),
    ('MIT Tech Review', 'https://www.technologyreview.com/feed/', 'rss', 'technology', ARRAY['tech', 'research', 'innovation']),
    ('Business Wire', 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtRWA==', 'rss', 'business', ARRAY['pr', 'announcements']),
    ('PR Newswire', 'https://www.prnewswire.com/rss/technology-latest-news/technology-latest-news-list.rss', 'rss', 'technology', ARRAY['pr', 'news'])
ON CONFLICT DO NOTHING;

-- Final verification
SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('organization_profiles', 'intelligence_stage_data', 'intelligence_targets', 
                        'source_registry', 'monitoring_results', 'intelligence_findings', 'opportunities')
    ) as tables_created,
    (SELECT COUNT(*) FROM source_registry WHERE type = 'rss') as rss_sources;