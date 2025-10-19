-- SignalDesk V2 MemoryVault Database Schema
-- Purpose: Persistent knowledge base for the four-pillar architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;

-- ========================================
-- CORE TABLES
-- ========================================

-- Organizations (from onboarding)
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

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- PR Objectives (from onboarding)
CREATE TABLE IF NOT EXISTS pr_objectives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    primary_objectives TEXT[],
    success_metrics TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunity Configuration (from onboarding)
CREATE TABLE IF NOT EXISTS opportunity_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    enabled_types JSONB NOT NULL,
    response_time TEXT,
    risk_tolerance TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intelligence Targets (from onboarding)
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('competitor', 'topic', 'journalist', 'keyword')),
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    keywords TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_targets_org_type (organization_id, type)
);

-- MCP Configuration (from onboarding)
CREATE TABLE IF NOT EXISTS mcp_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    active_mcps TEXT[],
    config JSONB NOT NULL,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- MEMORYVAULT CORE
-- ========================================

-- Main MemoryVault table (partitioned by month for scale)
CREATE TABLE IF NOT EXISTS memory_vault (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain TEXT NOT NULL, -- 'intelligence', 'opportunities', 'execution', 'patterns'
    type TEXT NOT NULL,   -- Specific type within domain
    data JSONB NOT NULL,
    embeddings vector(1536), -- For semantic search (optional)
    confidence_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_memory_org_domain (organization_id, domain),
    INDEX idx_memory_created (created_at DESC),
    INDEX idx_memory_type (type)
) PARTITION BY RANGE (created_at);

-- Create initial partitions (adjust dates as needed)
CREATE TABLE memory_vault_2025_01 PARTITION OF memory_vault
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE memory_vault_2025_02 PARTITION OF memory_vault
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- ========================================
-- INTELLIGENCE MODULE TABLES
-- ========================================

-- Intelligence findings from MCPs
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_mcp TEXT NOT NULL,
    finding_type TEXT NOT NULL,
    data JSONB NOT NULL,
    relevance_score FLOAT,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_findings_unprocessed (organization_id, processed)
);

-- MCP Sync Status
CREATE TABLE IF NOT EXISTS mcp_sync_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    mcp_name TEXT NOT NULL,
    last_sync TIMESTAMPTZ,
    sync_status TEXT CHECK (sync_status IN ('idle', 'syncing', 'error')),
    error_message TEXT,
    metadata JSONB,
    
    UNIQUE(organization_id, mcp_name)
);

-- ========================================
-- OPPORTUNITY MODULE TABLES
-- ========================================

-- Detected opportunities
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_opportunities_status (organization_id, status),
    INDEX idx_opportunities_scores (priority_score DESC)
);

-- Cascade predictions
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
-- EXECUTION MODULE TABLES
-- ========================================

-- Campaigns created from opportunities
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

-- Content templates and materials
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

-- Media relationships
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
-- PATTERN RECOGNITION TABLES
-- ========================================

-- Learned patterns across domains
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_patterns_type (organization_id, pattern_type),
    INDEX idx_patterns_success (success_rate DESC)
);

-- Pattern outcomes for learning
CREATE TABLE IF NOT EXISTS pattern_outcomes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id),
    outcome JSONB NOT NULL,
    success BOOLEAN,
    learnings TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- NIV ADVISOR TABLES
-- ========================================

-- Niv conversation history (strategic advice only)
CREATE TABLE IF NOT EXISTS niv_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Niv messages (no artifacts)
CREATE TABLE IF NOT EXISTS niv_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES niv_conversations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'niv')),
    message TEXT NOT NULL,
    context_used JSONB, -- What MemoryVault data was accessed
    module_suggested TEXT, -- Which module Niv suggested
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES AND PERFORMANCE
-- ========================================

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_memory_vault_search 
    ON memory_vault USING gin(data);

CREATE INDEX IF NOT EXISTS idx_opportunities_window 
    ON opportunities(organization_id, window_end) 
    WHERE status IN ('detected', 'reviewed');

CREATE INDEX IF NOT EXISTS idx_campaigns_active 
    ON campaigns(organization_id, status) 
    WHERE status NOT IN ('completed', 'cancelled');

-- ========================================
-- HELPER FUNCTIONS
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
    -- Priority = (CRS + NVS) / 2 * urgency_multiplier
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
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Organizations: Users can only see their own organization
CREATE POLICY org_isolation ON organizations
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM organization_users WHERE organization_id = id
    ));

-- Apply similar policies to all tables
CREATE POLICY memory_vault_isolation ON memory_vault
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
    ));

-- ========================================
-- TRIGGERS
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert default patterns for new organizations
CREATE OR REPLACE FUNCTION initialize_default_patterns()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert industry-specific default patterns
    INSERT INTO patterns (organization_id, pattern_type, pattern_name, pattern_data, confidence_score)
    VALUES 
        (NEW.id, 'timing', 'optimal_announcement', '{"day": "Tuesday", "time": "10am ET"}', 0.7),
        (NEW.id, 'response', 'crisis_template', '{"speed": "within 1 hour", "tone": "empathetic"}', 0.8),
        (NEW.id, 'media', 'journalist_preference', '{"format": "exclusive", "lead_time": "24 hours"}', 0.6);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initialize_org_patterns
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION initialize_default_patterns();

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'MemoryVault schema created successfully!';
    RAISE NOTICE 'Tables created: organizations, memory_vault, opportunities, campaigns, patterns, etc.';
    RAISE NOTICE 'Next step: Run onboarding to populate initial data';
END $$;