-- Disable RLS for geo_intelligence table
-- The table is only accessed via edge functions using service role
-- No need for complex RLS policies

ALTER TABLE geo_intelligence DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow service role full access" ON geo_intelligence;
DROP POLICY IF EXISTS "Allow read access for all users" ON geo_intelligence;
DROP POLICY IF EXISTS "Allow service role insert/update" ON geo_intelligence;
DROP POLICY IF EXISTS "Service role can insert GEO intelligence" ON geo_intelligence;
DROP POLICY IF EXISTS "Users can view their organization's GEO intelligence" ON geo_intelligence;
DROP POLICY IF EXISTS "Users can update their organization's GEO intelligence" ON geo_intelligence;

-- Comment for clarity
COMMENT ON TABLE geo_intelligence IS 'GEO intelligence signals - RLS disabled as access is via service role only';
