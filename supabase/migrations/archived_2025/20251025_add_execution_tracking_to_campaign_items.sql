-- Add execution tracking fields to campaign_execution_items table

-- Add executed flag and timestamp
ALTER TABLE campaign_execution_items
ADD COLUMN IF NOT EXISTS executed BOOLEAN DEFAULT FALSE;

ALTER TABLE campaign_execution_items
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;

-- Add result tracking (JSON field for flexible result types)
ALTER TABLE campaign_execution_items
ADD COLUMN IF NOT EXISTS result JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaign_items_executed
ON campaign_execution_items(executed)
WHERE executed = TRUE;

CREATE INDEX IF NOT EXISTS idx_campaign_items_executed_at
ON campaign_execution_items(executed_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN campaign_execution_items.executed IS 'Whether this content item has been executed/published';
COMMENT ON COLUMN campaign_execution_items.executed_at IS 'Timestamp when the content was executed';
COMMENT ON COLUMN campaign_execution_items.result IS 'Content-type specific result data (type, value, notes)';

-- Example result JSON structure:
-- {
--   "type": "media_response" | "engagement" | "pickup" | "other",
--   "value": "string or number",
--   "notes": "optional additional context"
-- }
