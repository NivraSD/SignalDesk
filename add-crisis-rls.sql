-- Add RLS policies to crisis_events table

-- Enable RLS on crisis_events
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can create crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can update crisis events" ON crisis_events;
DROP POLICY IF EXISTS "Users can delete crisis events" ON crisis_events;

-- Allow all authenticated users to view crisis events
CREATE POLICY "Users can view crisis events" ON crisis_events
  FOR SELECT
  USING (true);

-- Allow all authenticated users to insert crisis events
CREATE POLICY "Users can create crisis events" ON crisis_events
  FOR INSERT
  WITH CHECK (true);

-- Allow all authenticated users to update crisis events
CREATE POLICY "Users can update crisis events" ON crisis_events
  FOR UPDATE
  USING (true);

-- Allow all authenticated users to delete crisis events
CREATE POLICY "Users can delete crisis events" ON crisis_events
  FOR DELETE
  USING (true);

-- Enable RLS on crisis_communications
ALTER TABLE crisis_communications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can create crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can update crisis communications" ON crisis_communications;
DROP POLICY IF EXISTS "Users can delete crisis communications" ON crisis_communications;

-- Allow all authenticated users to view crisis communications
CREATE POLICY "Users can view crisis communications" ON crisis_communications
  FOR SELECT
  USING (true);

-- Allow all authenticated users to insert crisis communications
CREATE POLICY "Users can create crisis communications" ON crisis_communications
  FOR INSERT
  WITH CHECK (true);

-- Allow all authenticated users to update crisis communications
CREATE POLICY "Users can update crisis communications" ON crisis_communications
  FOR UPDATE
  USING (true);

-- Allow all authenticated users to delete crisis communications
CREATE POLICY "Users can delete crisis communications" ON crisis_communications
  FOR DELETE
  USING (true);
