-- Fix RLS policies for Gamma presentation tables
-- This allows Edge Functions to work properly

-- Drop existing restrictive policies and create permissive ones for campaign_presentations
DROP POLICY IF EXISTS "Authenticated users can view presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated users can insert presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated users can update presentations" ON campaign_presentations;
DROP POLICY IF EXISTS "Authenticated users can delete presentations" ON campaign_presentations;

-- Create new permissive policies that allow Edge Functions to work
-- Public can view all presentations
CREATE POLICY "Public can view presentations"
  ON campaign_presentations FOR SELECT
  TO public
  USING (true);

-- Authenticated users can manage presentations
CREATE POLICY "Authenticated can manage presentations"
  ON campaign_presentations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users can manage presentations (for Edge Functions)
CREATE POLICY "Anon can manage presentations"
  ON campaign_presentations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Service role has full access (explicit, though it bypasses RLS)
CREATE POLICY "Service role full access to presentations"
  ON campaign_presentations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure content_library has permissive policies for anon and service_role
-- (It already has permissive policies, but let's make sure anon is covered)

-- Check if anon policies exist for content_library, add if missing
DO $$
BEGIN
  -- Add anon policy for SELECT if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_library'
    AND policyname = 'Anon can view content'
  ) THEN
    CREATE POLICY "Anon can view content" ON content_library
      FOR SELECT
      TO anon
      USING (true);
  END IF;

  -- Add anon policy for INSERT if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_library'
    AND policyname = 'Anon can insert content'
  ) THEN
    CREATE POLICY "Anon can insert content" ON content_library
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;

  -- Add service_role policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'content_library'
    AND policyname = 'Service role can manage content'
  ) THEN
    CREATE POLICY "Service role can manage content" ON content_library
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Success message
SELECT '✅ RLS policies updated for Gamma presentation tables' as status;
