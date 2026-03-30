-- SignalDesk V3 Opportunities and Alerts Tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new

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

-- Create indexes for performance
CREATE INDEX idx_opportunities_org ON opportunities(organization_id);
CREATE INDEX idx_opportunities_score ON opportunities(score DESC);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_urgency ON opportunities(urgency);

CREATE INDEX idx_alerts_org ON monitoring_alerts(organization_id);
CREATE INDEX idx_alerts_status ON monitoring_alerts(status);
CREATE INDEX idx_alerts_severity ON monitoring_alerts(severity);

-- Enable Row Level Security
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (you can tighten these later)
CREATE POLICY "Enable all access for opportunities" ON opportunities 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for alerts" ON monitoring_alerts 
    FOR ALL USING (true) WITH CHECK (true);

-- Insert a test opportunity to verify everything works
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
) VALUES 
(
    'tesla',
    'Competitor Crisis: Rivian Stock Plunge',
    'Rivian stock down 15% on production delays. Position Tesla as stable EV leader.',
    95,
    'high',
    '24-48 hours',
    'CRISIS_RESPONSE',
    '{
        "trigger_event": "Rivian announces Q4 production miss",
        "context": {
            "competitor": "Rivian",
            "issue": "Production delays",
            "impact": "Stock down 15%"
        },
        "recommended_action": {
            "what": {
                "primary_action": "Launch stability campaign",
                "specific_tasks": [
                    "Draft comparison highlighting Tesla production strength",
                    "Prepare investor confidence messaging",
                    "Brief sales team on competitive advantages"
                ],
                "deliverables": [
                    "Production comparison infographic",
                    "Sales battlecard",
                    "Social media campaign"
                ]
            },
            "who": {
                "owner": "VP Marketing",
                "team": ["PR Team", "Sales", "Social Media"]
            },
            "when": {
                "start_immediately": true,
                "ideal_launch": "Within 24 hours",
                "duration": "1 week"
            },
            "where": {
                "channels": ["Press release", "Sales outreach", "Social media"],
                "platforms": ["Twitter", "LinkedIn", "Industry media"]
            }
        }
    }'::jsonb,
    'active'
),
(
    'openai',
    'Trending Topic: AGI Speculation',
    'AGI discussions trending globally. Establish thought leadership position.',
    88,
    'high',
    '48-72 hours',
    'THOUGHT_LEADERSHIP',
    '{
        "trigger_event": "AGI keyword trending with 500K+ mentions",
        "context": {
            "topic": "Artificial General Intelligence",
            "momentum": "accelerating",
            "sentiment": "mixed excitement and concern"
        },
        "recommended_action": {
            "what": {
                "primary_action": "Publish authoritative AGI perspective",
                "specific_tasks": [
                    "CEO op-ed on responsible AGI development",
                    "Technical blog post on AGI safety measures",
                    "Host expert panel discussion"
                ],
                "deliverables": [
                    "Op-ed article",
                    "Technical whitepaper",
                    "Webinar recording"
                ]
            },
            "who": {
                "owner": "Chief Communications Officer",
                "team": ["CEO Office", "Research Team", "Content Team"]
            },
            "when": {
                "start_immediately": true,
                "ideal_launch": "Within 48 hours",
                "duration": "1 week"
            },
            "where": {
                "channels": ["Major media outlets", "Company blog", "Social media"],
                "platforms": ["WSJ", "Twitter", "LinkedIn", "YouTube"]
            }
        }
    }'::jsonb,
    'active'
),
(
    'tesla',
    'Regulatory Win: EU Approves FSD',
    'EU approves Full Self-Driving. Major competitive advantage to amplify.',
    92,
    'medium',
    '1 week',
    'REGULATORY',
    '{
        "trigger_event": "EU regulatory approval for FSD beta",
        "context": {
            "region": "European Union",
            "impact": "First approval in EU market",
            "advantage": "6-12 month lead over competitors"
        },
        "recommended_action": {
            "what": {
                "primary_action": "Amplify regulatory leadership position",
                "specific_tasks": [
                    "Press conference with EU officials",
                    "Customer testimonial campaign",
                    "Investor update on EU market opportunity"
                ],
                "deliverables": [
                    "Press kit",
                    "Customer stories",
                    "Investor deck"
                ]
            },
            "who": {
                "owner": "VP Government Affairs",
                "team": ["Legal", "PR", "Investor Relations"]
            },
            "when": {
                "start_immediately": false,
                "ideal_launch": "Within 3 days",
                "duration": "2 weeks"
            },
            "where": {
                "channels": ["Press conference", "Investor call", "Customer email"],
                "platforms": ["European media", "LinkedIn", "Tesla blog"]
            }
        }
    }'::jsonb,
    'active'
);

-- Verify the tables were created
SELECT 'Tables created successfully!' as status,
       (SELECT COUNT(*) FROM opportunities) as opportunity_count,
       (SELECT COUNT(*) FROM monitoring_alerts) as alert_count;