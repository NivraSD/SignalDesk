-- Create mcp_discovery table for organization profiles
CREATE TABLE IF NOT EXISTS mcp_discovery (
  organization_id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  industry TEXT DEFAULT 'Technology',
  competition JSONB DEFAULT '{"direct_competitors": [], "indirect_competitors": []}',
  keywords TEXT[] DEFAULT '{}',
  stakeholders JSONB,
  monitoring_config JSONB,
  trending JSONB,
  business_focus JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaign_builder_sessions table
CREATE TABLE IF NOT EXISTS campaign_builder_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  user_id TEXT,
  status TEXT DEFAULT 'in_progress',
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fireplexity_searches table for caching search results
CREATE TABLE IF NOT EXISTS fireplexity_searches (
  id SERIAL PRIMARY KEY,
  organization_id TEXT,
  query TEXT,
  results JSONB,
  strategy TEXT,
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mcp_discovery_org_name ON mcp_discovery(organization_name);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_org ON campaign_builder_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_status ON campaign_builder_sessions(status);
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_updated ON campaign_builder_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_org ON fireplexity_searches(organization_id);
CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_query ON fireplexity_searches(query);
CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_created ON fireplexity_searches(created_at DESC);

-- Insert Amplify organization profile
INSERT INTO mcp_discovery (organization_id, organization_name, industry, keywords)
VALUES ('5a8eaca4-ee9a-448a-ab46-1e371c64592f', 'Amplify', 'Event Production', ARRAY['Amplify', 'event production', 'experiential marketing'])
ON CONFLICT (organization_id) DO UPDATE 
SET organization_name = 'Amplify', 
    industry = 'Event Production',
    keywords = ARRAY['Amplify', 'event production', 'experiential marketing'],
    updated_at = NOW();
