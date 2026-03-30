-- Drop foreign key constraints from campaign_presentations
-- These constraints prevent inserting presentations with opportunity IDs

-- Drop campaign_id foreign key if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'campaign_presentations_campaign_id_fkey'
    AND table_name = 'campaign_presentations'
  ) THEN
    ALTER TABLE campaign_presentations DROP CONSTRAINT campaign_presentations_campaign_id_fkey;
    RAISE NOTICE 'Dropped campaign_id foreign key constraint';
  ELSE
    RAISE NOTICE 'campaign_id foreign key constraint does not exist';
  END IF;
END $$;

-- Drop organization_id foreign key if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'campaign_presentations_organization_id_fkey'
    AND table_name = 'campaign_presentations'
  ) THEN
    ALTER TABLE campaign_presentations DROP CONSTRAINT campaign_presentations_organization_id_fkey;
    RAISE NOTICE 'Dropped organization_id foreign key constraint';
  ELSE
    RAISE NOTICE 'organization_id foreign key constraint does not exist';
  END IF;
END $$;

-- Verify constraints are gone
SELECT
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'campaign_presentations'
  AND constraint_type = 'FOREIGN KEY';
