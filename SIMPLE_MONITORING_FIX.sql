-- Simple monitoring fix - create tables in correct order
-- This will work with existing tables

-- Step 1: Create intelligence_targets table first
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

-- Step 2: Create monitoring_runs table
CREATE TABLE IF NOT EXISTS monitoring_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    findings_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Step 3: Add missing columns to intelligence_findings (if table exists)
-- Add target_id column if it doesn't exist
DO $$
BEGIN
    -- Check if intelligence_findings exists and add target_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_findings') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intelligence_findings' AND column_name='target_id') THEN
            ALTER TABLE intelligence_findings ADD COLUMN target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intelligence_findings' AND column_name='keywords') THEN
            ALTER TABLE intelligence_findings ADD COLUMN keywords TEXT[];
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intelligence_findings' AND column_name='findings') THEN
            ALTER TABLE intelligence_findings ADD COLUMN findings JSONB DEFAULT '{}';
        END IF;
    END IF;
END$$;

-- Step 4: Create target_sources table
CREATE TABLE IF NOT EXISTS target_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    url TEXT,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Enable RLS and create policies
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_sources ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can manage org targets" ON intelligence_targets;
CREATE POLICY "Users can manage org targets" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage org monitoring runs" ON monitoring_runs;
CREATE POLICY "Users can manage org monitoring runs" ON monitoring_runs
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can manage org sources" ON target_sources;
CREATE POLICY "Users can manage org sources" ON target_sources
    FOR ALL USING (
        target_id IN (
            SELECT id FROM intelligence_targets 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_active ON intelligence_targets(active);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_target ON monitoring_runs(target_id);

-- Step 7: Add demo organization
INSERT INTO organizations (id, name, industry)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'SignalDesk Demo Organization',
    'Technology'
) ON CONFLICT (id) DO NOTHING;