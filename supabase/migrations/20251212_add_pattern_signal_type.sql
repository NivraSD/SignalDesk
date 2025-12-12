-- Add 'pattern' to allowed signal types
-- Required for analyze-target-patterns function output

-- Drop the existing constraint
ALTER TABLE signals DROP CONSTRAINT IF EXISTS signals_signal_type_check;

-- Add new constraint with 'pattern' included
ALTER TABLE signals ADD CONSTRAINT signals_signal_type_check
  CHECK (signal_type IN ('movement', 'connection', 'predictive', 'opportunity', 'pattern', 'cascade_alert'));

-- Update existing signals from analyze-target-patterns to be type 'pattern'
UPDATE signals
SET signal_type = 'pattern', updated_at = NOW()
WHERE source_pipeline = 'analyze-target-patterns' AND signal_type = 'predictive';
