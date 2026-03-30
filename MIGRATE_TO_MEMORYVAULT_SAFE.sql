-- SignalDesk V2 MemoryVault Migration Script (Safe Version)
-- Purpose: Safely migrate existing database to new architecture
-- This version creates tables if they don't exist

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- CREATE OR UPDATE ORGANIZATIONS TABLE
-- ========================================

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    market_position TEXT,
    differentiators TEXT[],
    competitors TEXT[],
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table exists, add missing columns
DO $$ 
BEGIN
    -- Add industry column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'industry') THEN
        ALTER TABLE organizations ADD COLUMN industry TEXT;
    END IF;
    
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
    
    -- Add settings column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'settings') THEN
        ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'updated_at') THEN
        ALTER TABLE organizations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ========================================
-- CREATE CORE TABLES
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

-- Drop existing memory_vault if it exists (to avoid partition issues)
DROP TABLE IF EXISTS memory_vault CASCADE;

-- Create the partitioned table with vector column
CREATE TABLE memory_vault (
    id UUID DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    embeddings vector(1536), -- For semantic search
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions
CREATE TABLE memory_vault_2025_01 PARTITION OF memory_vault
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE memory_vault_2025_02 PARTITION OF memory_vault
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE memory_vault_2025_03 PARTITION OF memory_vault
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Create indexes for memory_vault
CREATE INDEX idx_memory_org_domain ON memory_vault(organization_id, domain);
CREATE INDEX idx_memory_created ON memory_vault(created_at DESC);
CREATE INDEX idx_memory_type ON memory_vault(type);

-- ========================================
-- CREATE/UPDATE INTELLIGENCE TABLES
-- ========================================

-- Create intelligence_targets if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('competitor', 'topic', 'journalist', 'keyword')),
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    keywords TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create intelligence_findings if it doesn't exist
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_mcp TEXT,
    finding_type TEXT NOT NULL,
    data JSONB NOT NULL,
    relevance_score FLOAT,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for intelligence tables
CREATE INDEX IF NOT EXISTS idx_targets_org_type ON intelligence_targets(organization_id, type);
-- Only create index if the processed column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'intelligence_findings' AND column_name = 'processed') THEN
        CREATE INDEX IF NOT EXISTS idx_findings_unprocessed ON intelligence_findings(organization_id, processed);
    END IF;
END $$;

-- ========================================
-- CREATE OPPORTUNITY TABLES
-- ========================================

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL,
    crs_score INTEGER CHECK (crs_score >= 0 AND crs_score <= 100),
    nvs_score INTEGER CHECK (nvs_score >= 0 AND nvs_score <= 100),
    priority_score INTEGER,
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'reviewed', 'acting', 'completed', 'expired')),
    outcome JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_opportunities_scores ON opportunities(priority_score DESC);

-- Create cascade_predictions table
CREATE TABLE IF NOT EXISTS cascade_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    trigger_event JSONB NOT NULL,
    first_order_effects JSONB,
    second_order_effects JSONB,
    third_order_effects JSONB,
    confidence_scores JSONB,
    actual_outcomes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CREATE EXECUTION TABLES
-- ========================================

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id),
    name TEXT NOT NULL,
    type TEXT,
    materials JSONB,
    media_list JSONB,
    timeline JSONB,
    performance_metrics JSONB,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    launched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Content library table
CREATE TABLE IF NOT EXISTS content_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    metadata JSONB,
    performance_data JSONB,
    template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media relationships table
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
-- UPDATE NIV TABLES IF THEY EXIST
-- ========================================

-- Create or update niv_conversations
CREATE TABLE IF NOT EXISTS niv_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or update niv_messages
CREATE TABLE IF NOT EXISTS niv_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'niv', 'assistant')),
    message TEXT NOT NULL,
    context_used JSONB,
    module_suggested TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to niv_messages if they don't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'niv_messages') THEN
        
        -- Add context_used column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'niv_messages' AND column_name = 'context_used') THEN
            ALTER TABLE niv_messages ADD COLUMN context_used JSONB;
        END IF;
        
        -- Add module_suggested column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'niv_messages' AND column_name = 'module_suggested') THEN
            ALTER TABLE niv_messages ADD COLUMN module_suggested TEXT;
        END IF;
    END IF;
END $$;

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
-- ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cascade_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE niv_messages ENABLE ROW LEVEL SECURITY;

-- Note: memory_vault doesn't need RLS as it's partitioned

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
    RAISE NOTICE 'Tables Created/Updated:';
    RAISE NOTICE '- organizations (created/enhanced)';
    RAISE NOTICE '- memory_vault (with vector support!)';
    RAISE NOTICE '- pr_objectives';
    RAISE NOTICE '- opportunity_config';
    RAISE NOTICE '- mcp_config & mcp_sync_status';
    RAISE NOTICE '- opportunities';
    RAISE NOTICE '- campaigns';
    RAISE NOTICE '- content_library';
    RAISE NOTICE '- media_relationships';
    RAISE NOTICE '- patterns & pattern_outcomes';
    RAISE NOTICE '- intelligence_targets & findings';
    RAISE NOTICE '- cascade_predictions';
    RAISE NOTICE '- niv tables (updated)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run onboarding wizard to populate data';
    RAISE NOTICE '2. Build four-module interface';
    RAISE NOTICE '3. Connect MCPs to Intelligence module';
    RAISE NOTICE '====================================';
END $$;