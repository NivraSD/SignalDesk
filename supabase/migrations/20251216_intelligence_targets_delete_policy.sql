-- Add DELETE policy for intelligence_targets
-- Allows service_role and authenticated users to delete targets for their organization

-- Drop existing delete policy if exists
DROP POLICY IF EXISTS "Allow delete on intelligence_targets" ON intelligence_targets;

-- Allow all deletes (for admin cleanup and user management)
CREATE POLICY "Allow delete on intelligence_targets" ON intelligence_targets
  FOR DELETE
  USING (true);

-- Also add UPDATE policy if missing
DROP POLICY IF EXISTS "Allow update on intelligence_targets" ON intelligence_targets;

CREATE POLICY "Allow update on intelligence_targets" ON intelligence_targets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- And INSERT policy if missing
DROP POLICY IF EXISTS "Allow insert on intelligence_targets" ON intelligence_targets;

CREATE POLICY "Allow insert on intelligence_targets" ON intelligence_targets
  FOR INSERT
  WITH CHECK (true);

-- Grant all permissions to service_role
GRANT ALL ON intelligence_targets TO service_role;
