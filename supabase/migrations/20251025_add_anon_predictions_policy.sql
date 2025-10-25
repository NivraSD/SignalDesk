-- Add RLS policy to allow anonymous users to view predictions
-- This is needed for the UI to display predictions when using the anon key

CREATE POLICY "Anon users can view predictions" ON predictions
  FOR SELECT
  TO anon
  USING (true);
