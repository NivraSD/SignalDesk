-- STEP 2: Populate the new columns with data
-- Run this after step 1

-- Copy name to organization_name
UPDATE organization_profiles 
SET organization_name = name 
WHERE organization_name IS NULL;

-- Build profile_data from existing columns
UPDATE organization_profiles 
SET profile_data = jsonb_build_object(
    'name', name,
    'type', type,
    'description', description,
    'keywords', keywords,
    'focus_areas', focus_areas,
    'settings', settings,
    'metadata', metadata
)
WHERE profile_data IS NULL;

-- Verify data was populated
SELECT 
    id,
    name,
    organization_name,
    jsonb_pretty(profile_data) as profile_data
FROM organization_profiles
LIMIT 5;