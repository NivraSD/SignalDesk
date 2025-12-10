-- Add RLS policy to allow anonymous users to view signals
-- This is needed for the UI to display signals when using the anon key

CREATE POLICY "Anon users can view signals" ON signals
  FOR SELECT
  TO anon
  USING (true);

-- Also add to connection_signals if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connection_signals' AND policyname = 'Anon users can view connection_signals'
  ) THEN
    CREATE POLICY "Anon users can view connection_signals" ON connection_signals
      FOR SELECT
      TO anon
      USING (true);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Table doesn't exist, ignore
END $$;
