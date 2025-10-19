-- Create missing tables for SignalDesk MCP servers
-- This fixes the database schema mismatch issues

-- MemoryVault table for signaldesk-memory MCP server
CREATE TABLE IF NOT EXISTS memoryvault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE memoryvault_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy for MemoryVault
DROP POLICY IF EXISTS "Users can access own memory items" ON memoryvault_items;
CREATE POLICY "Users can access own memory items" ON memoryvault_items
    FOR ALL USING (
        user_id = current_user::text
        OR auth.role() = 'service_role'
    );

-- Indexes for MemoryVault
CREATE INDEX IF NOT EXISTS idx_memoryvault_user ON memoryvault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_category ON memoryvault_items(category);
CREATE INDEX IF NOT EXISTS idx_memoryvault_created ON memoryvault_items(created_at);
CREATE INDEX IF NOT EXISTS idx_memoryvault_tags ON memoryvault_items USING GIN(tags);

-- Add text search index for content
CREATE INDEX IF NOT EXISTS idx_memoryvault_search ON memoryvault_items USING GIN(to_tsvector('english', title || ' ' || content));

-- Campaign tracking table for signaldesk-campaigns MCP server
CREATE TABLE IF NOT EXISTS campaign_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for campaigns
ALTER TABLE campaign_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy for campaigns
DROP POLICY IF EXISTS "Users can access org campaigns" ON campaign_tracking;
CREATE POLICY "Users can access org campaigns" ON campaign_tracking
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

-- Media assets table for signaldesk-media MCP server
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for media
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy for media
DROP POLICY IF EXISTS "Users can access org media" ON media_assets;
CREATE POLICY "Users can access org media" ON media_assets
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

-- Ensure opportunity_queue table exists (referenced by monitor MCP)
CREATE TABLE IF NOT EXISTS opportunity_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for opportunity queue
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy for opportunities
DROP POLICY IF EXISTS "Users can access org opportunities" ON opportunity_queue;
CREATE POLICY "Users can access org opportunities" ON opportunity_queue
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

-- Create demo user data for testing
INSERT INTO memoryvault_items (user_id, title, content, category, tags) VALUES
    ('demo-user', 'SignalDesk Platform Overview', 'SignalDesk is an AI-powered public relations platform that helps organizations monitor stakeholders, identify opportunities, and execute strategic communication campaigns.', 'platform', ARRAY['signaldesk', 'overview', 'platform']),
    ('demo-user', 'Stakeholder Intelligence Strategy', 'Our stakeholder intelligence system monitors key stakeholders across multiple channels, analyzing sentiment and identifying engagement opportunities in real-time.', 'intelligence', ARRAY['stakeholder', 'monitoring', 'intelligence']),
    ('demo-user', 'PR Campaign Best Practices', 'Successful PR campaigns require careful stakeholder analysis, opportunity identification, and strategic messaging aligned with organizational goals.', 'campaigns', ARRAY['pr', 'campaigns', 'strategy'])
ON CONFLICT DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_tracking_org ON campaign_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_org ON media_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_org ON opportunity_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_queue_status ON opportunity_queue(status);