-- SAFE DIAGNOSTIC SCRIPT - Just checks what's wrong, doesn't change anything
-- Run this first to see what the issue is

-- 1. Check if trigger exists
SELECT 
    'Trigger exists' as check_name,
    EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as result;

-- 2. Check if function exists
SELECT 
    'Function exists' as check_name,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') as result;

-- 3. Check default organization exists
SELECT 
    'Default org exists' as check_name,
    EXISTS(SELECT 1 FROM organizations WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid) as result;

-- 4. Check how many users vs profiles exist
SELECT 
    'Auth users count' as metric,
    COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
    'Profiles count' as metric,
    COUNT(*) as value  
FROM profiles;

-- 5. Check users without profiles
SELECT 
    'Users without profiles' as issue,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 6. List users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    'Missing profile' as issue
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
LIMIT 10;

-- 7. Check RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'organizations', 'projects');

-- 8. Check current user permissions
SELECT 
    current_user,
    current_role,
    session_user;

-- 9. Test if we can insert into profiles (dry run)
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
BEGIN
    -- Try to insert a test profile (will rollback)
    BEGIN
        INSERT INTO profiles (id, email, name, organization_id)
        VALUES (
            test_user_id,
            'test@test.com',
            'Test',
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
        );
        
        -- Delete the test immediately
        DELETE FROM profiles WHERE id = test_user_id;
        
        RAISE NOTICE 'SUCCESS: Can insert into profiles table';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR inserting into profiles: %', SQLERRM;
    END;
END $$;

-- 10. Show the actual trigger function source
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';