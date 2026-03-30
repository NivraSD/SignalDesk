-- Fix RLS policies for journalist_registry to allow service role access

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to journalist registry" ON journalist_registry;
DROP POLICY IF EXISTS "Allow authenticated users to insert journalists" ON journalist_registry;
DROP POLICY IF EXISTS "Allow authenticated users to update journalists" ON journalist_registry;

-- Create new policies that work with service role
CREATE POLICY "Allow all access to journalist registry"
  ON journalist_registry
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Or disable RLS temporarily for easier management
ALTER TABLE journalist_registry DISABLE ROW LEVEL SECURITY;
