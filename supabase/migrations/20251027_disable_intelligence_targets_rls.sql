-- Disable RLS for intelligence_targets table
-- Since we're using service role key in API routes, we don't need RLS

ALTER TABLE intelligence_targets DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies (they're no longer needed)
DROP POLICY IF EXISTS "Enable read access for all users" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Allow service role full access" ON intelligence_targets;
