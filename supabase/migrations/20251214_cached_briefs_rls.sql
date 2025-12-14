-- Add RLS policy for cached_briefs to allow authenticated users to read
-- This enables the frontend to load pre-generated morning briefs

-- Enable RLS if not already enabled
ALTER TABLE cached_briefs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can read cached briefs for their orgs" ON cached_briefs;
DROP POLICY IF EXISTS "Users can read cached briefs" ON cached_briefs;
DROP POLICY IF EXISTS "Service role has full access to cached_briefs" ON cached_briefs;

-- Allow authenticated users to read cached briefs
-- (simplified policy - all authenticated users can read any org's cached briefs)
CREATE POLICY "Users can read cached briefs"
ON cached_briefs
FOR SELECT
TO authenticated
USING (true);

-- Also allow anon to read (for frontend queries)
CREATE POLICY "Anon can read cached briefs"
ON cached_briefs
FOR SELECT
TO anon
USING (true);

-- Also allow service role full access (for edge functions)
CREATE POLICY "Service role has full access to cached_briefs"
ON cached_briefs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
