-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.opportunities CASCADE;
DROP TABLE IF EXISTS public.monitoring_alerts CASCADE;

-- Create opportunities table
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
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring_alerts table
CREATE TABLE public.monitoring_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX idx_alerts_org ON monitoring_alerts(organization_id);

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for testing)
CREATE POLICY "Enable all for opportunities" ON opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for alerts" ON monitoring_alerts FOR ALL USING (true) WITH CHECK (true);