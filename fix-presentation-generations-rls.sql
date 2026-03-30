-- Fix RLS policies for presentation_generations table
-- The service role needs full access to this table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to presentation_generations" ON presentation_generations;
DROP POLICY IF EXISTS "Users can read their organization's presentation generations" ON presentation_generations;

-- Disable RLS temporarily to clean up
ALTER TABLE presentation_generations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE presentation_generations ENABLE ROW LEVEL SECURITY;

-- Allow service role FULL access (this is the service_role key used by edge functions)
CREATE POLICY "Service role has full access to presentation_generations"
  ON presentation_generations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read all presentation generations
-- (They can check status of any presentation)
CREATE POLICY "Anyone can read presentation generations"
  ON presentation_generations
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Grant table permissions to service_role
GRANT ALL ON presentation_generations TO service_role;
GRANT ALL ON presentation_generations TO postgres;

-- Verify the policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'presentation_generations';
