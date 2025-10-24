-- Add file_url column to brand_assets table
-- This stores the public URL for accessing uploaded files

ALTER TABLE brand_assets
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Update existing records with their public URLs (if they have file_path)
UPDATE brand_assets
SET file_url = 'https://zskaxjtyuaqazydouifp.supabase.co/storage/v1/object/public/brand-assets/' || file_path
WHERE file_url IS NULL AND file_path IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_assets_file_url ON brand_assets(file_url);

-- Verify the column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'brand_assets'
  AND column_name = 'file_url';
