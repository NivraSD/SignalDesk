-- Link predictions to intelligence targets
-- This allows predictions to be organized by competitor, topic, keyword, or influencer

-- Step 1: Add target_id column (nullable for backward compatibility)
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS target_id UUID REFERENCES intelligence_targets(id) ON DELETE SET NULL;

-- Step 2: Add target_name for quick lookups (denormalized for performance)
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS target_name VARCHAR(255);

-- Step 3: Add target_type for filtering
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS target_type VARCHAR(50);

-- Step 4: Create index for efficient target-based queries
CREATE INDEX IF NOT EXISTS idx_predictions_target_id ON predictions(target_id);
CREATE INDEX IF NOT EXISTS idx_predictions_target_type ON predictions(target_type);
CREATE INDEX IF NOT EXISTS idx_predictions_org_target ON predictions(organization_id, target_id);

-- Step 5: Add comments
COMMENT ON COLUMN predictions.target_id IS 'Reference to intelligence_targets table (competitor, topic, keyword, influencer)';
COMMENT ON COLUMN predictions.target_name IS 'Denormalized target name for quick display';
COMMENT ON COLUMN predictions.target_type IS 'Type of target: competitor, topic, keyword, influencer';

-- Step 6: Create view for predictions with target details
CREATE OR REPLACE VIEW predictions_with_targets AS
SELECT
  p.*,
  t.name as target_name_full,
  t.type as target_type_full,
  t.priority as target_priority,
  t.threat_level,
  t.keywords as target_keywords,
  t.active as target_active
FROM predictions p
LEFT JOIN intelligence_targets t ON p.target_id = t.id;

-- Grant access to view
GRANT SELECT ON predictions_with_targets TO authenticated, anon, service_role;

COMMENT ON VIEW predictions_with_targets IS 'Predictions enriched with full target information';
