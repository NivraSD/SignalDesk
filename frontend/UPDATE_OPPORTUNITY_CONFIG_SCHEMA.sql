-- Update opportunity_config table to support MCP-aligned configuration
-- This aligns with the signaldesk-opportunities MCP requirements

-- Add new columns if they don't exist
ALTER TABLE opportunity_config 
ADD COLUMN IF NOT EXISTS opportunity_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cascade_monitoring BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cascade_types TEXT[] DEFAULT ARRAY['regulatory_change', 'competitor_crisis', 'technology_breakthrough'],
ADD COLUMN IF NOT EXISTS response_time VARCHAR(50) DEFAULT '< 4 hours',
ADD COLUMN IF NOT EXISTS minimum_score INTEGER DEFAULT 70;

-- Add columns to organizations table for scoring configuration
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS opportunity_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cascade_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS journalist_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS scoring_config JSONB DEFAULT '{}';

-- Create opportunity scoring configuration table
CREATE TABLE IF NOT EXISTS opportunity_scoring (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    opportunity_type VARCHAR(50) NOT NULL,
    base_weight INTEGER DEFAULT 50,
    industry_modifier DECIMAL(3,2) DEFAULT 1.0,
    market_position_modifier DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, opportunity_type)
);

-- Create cascade monitoring configuration table
CREATE TABLE IF NOT EXISTS cascade_monitoring_config (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id),
    event_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    first_order_threshold DECIMAL(3,2) DEFAULT 0.7,
    second_order_threshold DECIMAL(3,2) DEFAULT 0.5,
    third_order_threshold DECIMAL(3,2) DEFAULT 0.3,
    notification_preference VARCHAR(50) DEFAULT 'realtime',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, event_type)
);

-- Insert default opportunity types and scoring
INSERT INTO opportunity_scoring (organization_id, opportunity_type, base_weight)
SELECT o.id, opp_type.type, opp_type.default_weight
FROM organizations o
CROSS JOIN (
    VALUES 
    ('trending', 70),
    ('news_hook', 80),
    ('competitor_gap', 75),
    ('journalist_interest', 65),
    ('editorial_calendar', 60),
    ('award', 55),
    ('speaking', 60)
) AS opp_type(type, default_weight)
ON CONFLICT (organization_id, opportunity_type) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_opportunity_scoring_org_type 
ON opportunity_scoring(organization_id, opportunity_type);

CREATE INDEX IF NOT EXISTS idx_cascade_monitoring_org_event 
ON cascade_monitoring_config(organization_id, event_type);

CREATE INDEX IF NOT EXISTS idx_opportunity_config_weights 
ON opportunity_config USING GIN(opportunity_weights);

-- Add comment documentation
COMMENT ON TABLE opportunity_scoring IS 'Stores organization-specific scoring weights for each opportunity type';
COMMENT ON TABLE cascade_monitoring_config IS 'Configuration for cascade intelligence monitoring per organization';
COMMENT ON COLUMN opportunity_config.opportunity_weights IS 'JSON object mapping opportunity types to their importance scores (0-100)';
COMMENT ON COLUMN opportunity_config.cascade_monitoring IS 'Whether cascade effect monitoring is enabled';
COMMENT ON COLUMN opportunity_config.cascade_types IS 'Array of cascade event types to monitor';
COMMENT ON COLUMN opportunity_config.minimum_score IS 'Minimum opportunity score threshold (0-100) for alerts';