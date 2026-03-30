-- Add 'topic' as a valid target_type for intelligence_targets
-- This allows matching articles against topics like "Energy transition", "Commodity price volatility"
-- in addition to entity-based targets like competitors and regulators

-- Drop the existing constraint
ALTER TABLE intelligence_targets DROP CONSTRAINT IF EXISTS intelligence_targets_target_type_check;

-- Add the updated constraint with 'topic' included
ALTER TABLE intelligence_targets ADD CONSTRAINT intelligence_targets_target_type_check
  CHECK (target_type IN ('competitor', 'influencer', 'regulator', 'stakeholder', 'topic', 'industry_trend', 'market'));
