-- Fix monitoring tables - add missing columns and tables
-- Run this to make monitoring work

-- First, let's see what tables exist and add missing columns
DO $$
BEGIN
    -- Add target_id to intelligence_findings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='intelligence_findings' AND column_name='target_id'
    ) THEN
        ALTER TABLE intelligence_findings 
        ADD COLUMN target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL;
    END IF;
    
    -- Add keywords column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='intelligence_findings' AND column_name='keywords'
    ) THEN
        ALTER TABLE intelligence_findings 
        ADD COLUMN keywords TEXT[];
    END IF;
    
    -- Add findings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='intelligence_findings' AND column_name='findings'
    ) THEN
        ALTER TABLE intelligence_findings 
        ADD COLUMN findings JSONB DEFAULT '{}';
    END IF;
END$$;

-- Create intelligence_targets table if it doesn't exist
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

-- Create monitoring_runs table if it doesn't exist
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

-- Create target_sources table if it doesn't exist  
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

-- Enable RLS on new tables (ignore if already enabled)
DO $$
BEGIN
    ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
    ALTER TABLE monitoring_runs ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
    ALTER TABLE target_sources ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

-- Create policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view org targets" ON intelligence_targets;
CREATE POLICY "Users can view org targets" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view org monitoring runs" ON monitoring_runs;
CREATE POLICY "Users can view org monitoring runs" ON monitoring_runs
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view org sources" ON target_sources;
CREATE POLICY "Users can view org sources" ON target_sources
    FOR ALL USING (
        target_id IN (
            SELECT id FROM intelligence_targets 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Create indexes (ignore if already exist)
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_active ON intelligence_targets(active);
CREATE INDEX IF NOT EXISTS idx_monitoring_runs_org ON monitoring_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_findings_target ON intelligence_findings(target_id);

-- Insert demo organization (ignore if exists)
INSERT INTO organizations (id, name, industry)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'SignalDesk Demo Organization',
    'Technology'
) ON CONFLICT (id) DO NOTHING;