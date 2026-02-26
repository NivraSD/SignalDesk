-- Disable RLS for intelligence_targets table
-- The API uses service role key which should bypass RLS,
-- but we'll explicitly disable it to ensure no issues

-- First, drop any existing RLS policies
DROP POLICY IF EXISTS "Allow service role full access" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable read access for all users" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON intelligence_targets;

-- Disable RLS entirely
ALTER TABLE intelligence_targets DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'intelligence_targets';
