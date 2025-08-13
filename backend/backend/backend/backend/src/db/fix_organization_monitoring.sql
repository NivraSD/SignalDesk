-- Fix organization monitoring to support ANY organization dynamically
-- This schema works for any company: Nike, Tesla, McDonald's, startups, etc.

-- Ensure organizations table has proper structure for ANY organization
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS industry VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);

-- Ensure intelligence_targets table exists for dynamic competitor/topic tracking
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL, -- Can be UUID or string ID
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'competitor', 'topic', 'stakeholder'
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    keywords TEXT[],
    metadata JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, name, type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_org_id ON intelligence_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_type ON intelligence_targets(type);
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_active ON intelligence_targets(active);

-- Update source_indexes to support organization-specific configurations
ALTER TABLE source_indexes 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_source_indexes_org_id ON source_indexes(organization_id);
CREATE INDEX IF NOT EXISTS idx_source_indexes_entity_type ON source_indexes(entity_type);

-- Update intelligence_findings to properly link to organizations
ALTER TABLE intelligence_findings
ADD COLUMN IF NOT EXISTS actual_organization_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_intelligence_findings_actual_org ON intelligence_findings(actual_organization_id);

-- Create organization_sources table to map organizations to their configured sources
CREATE TABLE IF NOT EXISTS organization_sources (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'rss', 'google_news', 'website', 'api'
    source_url TEXT,
    source_query TEXT,
    source_config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organization_sources_org_id ON organization_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_sources_active ON organization_sources(active);

-- Add comments for clarity
COMMENT ON TABLE organizations IS 'Stores any organization entered by users - companies, startups, non-profits, etc.';
COMMENT ON TABLE intelligence_targets IS 'Stores competitors and topics for each organization dynamically';
COMMENT ON TABLE organization_sources IS 'Maps each organization to its specific monitoring sources';
COMMENT ON COLUMN intelligence_findings.actual_organization_id IS 'Links articles to the actual organization being monitored';