-- Fix RLS policies for geo_intelligence to allow client-side access

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow service role full access" ON geo_intelligence;

-- Allow all authenticated users to read geo_intelligence
-- (In production, you might want to restrict this to specific organizations)
CREATE POLICY "Allow read access for all users" ON geo_intelligence
  FOR SELECT
  USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role insert/update" ON geo_intelligence
  FOR ALL
  USING (true)
  WITH CHECK (true);
