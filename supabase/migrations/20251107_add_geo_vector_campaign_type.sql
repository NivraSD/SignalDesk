-- Add GEO_VECTOR_CAMPAIGN to allowed campaign types
-- This migration updates the check constraint on campaign_builder_sessions.selected_approach
-- to allow the new GEO_VECTOR_CAMPAIGN type alongside existing PR_CAMPAIGN and VECTOR_CAMPAIGN

-- Drop the old constraint
ALTER TABLE campaign_builder_sessions
  DROP CONSTRAINT IF EXISTS campaign_builder_sessions_selected_approach_check;

-- Add updated constraint with GEO_VECTOR_CAMPAIGN
ALTER TABLE campaign_builder_sessions
  ADD CONSTRAINT campaign_builder_sessions_selected_approach_check
  CHECK (selected_approach IN ('PR_CAMPAIGN', 'VECTOR_CAMPAIGN', 'GEO_VECTOR_CAMPAIGN'));

-- Add comment explaining the types
COMMENT ON COLUMN campaign_builder_sessions.selected_approach IS
  'Campaign type: PR_CAMPAIGN (traditional PR), VECTOR_CAMPAIGN (standard VECTOR), or GEO_VECTOR_CAMPAIGN (VECTOR with AI query ownership)';
