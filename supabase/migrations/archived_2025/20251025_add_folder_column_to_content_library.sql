-- Add folder column to content_library for Memory Vault folder organization
-- This is separate from folder_path which is used for file storage paths

ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS folder TEXT;

-- Create index for faster folder queries
CREATE INDEX IF NOT EXISTS idx_content_library_folder_org
ON content_library(organization_id, folder);

-- Migrate existing folder_path data to folder column where applicable
-- This handles any existing content that used folder_path for organization
UPDATE content_library
SET folder = folder_path
WHERE folder IS NULL AND folder_path IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN content_library.folder IS 'Memory Vault folder path for organization (e.g., Campaigns/BlueprintName/Priority 1/Stakeholder)';
