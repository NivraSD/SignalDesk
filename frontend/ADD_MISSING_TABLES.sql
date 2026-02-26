-- Add only the missing tables needed for monitoring
-- This is safe to run - uses IF NOT EXISTS

-- Intelligence Targets table (needed for monitoring)
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'company',
    description TEXT,
    keywords TEXT[],
    focus_areas TEXT[],
    active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring Runs table (needed for monitoring)
CREATE TABLE IF NOT EXISTS monitoring_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    findings_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Intelligence Findings table (if doesn't exist)
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,
    source VARCHAR(255),
    title TEXT,
    content TEXT,
    url TEXT,
    relevance_score INTEGER,
    sentiment VARCHAR(50),
    keywords TEXT[],
    findings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Target Sources table (for monitoring source configuration)
CREATE TABLE IF NOT EXISTS target_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'rss', 'api', 'web', etc.
    url TEXT,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on new tables
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_targets
DROP POLICY IF EXISTS "Users can view org targets" ON intelligence_targets;
CREATE POLICY "Users can view org targets" ON intelligence_targets
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage org targets" ON intelligence_targets;
CREATE POLICY "Users can manage org targets" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- RLS Policies for monitoring_runs
DROP POLICY IF EXISTS "Users can view org monitoring runs" ON monitoring_runs;
CREATE POLICY "Users can view org monitoring runs" ON monitoring_runs
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage org monitoring runs" ON monitoring_runs;
CREATE POLICY "Users can manage org monitoring runs" ON monitoring_runs
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- RLS Policies for intelligence_findings
DROP POLICY IF EXISTS "Users can view org intelligence" ON intelligence_findings;
CREATE POLICY "Users can view org intelligence" ON intelligence_findings
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- RLS Policies for target_sources
DROP POLICY IF EXISTS "Users can view org sources" ON target_sources;
CREATE POLICY "Users can view org sources" ON target_sources
    FOR SELECT USING (
        target_id IN (
            SELECT id FROM intelligence_targets 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_active ON intelligence_targets(active);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_status ON monitoring_runs(status);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_org ON intelligence_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_target ON intelligence_findings(target_id);
CREATE INDEX IF NOT EXISTS idx_target_sources_target ON target_sources(target_id);

-- Add demo organization if it doesn't exist
INSERT INTO organizations (id, name, industry)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'SignalDesk Demo Organization',
    'Technology'
) ON CONFLICT (id) DO NOTHING;