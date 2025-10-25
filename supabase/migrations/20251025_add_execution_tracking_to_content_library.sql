-- Add execution tracking fields to content_library table

-- Add executed flag and timestamp
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS executed BOOLEAN DEFAULT FALSE;

ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;

-- Add result tracking (JSON field for flexible result types)
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS result JSONB;

-- Add feedback field for user comments
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_library_executed
ON content_library(executed)
WHERE executed = TRUE;

CREATE INDEX IF NOT EXISTS idx_content_library_executed_at
ON content_library(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_library_org_executed
ON content_library(organization_id, executed);

-- Add comments for documentation
COMMENT ON COLUMN content_library.executed IS 'Whether this content has been executed/published/used';
COMMENT ON COLUMN content_library.executed_at IS 'Timestamp when the content was executed';
COMMENT ON COLUMN content_library.result IS 'Content-type specific result data (type, value, notes)';
COMMENT ON COLUMN content_library.feedback IS 'User feedback on content performance or usage';

-- Example result JSON structure:
-- {
--   "type": "media_response" | "engagement" | "pickup" | "other",
--   "value": "string or number",
--   "notes": "optional additional context"
-- }
