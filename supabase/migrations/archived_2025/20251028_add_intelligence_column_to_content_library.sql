-- Add intelligence column to content_library table for GEO performance tracking

ALTER TABLE content_library 
ADD COLUMN IF NOT EXISTS intelligence JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_content_library_intelligence 
ON content_library USING gin (intelligence);

-- Update existing schema entries to have empty intelligence object
UPDATE content_library 
SET intelligence = '{}'::jsonb 
WHERE content_type = 'schema' AND intelligence IS NULL;
