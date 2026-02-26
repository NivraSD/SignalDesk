-- DIAGNOSE AUTH ISSUES
-- Run each query separately to identify the problem

-- 1. Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- 2. Check required extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 3. Check auth tables structure
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'auth' 
GROUP BY table_name
ORDER BY table_name;

-- 4. Check auth.users columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check if admin user exists
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email = 'admin@signaldesk.com';

-- 6. Check auth functions
SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'auth'
ORDER BY routine_name;