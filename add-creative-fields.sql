-- Add creative fields to opportunities table
-- These fields will store the AI-generated campaign names and creative approaches

-- Add campaign_name column
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Add creative_approach column
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS creative_approach TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_campaign_name
ON opportunities(campaign_name);

CREATE INDEX IF NOT EXISTS idx_opportunities_creative_approach
ON opportunities(creative_approach);

-- Update RLS policies if needed to include new columns
-- (The existing policies should already cover these since they use SELECT *)

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'opportunities'
    AND column_name IN ('campaign_name', 'creative_approach')
ORDER BY
    ordinal_position;