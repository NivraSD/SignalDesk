-- Add 'strategic' to the predictions category check constraint
-- This resolves the constraint violation error when saving predictions

-- Drop the old constraint
ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_category_check;

-- Add the new constraint with 'strategic' included
ALTER TABLE predictions ADD CONSTRAINT predictions_category_check
  CHECK (category IN ('competitive', 'regulatory', 'market', 'technology', 'partnership', 'crisis', 'strategic'));

-- Verify the change
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'predictions_category_check';
