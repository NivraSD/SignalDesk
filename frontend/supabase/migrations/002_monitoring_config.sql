-- Create monitoring_config table
CREATE TABLE IF NOT EXISTS monitoring_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    sources JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE monitoring_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and manage their org's monitoring config
CREATE POLICY "Users can manage org monitoring config" ON monitoring_config
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_monitoring_config_org ON monitoring_config(organization_id);