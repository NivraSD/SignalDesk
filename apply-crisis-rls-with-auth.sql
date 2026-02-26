-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new

-- First, disable RLS temporarily to see current policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('crisis_events', 'crisis_communications');

-- Now create the policies correctly
-- Enable RLS on crisis_events
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can create crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can update crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can delete crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON crisis_events;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON crisis_events;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON crisis_events;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON crisis_events;

-- Create new policies that work with anon key (for development)
CREATE POLICY "Enable read access for all users" ON crisis_events
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users" ON crisis_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON crisis_events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON crisis_events
  FOR DELETE
  USING (true);

-- Enable RLS on crisis_communications
ALTER TABLE crisis_communications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can create crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can update crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can delete crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON crisis_communications;
DROP POLICY IF EXISTS "Enable insert for all authenticated users" ON crisis_communications;
DROP POLICY IF EXISTS "Enable update for all authenticated users" ON crisis_communications;
DROP POLICY IF EXISTS "Enable delete for all authenticated users" ON crisis_communications;

-- Create new policies that work with anon key (for development)
CREATE POLICY "Enable read access for all users" ON crisis_communications
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users" ON crisis_communications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON crisis_communications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON crisis_communications
  FOR DELETE
  USING (true);

-- Verify the policies were created
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('crisis_events', 'crisis_communications');
