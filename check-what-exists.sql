-- Check current database and what's actually in organization_profiles
SELECT current_database(), current_schema();

-- Show actual content of organization_profiles
SELECT * FROM organization_profiles LIMIT 1;

-- If the above fails, check if table exists at all
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'organization_profiles'
) as table_exists;

-- Show the ACTUAL columns that exist RIGHT NOW
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'organization_profiles'
ORDER BY ordinal_position;