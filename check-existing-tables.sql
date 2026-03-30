-- Check what tables and columns already exist in your Supabase database

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check structure of memoryvault_items table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'memoryvault_items'
ORDER BY ordinal_position;

-- Check structure of campaigns-related tables
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('campaigns', 'campaign_tasks', 'campaign_tracking')
ORDER BY table_name, ordinal_position;

-- Check structure of media-related tables  
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('journalists', 'media_lists', 'media_outreach', 'media_assets')
ORDER BY table_name, ordinal_position;

-- Check if profiles table exists and its structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if users table exists and its structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;