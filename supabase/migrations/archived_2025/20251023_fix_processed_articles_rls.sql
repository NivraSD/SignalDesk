-- Fix RLS policies for processed_articles table
-- Edge functions need proper access to insert/update/delete

-- Drop existing policy
DROP POLICY IF EXISTS "Service role can manage processed articles" ON processed_articles;

-- Create comprehensive policies for service role and authenticated users

-- Policy 1: Service role has full access (for edge functions)
CREATE POLICY "Service role full access"
  ON processed_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can insert their own org's articles
CREATE POLICY "Authenticated can insert processed articles"
  ON processed_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 3: Authenticated users can read all processed articles
CREATE POLICY "Authenticated can read processed articles"
  ON processed_articles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 4: Public read access (for anon key if needed)
CREATE POLICY "Anon can read processed articles"
  ON processed_articles
  FOR SELECT
  TO anon
  USING (true);

-- Ensure the table owner has full access
ALTER TABLE processed_articles OWNER TO postgres;

-- Grant necessary permissions to service_role
GRANT ALL ON processed_articles TO service_role;
GRANT ALL ON processed_articles TO authenticated;
GRANT SELECT ON processed_articles TO anon;

COMMENT ON POLICY "Service role full access" ON processed_articles
  IS 'Service role has full access for edge function operations';
COMMENT ON POLICY "Authenticated can insert processed articles" ON processed_articles
  IS 'Authenticated users can insert processed articles for any organization';
COMMENT ON POLICY "Authenticated can read processed articles" ON processed_articles
  IS 'Authenticated users can read all processed articles';
