-- SUPABASE AUTH FIX V2 - WORKS WITH EXISTING TABLE STRUCTURE
-- This script adapts to your existing users table structure

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Check what columns exist in the users table
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE public.users ADD COLUMN username TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE public.users ADD COLUMN organization_id UUID;
    END IF;
END $$;

-- Step 3: Create organizations table if needed
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create default organization
INSERT INTO public.organizations (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'SignalDesk Admin')
ON CONFLICT DO NOTHING;

-- Step 5: Enable RLS with permissive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop all existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
    END LOOP;
    
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'organizations' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', pol.policyname);
    END LOOP;
END $$;

-- Step 7: Create permissive policies
CREATE POLICY "Enable all for users" ON public.users
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for organizations" ON public.organizations
    FOR ALL USING (true) WITH CHECK (true);

-- Step 8: Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    col_exists boolean;
BEGIN
    -- Check which columns exist and insert accordingly
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Update additional columns if they exist
    UPDATE public.users 
    SET 
        username = COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
        role = COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
        organization_id = '11111111-1111-1111-1111-111111111111'::uuid,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Clean up existing admin user
DELETE FROM public.users WHERE email = 'admin@signaldesk.com';
DELETE FROM auth.users WHERE email = 'admin@signaldesk.com';

-- Step 11: Create the admin user
DO $$
DECLARE
    user_id UUID;
BEGIN
    user_id := uuid_generate_v4();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        instance_id,
        aud,
        role
    ) VALUES (
        user_id,
        'admin@signaldesk.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"username": "admin", "full_name": "Admin User", "role": "admin"}',
        NOW(),
        NOW(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated'
    );
    
    RAISE NOTICE 'Admin user created successfully with ID: %', user_id;
    
    -- The trigger will handle creating the public.users record
END $$;

-- Step 12: Grant permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.organizations TO anon, authenticated;

-- Step 13: Verify the user was created
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    pu.*
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'admin@signaldesk.com';

-- Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SETUP COMPLETE!';
    RAISE NOTICE 'Admin user created:';
    RAISE NOTICE '  Email: admin@signaldesk.com';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '========================================';
END $$;