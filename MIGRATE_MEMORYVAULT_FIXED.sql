-- SignalDesk V2 MemoryVault Migration Script (Fixed Version)
-- Handles the INTEGER id issue in opportunities table

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
    enabled_types JSONB NOT NULL DEFAULT '["trend", "news", "competitor", "niv", "event"]',
    crs_threshold INTEGER DEFAULT 60,
    nvs_threshold INTEGER DEFAULT 50,
    auto_queue BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP Configuration table
CREATE TABLE IF NOT EXISTS mcp_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enabled_mcps TEXT[] DEFAULT ARRAY['analyst', 'competitor', 'journalist', 'news', 'socials', 'trends'],
    sync_interval_minutes INTEGER DEFAULT 30,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP Sync Status table
CREATE TABLE IF NOT EXISTS mcp_sync_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    mcp_name TEXT NOT NULL,
    last_sync TIMESTAMPTZ,
    status TEXT,
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CREATE MEMORY VAULT TABLE
-- ========================================

-- Core MemoryVault table
CREATE TABLE IF NOT EXISTS memory_vault (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value JSONB NOT NULL,
    confidence_score FLOAT,
    source TEXT,
    source_timestamp TIMESTAMPTZ,
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, memory_type, memory_key)
);

-- Create indexes for memory_vault
CREATE INDEX IF NOT EXISTS idx_memory_vault_org_type ON memory_vault(organization_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_vault_key ON memory_vault(memory_key);
CREATE INDEX IF NOT EXISTS idx_memory_vault_access ON memory_vault(last_accessed DESC);

-- ========================================
-- CREATE OPPORTUNITY QUEUE TABLE
-- ========================================

-- Create opportunity_queue for real-time processing
CREATE TABLE IF NOT EXISTS opportunity_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    opportunity_type TEXT NOT NULL,
    opportunity_data JSONB NOT NULL,
    crs_score INTEGER,
    nvs_score INTEGER,
    priority_score INTEGER,
    status TEXT DEFAULT 'pending',
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    campaign_id UUID REFERENCES campaigns(id),
    outcome JSONB
);

-- Create indexes for opportunity_queue
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_status ON opportunity_queue(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id, queued_at DESC);

-- ========================================
-- UPDATE OPPORTUNITIES TABLE
-- ========================================

-- The opportunities table already exists with INTEGER id, just add missing columns
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

DO $$ 
BEGIN
    -- IMPORTANT: Use INTEGER for opportunity_id to match opportunities table's INTEGER id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'campaigns' AND column_name = 'opportunity_id') THEN
        ALTER TABLE campaigns ADD COLUMN opportunity_id INTEGER REFERENCES opportunities(id);
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

-- Update niv_messages to add metadata
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'niv_messages' AND column_name = 'metadata') THEN
        ALTER TABLE niv_messages ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- ========================================
-- CREATE LEARNING TABLES
-- ========================================

-- Create learning_outcomes table
CREATE TABLE IF NOT EXISTS learning_outcomes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    outcome_type TEXT NOT NULL,
    outcome_data JSONB NOT NULL,
    success_metrics JSONB,
    lessons_learned TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create strategic_insights table
CREATE TABLE IF NOT EXISTS strategic_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    confidence_score FLOAT,
    derived_from TEXT[],
    impact_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CREATE MONITORING TABLES
-- ========================================

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    component TEXT NOT NULL,
    status TEXT NOT NULL,
    metrics JSONB,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processing metrics
CREATE TABLE IF NOT EXISTS processing_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Organization-based queries
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id);

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);

-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant permissions on all tables to the application user
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE %I TO postgres', t);
    END LOOP;
END $$;

-- ========================================
-- FINAL STATUS MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MemoryVault Migration Complete (Fixed Version)';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Changes:';
    RAISE NOTICE '- Fixed campaigns.opportunity_id to use INTEGER (matching opportunities.id)';
    RAISE NOTICE '- Added MemoryVault core tables';
    RAISE NOTICE '- Added pattern recognition tables';
    RAISE NOTICE '- Added opportunity queue for real-time processing';
    RAISE NOTICE '- Enhanced existing tables with V2 columns';
    RAISE NOTICE '';
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '- memory_vault (core knowledge store)';
    RAISE NOTICE '- opportunity_queue (real-time processing)';
    RAISE NOTICE '- pr_objectives (configuration)';
    RAISE NOTICE '- opportunity_config (configuration)';
    RAISE NOTICE '- mcp_config & mcp_sync_status (MCP management)';
    RAISE NOTICE '- patterns & pattern_outcomes (learning)';
    RAISE NOTICE '- media_relationships (journalist tracking)';
    RAISE NOTICE '- learning_outcomes & strategic_insights';
    RAISE NOTICE '- system_health & processing_metrics';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced Tables:';
    RAISE NOTICE '- organizations (market data)';
    RAISE NOTICE '- opportunities (scoring & windows)';
    RAISE NOTICE '- campaigns (materials & metrics)';
    RAISE NOTICE '- niv tables (organization links)';
END $$;