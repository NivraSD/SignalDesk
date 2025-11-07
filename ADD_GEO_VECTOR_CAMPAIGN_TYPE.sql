-- ============================================================================
-- MIGRATION: Add GEO_VECTOR_CAMPAIGN to allowed campaign types
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql
-- 2. Copy and paste this entire SQL script
-- 3. Click "Run" to execute
--
-- This fixes the error:
-- "new row for relation "campaign_builder_sessions" violates check constraint
--  "campaign_builder_sessions_selected_approach_check""
--
-- ============================================================================

-- Drop the old constraint that only allows PR_CAMPAIGN and VECTOR_CAMPAIGN
ALTER TABLE campaign_builder_sessions
  DROP CONSTRAINT IF EXISTS campaign_builder_sessions_selected_approach_check;

-- Add updated constraint that also allows GEO_VECTOR_CAMPAIGN
ALTER TABLE campaign_builder_sessions
  ADD CONSTRAINT campaign_builder_sessions_selected_approach_check
  CHECK (selected_approach IN ('PR_CAMPAIGN', 'VECTOR_CAMPAIGN', 'GEO_VECTOR_CAMPAIGN'));

-- Add documentation
COMMENT ON COLUMN campaign_builder_sessions.selected_approach IS
  'Campaign type: PR_CAMPAIGN (traditional PR), VECTOR_CAMPAIGN (standard VECTOR), or GEO_VECTOR_CAMPAIGN (VECTOR with AI query ownership)';

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'campaign_builder_sessions'::regclass
  AND conname = 'campaign_builder_sessions_selected_approach_check';
