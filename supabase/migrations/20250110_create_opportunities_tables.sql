-- Create opportunities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    score INTEGER DEFAULT 0,
    urgency TEXT CHECK (urgency IN ('high', 'medium', 'low')),
    time_window TEXT,
    category TEXT,
    data JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'executed', 'expired', 'dismissed')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opportunities_organization ON opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_urgency ON opportunities(urgency);
CREATE INDEX IF NOT EXISTS idx_opportunities_expires ON opportunities(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access (adjust as needed for your auth setup)
CREATE POLICY "Allow public read access to opportunities" ON opportunities
    FOR SELECT USING (true);

-- Create policy to allow insert from service role (for edge functions)
CREATE POLICY "Allow service role to insert opportunities" ON opportunities
    FOR INSERT WITH CHECK (true);

-- Create policy to allow update from service role
CREATE POLICY "Allow service role to update opportunities" ON opportunities
    FOR UPDATE USING (true);

-- Create monitoring_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for monitoring_alerts
CREATE INDEX IF NOT EXISTS idx_alerts_organization ON monitoring_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON monitoring_alerts(type);

-- Enable RLS for monitoring_alerts
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for monitoring_alerts
CREATE POLICY "Allow public read access to alerts" ON monitoring_alerts
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert alerts" ON monitoring_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update alerts" ON monitoring_alerts
    FOR UPDATE USING (true);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON monitoring_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();