-- Add RLS policy for target_article_matches to allow reading
-- This table just links targets to articles - no sensitive data
-- All users can read matches (needed for admin dashboard and org views)

-- Enable RLS if not already enabled
ALTER TABLE target_article_matches ENABLE ROW LEVEL SECURITY;

-- Allow all users to read matches (data is just foreign keys, not sensitive)
CREATE POLICY "Anyone can read matches"
ON target_article_matches
FOR SELECT
USING (true);
