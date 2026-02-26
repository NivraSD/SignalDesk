-- Run this in Supabase SQL Editor to create the discovery tables

-- Create MCP Discovery table for storing organization profiles
CREATE TABLE IF NOT EXISTS mcp_discovery (
  organization_id TEXT PRIMARY KEY,
  organization_name TEXT,
  industry TEXT,
  competition JSONB,
  keywords TEXT[],
  stakeholders JSONB,
  monitoring_config JSONB,
  trending JSONB,
  business_focus JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Fireplexity searches table for storing web search results
CREATE TABLE IF NOT EXISTS fireplexity_searches (
  id SERIAL PRIMARY KEY,
  organization_id TEXT,
  query TEXT,
  results JSONB,
  strategy TEXT,
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mcp_discovery_org_name ON mcp_discovery(organization_name);
CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_org ON fireplexity_searches(organization_id);
CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_query ON fireplexity_searches(query);
CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_created ON fireplexity_searches(created_at DESC);

-- Grant access to anon and authenticated roles
GRANT ALL ON mcp_discovery TO anon, authenticated;
GRANT ALL ON fireplexity_searches TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE fireplexity_searches_id_seq TO anon, authenticated;