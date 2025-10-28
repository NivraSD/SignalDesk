-- Fix RLS policies for intelligence_targets
-- This allows service role to bypass RLS and makes policies more permissive

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON intelligence_targets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON intelligence_targets;

-- Create more permissive policies that work with service role
-- Service role will bypass RLS automatically, but these policies help for other cases

CREATE POLICY "Allow service role full access" ON intelligence_targets
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Alternative: Disable RLS for this table (if you're always using service role)
-- ALTER TABLE intelligence_targets DISABLE ROW LEVEL SECURITY;
