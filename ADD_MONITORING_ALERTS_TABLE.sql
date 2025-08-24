-- Add monitoring alerts table for MCP server
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    stakeholder VARCHAR(255) NOT NULL,
    alert_type VARCHAR(100) NOT NULL, -- 'mention', 'sentiment_change', 'opportunity', 'crisis'
    threshold INTEGER DEFAULT 70,
    active BOOLEAN DEFAULT true,
    triggered_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Users can manage org alerts" ON monitoring_alerts;
CREATE POLICY "Users can manage org alerts" ON monitoring_alerts
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR auth.role() = 'service_role'
    );

-- Create index
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_org ON monitoring_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_active ON monitoring_alerts(active);