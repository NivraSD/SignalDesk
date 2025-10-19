-- Check what tables and columns actually exist in your database

-- 1. List all tables in public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check for user-related tables (profiles, users, auth.users)
SELECT 
    table_schema,
    table_name
FROM information_schema.tables 
WHERE table_name IN ('users', 'profiles', 'user_profiles')
   OR (table_schema = 'auth' AND table_name = 'users');

-- 3. Check columns in tables that might have organization_id
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name IN ('organization_id', 'org_id', 'user_id', 'profile_id')
ORDER BY table_name, column_name;

-- 4. Show existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. Check auth schema for users
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;