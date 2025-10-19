-- Add framework_data column to store complete NIV framework structure
-- This preserves all the new structured fields that don't have dedicated columns

ALTER TABLE niv_strategies
ADD COLUMN IF NOT EXISTS framework_data JSONB DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN niv_strategies.framework_data IS 'Complete NIV framework including proof_points, content_needs, media_targets, timeline_execution';