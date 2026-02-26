-- Intelligence Monitoring Tables
-- Run this to create the necessary tables for the intelligence monitoring system

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Intelligence targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('competitor', 'topic', 'person', 'keyword')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    keywords TEXT[], -- Array of keywords to monitor
    topics TEXT[], -- Array of topics
    sources TEXT[], -- Array of sources to monitor
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Intelligence findings table
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID REFERENCES intelligence_targets(id),
    organization_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    source VARCHAR(255),
    url TEXT,
    sentiment_score DECIMAL(3,2), -- -1 to 1
    relevance_score DECIMAL(3,2), -- 0 to 1
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Intelligence opportunities table
CREATE TABLE IF NOT EXISTS intelligence_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(50),
    nvs_score INTEGER, -- Narrative Vacuum Score
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high')),
    status VARCHAR(50) DEFAULT 'identified',
    recommended_actions JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Monitoring status table
CREATE TABLE IF NOT EXISTS monitoring_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL UNIQUE,
    monitoring BOOLEAN DEFAULT false,
    last_scan TIMESTAMP,
    health INTEGER DEFAULT 100,
    active_targets INTEGER DEFAULT 0,
    active_sources INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_targets_org ON intelligence_targets(organization_id);
CREATE INDEX idx_findings_org ON intelligence_findings(organization_id);
CREATE INDEX idx_findings_target ON intelligence_findings(target_id);
CREATE INDEX idx_opportunities_org ON intelligence_opportunities(organization_id);
CREATE INDEX idx_monitoring_status_org ON monitoring_status(organization_id);

-- Insert some sample data for testing
INSERT INTO monitoring_status (organization_id, monitoring, health, active_targets, active_sources)
VALUES ('org-default', true, 85, 3, 5)
ON CONFLICT (organization_id) DO NOTHING;

-- Sample intelligence targets
INSERT INTO intelligence_targets (organization_id, name, type, priority, keywords, topics)
VALUES 
    ('org-default', 'OpenAI', 'competitor', 'high', ARRAY['OpenAI', 'ChatGPT', 'GPT-4'], ARRAY['AI', 'LLM', 'artificial intelligence']),
    ('org-default', 'AI Regulation', 'topic', 'high', ARRAY['AI regulation', 'AI ethics', 'AI governance'], ARRAY['regulation', 'policy', 'compliance']),
    ('org-default', 'Customer Experience', 'topic', 'medium', ARRAY['CX', 'customer experience', 'user satisfaction'], ARRAY['product', 'feedback', 'support'])
ON CONFLICT DO NOTHING;