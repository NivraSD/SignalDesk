-- SignalDesk V2 MemoryVault Migration Script (Final Version)
-- Works with existing schema

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- UPDATE EXISTING ORGANIZATIONS TABLE
-- ========================================

-- Add missing columns to organizations
DO $$ 
BEGIN
    -- Add market_position column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'market_position') THEN
        ALTER TABLE organizations ADD COLUMN market_position TEXT;
    END IF;
    
    -- Add differentiators column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'differentiators') THEN
        ALTER TABLE organizations ADD COLUMN differentiators TEXT[];
    END IF;
    
    -- Add competitors column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'competitors') THEN
        ALTER TABLE organizations ADD COLUMN competitors TEXT[];
    END IF;
END $$;

-- ========================================
-- CREATE NEW CONFIGURATION TABLES
-- ========================================

-- PR Objectives table
CREATE TABLE IF NOT EXISTS pr_objectives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    primary_objectives TEXT[],
    success_metrics TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity Configuration table
CREATE TABLE IF NOT EXISTS opportunity_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enabled_types JSONB NOT NULL,
    response_time TEXT,
    risk_tolerance TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP Configuration table
CREATE TABLE IF NOT EXISTS mcp_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    active_mcps TEXT[],
    config JSONB NOT NULL,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP Sync Status table
CREATE TABLE IF NOT EXISTS mcp_sync_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    mcp_name TEXT NOT NULL,
    last_sync TIMESTAMPTZ,
    sync_status TEXT CHECK (sync_status IN ('idle', 'syncing', 'error')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, mcp_name)
);

-- ========================================
-- CREATE MEMORY_VAULT TABLE
-- ========================================

-- Create memory_vault as a regular table (not partitioned for simplicity)
CREATE TABLE IF NOT EXISTS memory_vault (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    embeddings vector(1536), -- For semantic search
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for memory_vault
CREATE INDEX IF NOT EXISTS idx_memory_org_domain ON memory_vault(organization_id, domain);
CREATE INDEX IF NOT EXISTS idx_memory_created ON memory_vault(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_vault(type);

-- ========================================
-- UPDATE EXISTING INTELLIGENCE TABLES
-- ========================================

-- Update intelligence_targets if needed
DO $$ 
BEGIN
    -- Add priority column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'intelligence_targets' AND column_name = 'priority') THEN
        ALTER TABLE intelligence_targets ADD COLUMN priority TEXT DEFAULT 'medium';
        ALTER TABLE intelligence_targets ADD CONSTRAINT check_priority 
            CHECK (priority IN ('high', 'medium', 'low'));
    END IF;
END $$;

-- Update intelligence_findings if needed
DO $$ 
BEGIN
    -- Add source_mcp column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'intelligence_findings' AND column_name = 'source_mcp') THEN
        ALTER TABLE intelligence_findings ADD COLUMN source_mcp TEXT;
    END IF;
    
    -- Add processed column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'intelligence_findings' AND column_name = 'processed') THEN
        ALTER TABLE intelligence_findings ADD COLUMN processed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ========================================
-- UPDATE OPPORTUNITIES TABLE
-- ========================================

-- The opportunities table already exists, just add missing columns
DO $$ 
BEGIN
    -- Add organization_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'organization_id') THEN
        ALTER TABLE opportunities ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
    
    -- Add CRS score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'crs_score') THEN
        ALTER TABLE opportunities ADD COLUMN crs_score INTEGER CHECK (crs_score >= 0 AND crs_score <= 100);
    END IF;
    
    -- Add NVS score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'nvs_score') THEN
        ALTER TABLE opportunities ADD COLUMN nvs_score INTEGER CHECK (nvs_score >= 0 AND nvs_score <= 100);
    END IF;
    
    -- Add priority_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'priority_score') THEN
        ALTER TABLE opportunities ADD COLUMN priority_score INTEGER;
    END IF;
    
    -- Add window columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'window_start') THEN
        ALTER TABLE opportunities ADD COLUMN window_start TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'window_end') THEN
        ALTER TABLE opportunities ADD COLUMN window_end TIMESTAMPTZ;
    END IF;
    
    -- Add outcome if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'opportunities' AND column_name = 'outcome') THEN
        ALTER TABLE opportunities ADD COLUMN outcome JSONB;
    END IF;
END $$;

-- ========================================
-- UPDATE CAMPAIGNS TABLE
-- ========================================

