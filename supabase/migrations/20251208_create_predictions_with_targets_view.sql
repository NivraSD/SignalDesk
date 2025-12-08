-- Create the predictions_with_targets view
-- This view exposes predictions with compatible columns for the frontend service

-- First drop if exists to ensure clean state
DROP VIEW IF EXISTS predictions_with_targets;

-- Create the view
-- The predictions table already has denormalized target_name and target_type
-- We add compatibility columns for the full target details (nullable)
CREATE VIEW predictions_with_targets AS
SELECT
  p.id,
  p.organization_id,
  p.title,
  p.description,
  p.category,
  p.confidence_score,
  p.time_horizon,
  p.impact_level,
  p.data,
  p.status,
  p.created_at,
  p.updated_at,
  p.target_id,
  p.target_name,
  p.target_type,
  p.trigger_event_id,
  p.trigger_event_summary,
  p.pattern_confidence,
  p.target_name as target_name_full,
  p.target_type as target_type_full,
  NULL::integer as target_priority,
  NULL::integer as threat_level,
  NULL::text[] as target_keywords,
  NULL::boolean as target_active
FROM predictions p;

-- Grant access to view
GRANT SELECT ON predictions_with_targets TO authenticated;
GRANT SELECT ON predictions_with_targets TO anon;
GRANT SELECT ON predictions_with_targets TO service_role;

-- Add comment
COMMENT ON VIEW predictions_with_targets IS 'Predictions with target compatibility columns';
