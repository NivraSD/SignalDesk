-- Add category column to intelligence_targets for stakeholder classification
-- This allows us to distinguish between regulators, influencers, investors, etc.

ALTER TABLE intelligence_targets
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_intelligence_targets_category
ON intelligence_targets(category);

-- Migrate existing category data from metadata to new column
UPDATE intelligence_targets
SET category = metadata->>'category'
WHERE metadata->>'category' IS NOT NULL;

-- Add comment
COMMENT ON COLUMN intelligence_targets.category IS 'Stakeholder category: regulator, influencer, investor, executive, customer, partner, etc.';