-- The campaigns table exists but needs additional columns
DO $$ 
BEGIN
    -- Add opportunity_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'opportunity_id') THEN
        ALTER TABLE campaigns ADD COLUMN opportunity_id UUID REFERENCES opportunities(id);
    END IF;
    
    -- Add materials if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'materials') THEN
        ALTER TABLE campaigns ADD COLUMN materials JSONB;
    END IF;
    
    -- Add media_list if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'media_list') THEN
        ALTER TABLE campaigns ADD COLUMN media_list JSONB;
    END IF;
    
    -- Add timeline if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'timeline') THEN
        ALTER TABLE campaigns ADD COLUMN timeline JSONB;
    END IF;
    
    -- Add performance_metrics if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'performance_metrics') THEN
        ALTER TABLE campaigns ADD COLUMN performance_metrics JSONB;
    END IF;
    
    -- Add launched_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'launched_at') THEN
        ALTER TABLE campaigns ADD COLUMN launched_at TIMESTAMPTZ;
    END IF;
    
    -- Add completed_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'completed_at') THEN
        ALTER TABLE campaigns ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- ========================================
-- CREATE PATTERN TABLES
-- ========================================

-- Patterns table
CREATE TABLE IF NOT EXISTS patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL,
    pattern_name TEXT,
    pattern_data JSONB NOT NULL,
    confidence_score FLOAT,
    success_rate FLOAT,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern outcomes table
CREATE TABLE IF NOT EXISTS pattern_outcomes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    outcome JSONB NOT NULL,
    success BOOLEAN,
    learnings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for patterns
CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(organization_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_success ON patterns(success_rate DESC);

-- ========================================
-- CREATE MEDIA RELATIONSHIPS TABLE
-- ========================================

-- Create media_relationships table (different from existing journalists table)
CREATE TABLE IF NOT EXISTS media_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    journalist_name TEXT NOT NULL,
    outlet TEXT,
    beat TEXT,
    email TEXT,
    relationship_score INTEGER,
    interaction_history JSONB,
    preferences JSONB,
    last_contact TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- UPDATE NIV TABLES
-- ========================================

-- Update niv_conversations to add organization_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'niv_conversations' AND column_name = 'organization_id') THEN
        ALTER TABLE niv_conversations ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- Create niv_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS niv_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'niv', 'assistant')),
    message TEXT NOT NULL,
    context_used JSONB,
    module_suggested TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CREATE HELPER FUNCTIONS
-- ========================================

-- Function to get organization context
CREATE OR REPLACE FUNCTION get_organization_context(org_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'profile', (SELECT row_to_json(o.*) FROM organizations o WHERE o.id = org_id),
        'objectives', (SELECT jsonb_agg(row_to_json(obj.*)) FROM pr_objectives obj WHERE obj.organization_id = org_id AND obj.active = true),
        'active_mcps', (SELECT active_mcps FROM mcp_config WHERE organization_id = org_id),
        'recent_patterns', (SELECT jsonb_agg(row_to_json(p.*)) FROM patterns p WHERE p.organization_id = org_id ORDER BY last_used DESC LIMIT 5)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate opportunity priority
CREATE OR REPLACE FUNCTION calculate_opportunity_priority(
    crs INTEGER,
    nvs INTEGER,
    window_hours INTEGER
) RETURNS INTEGER AS $$
BEGIN
    RETURN GREATEST(
        0,
        LEAST(
            100,
            ((crs + nvs) / 2) * 
            CASE 
                WHEN window_hours <= 24 THEN 1.5
                WHEN window_hours <= 48 THEN 1.2
                WHEN window_hours <= 168 THEN 1.0
                ELSE 0.8
            END
        )
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ========================================

ALTER TABLE pr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_relationships ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREATE TRIGGERS
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to organizations if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
        CREATE TRIGGER update_organizations_updated_at
            BEFORE UPDATE ON organizations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- MIGRATION SUMMARY
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'MemoryVault Migration Complete!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Tables Updated/Created:';
    RAISE NOTICE '- organizations (enhanced with new columns)';
    RAISE NOTICE '- memory_vault (new with vector support!)';
    RAISE NOTICE '- pr_objectives (new)';
    RAISE NOTICE '- opportunity_config (new)';
    RAISE NOTICE '- mcp_config & mcp_sync_status (new)';
    RAISE NOTICE '- opportunities (enhanced)';
    RAISE NOTICE '- campaigns (enhanced)';
    RAISE NOTICE '- patterns & pattern_outcomes (new)';
    RAISE NOTICE '- media_relationships (new)';
    RAISE NOTICE '- intelligence tables (enhanced)';
    RAISE NOTICE '- niv_messages (new)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run onboarding wizard to populate data';
    RAISE NOTICE '2. Build four-module interface';
    RAISE NOTICE '3. Connect MCPs to Intelligence module';
    RAISE NOTICE '====================================';
END $$;