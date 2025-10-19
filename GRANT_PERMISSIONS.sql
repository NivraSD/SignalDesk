-- Grant permissions for the discovery tables
-- Run this in Supabase SQL Editor

-- Grant all permissions to service_role, anon, and authenticated
GRANT ALL ON TABLE mcp_discovery TO service_role, anon, authenticated;
GRANT ALL ON TABLE fireplexity_searches TO service_role, anon, authenticated;

-- Grant sequence permissions for auto-increment
GRANT ALL ON SEQUENCE fireplexity_searches_id_seq TO service_role, anon, authenticated;

-- Ensure RLS is disabled for testing (you can enable it later with policies)
ALTER TABLE mcp_discovery DISABLE ROW LEVEL SECURITY;
ALTER TABLE fireplexity_searches DISABLE ROW LEVEL SECURITY;