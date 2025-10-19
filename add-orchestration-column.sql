-- Add part3_stakeholderOrchestration column to campaign_builder_sessions
ALTER TABLE campaign_builder_sessions
ADD COLUMN IF NOT EXISTS part3_stakeholderOrchestration jsonb;

-- Check if it was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaign_builder_sessions'
AND column_name LIKE 'part%'
ORDER BY column_name;
