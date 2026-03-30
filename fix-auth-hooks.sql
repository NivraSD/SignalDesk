-- FIX AUTH HOOKS AND TRIGGERS
-- This removes ALL auth-related hooks that might be causing issues

-- Step 1: Drop ALL triggers on auth.users
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT tgname, nspname, relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
        AND tgname NOT LIKE 'pg_%' AND tgname NOT LIKE 'RI_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trig.tgname);
    END LOOP;
END $$;

-- Step 2: Drop ALL auth-related functions that might be problematic
DROP FUNCTION IF EXISTS auth.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth.on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.on_auth_user_created() CASCADE;

-- Step 3: Check for any remaining triggers
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname IN ('auth', 'public') 
AND c.relname = 'users'
AND tgname NOT LIKE 'pg_%' 
AND tgname NOT LIKE 'RI_%';

-- Step 4: Ensure basic auth functions are enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 5: Test if we can query the user
SELECT 
    id,
    email,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Password is set'
        ELSE 'No password'
    END as password_status,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'admin@signaldesk.com';

-- If everything runs without error, auth should now work!