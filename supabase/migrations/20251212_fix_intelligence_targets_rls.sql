-- Fix RLS for intelligence_targets to allow reading
-- The table needs to be readable for the admin dashboard and frontend components
-- Target data isn't sensitive, so allow all reads

-- Enable RLS
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all reads on intelligence_targets" ON intelligence_targets;

-- Allow all reads (target data isn't sensitive)
CREATE POLICY "Allow all reads on intelligence_targets" ON intelligence_targets
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON intelligence_targets TO anon;
GRANT SELECT ON intelligence_targets TO authenticated;
