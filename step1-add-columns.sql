-- STEP 1: Add missing columns to organization_profiles
-- Run this first

-- Add organization_name column
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- Add profile_data column
ALTER TABLE organization_profiles 
ADD COLUMN IF NOT EXISTS profile_data JSONB;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
AND column_name IN ('organization_name', 'profile_data');