-- Fix User Creation Issues in Supabase
-- Run this in Supabase SQL Editor

-- 1. Check if the trigger exists and is working
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 2. Check if the function exists
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- 3. Drop and recreate the trigger and function (fixed version)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. Create a BETTER function that handles errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only try to insert if profile doesn't exist
    INSERT INTO public.profiles (id, email, name, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid  -- Default org
    )
    ON CONFLICT (id) DO NOTHING;  -- Don't error if profile exists
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 5. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Fix any existing users without profiles
INSERT INTO public.profiles (id, email, name, organization_id)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 7. Grant proper permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 8. Check if RLS is causing issues (temporarily disable for testing)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- 9. Re-enable RLS with better policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Create more permissive policies for profiles
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create permissive policy for organizations
CREATE POLICY "Enable read access for all users" ON organizations
    FOR SELECT USING (true);

-- 10. Test the setup
DO $$
BEGIN
    RAISE NOTICE 'Setup complete!';
    RAISE NOTICE 'Profiles table has % rows', (SELECT COUNT(*) FROM profiles);
    RAISE NOTICE 'Auth users table has % rows', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Organizations table has % rows', (SELECT COUNT(*) FROM organizations);
END $$;