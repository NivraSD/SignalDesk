-- Create a test user with proper setup
-- Run this in Supabase SQL Editor

-- First, ensure the trigger function exists and works
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Check if user already exists in our users table
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
        -- Update existing user
        UPDATE public.users 
        SET 
            email = new.email,
            updated_at = NOW()
        WHERE id = new.id;
    ELSE
        -- Create new user profile
        INSERT INTO public.users (
            id, 
            email, 
            username, 
            organization_id, 
            role,
            created_at,
            updated_at
        )
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
            '00000000-0000-0000-0000-000000000001',
            COALESCE(new.raw_user_meta_data->>'role', 'admin'),
            NOW(),
            NOW()
        );
    END IF;
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block auth
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Also handle updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Now let's check if test@signaldesk.com exists and fix their profile
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the test user's ID from auth.users
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'test@signaldesk.com'
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Ensure they have a profile in public.users
        INSERT INTO public.users (
            id,
            email,
            username,
            organization_id,
            role,
            created_at,
            updated_at
        )
        VALUES (
            test_user_id,
            'test@signaldesk.com',
            'test',
            '00000000-0000-0000-0000-000000000001',
            'admin',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            updated_at = NOW();
            
        RAISE NOTICE 'Test user profile created/updated successfully';
    ELSE
        RAISE NOTICE 'Test user not found in auth.users - create account first';
    END IF;
END $$;

-- Verify the setup
SELECT 
    'Auth Users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Public Users' as table_name,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'Organizations' as table_name,
    COUNT(*) as count
FROM public.organizations;

-- Check specific test user
SELECT 
    a.email as auth_email,
    a.created_at as auth_created,
    u.email as profile_email,
    u.role as profile_role,
    u.organization_id,
    o.name as org_name
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
LEFT JOIN public.organizations o ON u.organization_id = o.id
WHERE a.email = 'test@signaldesk.com';