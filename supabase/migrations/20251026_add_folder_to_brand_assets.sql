-- Add folder column to brand_assets for organizing assets
-- This allows users to create folders for different types of assets (photos, templates, etc.)

-- Add folder column
ALTER TABLE brand_assets
ADD COLUMN folder TEXT;

-- Add index for efficient folder queries
CREATE INDEX idx_brand_assets_folder ON brand_assets(organization_id, folder);

-- Add comment
COMMENT ON COLUMN brand_assets.folder IS 'Folder path for organizing brand assets (e.g., "Photos", "Templates/Email", etc.)';
