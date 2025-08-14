-- SUPABASE AUTH FIX AND ADMIN USER CREATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This will fix all auth issues and create your admin user

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Step 3: Create users table in public schema if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add foreign key if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_organization_id_fkey'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_organization_id_fkey 
        FOREIGN KEY (organization_id) 
        REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 6: Create default organization for admin
INSERT INTO public.organizations (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'SignalDesk Admin')
ON CONFLICT DO NOTHING;

-- Step 7: Enable RLS but make it permissive for setup
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- Step 9: Create permissive policies for initial setup
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authentication" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users" ON public.users
    FOR UPDATE USING (true);

CREATE POLICY "Organizations viewable by members" ON public.organizations
    FOR SELECT USING (true);

-- Step 10: Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, full_name, role, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
        '11111111-1111-1111-1111-111111111111'::uuid
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 12: Now let's delete any existing admin user to start fresh
DELETE FROM public.users WHERE email = 'admin@signaldesk.com';
DELETE FROM auth.users WHERE email = 'admin@signaldesk.com';

-- Step 13: Create the admin user using Supabase's auth functions
-- This is the CORRECT way to create a user in Supabase
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Generate a new UUID for the user
    user_id := uuid_generate_v4();
    
    -- Insert into auth.users (this is the proper way)
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
    
    -- Insert into public.users
    INSERT INTO public.users (
        id,
        email,
        username,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        'admin@signaldesk.com',
        'admin',
        'Admin User',
        'admin',
        '11111111-1111-1111-1111-111111111111',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Admin user created successfully with ID: %', user_id;
END $$;

-- Step 14: Verify the user was created
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    pu.username,
    pu.full_name,
    pu.role,
    pu.organization_id,
    o.name as organization_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.organizations o ON pu.organization_id = o.id
WHERE au.email = 'admin@signaldesk.com';

-- Step 15: Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.organizations TO anon, authenticated;

-- Final message
DO $$
BEGIN
    RAISE NOTICE 'Setup complete! Admin user created with email: admin@signaldesk.com and password: admin123';
END $$;