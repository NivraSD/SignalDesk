-- First, let's check if the table exists and drop it if needed to recreate with correct schema
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.monitoring_alerts CASCADE;

-- Create opportunities table with correct schema
CREATE TABLE public.opportunities (
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

-- Create indexes
CREATE INDEX idx_opportunities_organization ON opportunities(organization_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX idx_opportunities_urgency ON opportunities(urgency);
CREATE INDEX idx_opportunities_expires ON opportunities(expires_at);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to opportunities" ON opportunities
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert opportunities" ON opportunities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update opportunities" ON opportunities
    FOR UPDATE USING (true);

-- Create monitoring_alerts table
CREATE TABLE public.monitoring_alerts (
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
CREATE INDEX idx_alerts_organization ON monitoring_alerts(organization_id);
CREATE INDEX idx_alerts_status ON monitoring_alerts(status);
CREATE INDEX idx_alerts_severity ON monitoring_alerts(severity);
CREATE INDEX idx_alerts_type ON monitoring_alerts(type);

-- Enable RLS for monitoring_alerts
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for monitoring_alerts
CREATE POLICY "Allow public read access to alerts" ON monitoring_alerts
    FOR SELECT USING (true);

CREATE POLICY "Allow service role to insert alerts" ON monitoring_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update alerts" ON monitoring_alerts
    FOR UPDATE USING (true);

-- Add some test data to verify it's working
INSERT INTO opportunities (
    organization_id,
    title,
    description,
    score,
    urgency,
    time_window,
    category,
    data,
    status
) VALUES (
    'test-org',
    'Test Opportunity: Competitor Crisis',
    'Major competitor facing regulatory investigation. Position as stable alternative.',
    95,
    'high',
    '24-48 hours',
    'CRISIS_RESPONSE',
    '{"trigger_event": "Competitor investigation announced", "context": {"competitor": "CompetitorCo", "issue": "Data breach"}}',
    'active'
);