-- =====================================================
-- SUPABASE AUTH SCHEMA DIAGNOSTIC AND REPAIR SCRIPT
-- =====================================================
-- This script will diagnose and fix common auth schema issues
-- Run each section sequentially and check the output

-- =====================================================
-- SECTION 1: DIAGNOSTIC QUERIES
-- =====================================================

-- 1.1 Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- 1.2 Check required extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pgjwt', 'pg_stat_statements');

-- 1.3 Check auth tables structure
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'auth' 
GROUP BY table_name
ORDER BY table_name;

-- 1.4 Check for missing auth functions
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
ORDER BY routine_name;

-- 1.5 Check permissions on auth schema
SELECT 
    grantee,
    privilege_type
FROM information_schema.schema_privileges 
WHERE schema_name = 'auth';

-- 1.6 Check for any errors in auth.users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- SECTION 2: INSTALL MISSING EXTENSIONS
-- =====================================================

-- Enable required extensions if missing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 3: FIX AUTH SCHEMA PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticator role
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT USAGE ON SCHEMA public TO authenticator;

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on auth sequences
DO $$
BEGIN
    -- Grant permissions on all sequences in auth schema
    EXECUTE (
        SELECT string_agg('GRANT USAGE ON SEQUENCE ' || schemaname || '.' || sequencename || ' TO authenticator, anon, authenticated;', E'\n')
        FROM pg_sequences
        WHERE schemaname = 'auth'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error granting sequence permissions: %', SQLERRM;
END $$;

-- =====================================================
-- SECTION 4: RECREATE CRITICAL AUTH FUNCTIONS
-- =====================================================

-- 4.1 Ensure uid() function exists (critical for RLS)
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
        current_setting('request.jwt.claim.sub', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )::uuid
$$;

-- 4.2 Ensure role() function exists
CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
        current_setting('request.jwt.claim.role', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
    )::text
$$;

-- 4.3 Ensure email() function exists
CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
        current_setting('request.jwt.claim.email', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
    )::text
$$;

-- Grant execute permissions on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.email() TO anon, authenticated;

-- =====================================================
-- SECTION 5: FIX AUTH.USERS TABLE STRUCTURE
-- =====================================================

-- 5.1 Add any missing columns to auth.users
DO $$
BEGIN
    -- Ensure encrypted_password column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'encrypted_password'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN encrypted_password varchar(255);
    END IF;

    -- Ensure email_confirmed_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'email_confirmed_at'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz;
    END IF;

    -- Ensure raw_app_meta_data column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'raw_app_meta_data'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN raw_app_meta_data jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Ensure raw_user_meta_data column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'raw_user_meta_data'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN raw_user_meta_data jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Ensure aud column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'aud'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN aud varchar(255) DEFAULT 'authenticated';
    END IF;

    -- Ensure role column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN role varchar(255) DEFAULT 'authenticated';
    END IF;
END $$;

-- =====================================================
-- SECTION 6: FIX AUTH TABLES PERMISSIONS
-- =====================================================

-- Grant necessary permissions on auth tables
GRANT SELECT ON auth.users TO authenticator;
GRANT SELECT ON auth.users TO postgres;
GRANT ALL ON auth.users TO supabase_auth_admin;

-- Ensure all auth tables have proper permissions
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'auth'
    LOOP
        EXECUTE 'GRANT SELECT ON auth.' || tbl.tablename || ' TO authenticator';
        EXECUTE 'GRANT ALL ON auth.' || tbl.tablename || ' TO supabase_auth_admin';
    END LOOP;
END $$;

-- =====================================================
-- SECTION 7: RECREATE AUTH SCHEMA VIEWS
-- =====================================================

-- Create or replace auth schema view if missing
CREATE OR REPLACE VIEW auth.schema_migrations AS
SELECT version, inserted_at
FROM auth.schema_migrations;

-- Grant permissions on views
GRANT SELECT ON auth.schema_migrations TO authenticator;

-- =====================================================
-- SECTION 8: FIX EXISTING USER DATA
-- =====================================================

-- Update the admin user to ensure all required fields are set
UPDATE auth.users 
SET 
    encrypted_password = CASE 
        WHEN encrypted_password IS NULL OR encrypted_password = '' 
        THEN crypt('admin123', gen_salt('bf'))
        ELSE encrypted_password
    END,
    email_confirmed_at = CASE 
        WHEN email_confirmed_at IS NULL 
        THEN NOW()
        ELSE email_confirmed_at
    END,
    raw_app_meta_data = CASE 
        WHEN raw_app_meta_data IS NULL 
        THEN '{}'::jsonb
        ELSE raw_app_meta_data
    END,
    raw_user_meta_data = CASE 
        WHEN raw_user_meta_data IS NULL 
        THEN '{}'::jsonb
        ELSE raw_user_meta_data
    END,
    aud = COALESCE(aud, 'authenticated'),
    role = COALESCE(role, 'authenticated'),
    updated_at = NOW()
WHERE email = 'admin@signaldesk.com';

-- =====================================================
-- SECTION 9: CHECK AND FIX AUTH CONSTRAINTS
-- =====================================================

-- Ensure primary key exists on auth.users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_pkey'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) THEN
        ALTER TABLE auth.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Ensure unique constraint on email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_email_key'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) THEN
        ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

-- =====================================================
-- SECTION 10: RESET DATABASE SEARCH PATH
-- =====================================================

-- Ensure proper search path
ALTER DATABASE postgres SET search_path TO public, auth, extensions;

-- Reset role configurations
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;

-- =====================================================
-- SECTION 11: FINAL VERIFICATION
-- =====================================================

-- Verify the admin user exists with all required fields
SELECT 
    id,
    email,
    CASE WHEN encrypted_password IS NOT NULL THEN 'SET' ELSE 'MISSING' END as password_status,
    email_confirmed_at,
    aud,
    role,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'admin@signaldesk.com';

-- Check if auth schema is properly accessible
SELECT 
    n.nspname as schema_name,
    CASE 
        WHEN has_schema_privilege('authenticator', n.nspname, 'USAGE') THEN 'YES' 
        ELSE 'NO' 
    END as authenticator_access,
    CASE 
        WHEN has_schema_privilege('anon', n.nspname, 'USAGE') THEN 'YES' 
        ELSE 'NO' 
    END as anon_access,
    CASE 
        WHEN has_schema_privilege('authenticated', n.nspname, 'USAGE') THEN 'YES' 
        ELSE 'NO' 
    END as authenticated_access
FROM pg_namespace n
WHERE n.nspname IN ('auth', 'public');

-- =====================================================
-- SECTION 12: EMERGENCY AUTH RESET (USE WITH CAUTION)
-- =====================================================
-- Uncomment and run this section only if the above steps don't work

/*
-- Complete auth schema reset
-- WARNING: This will delete all existing users!

-- Drop and recreate auth schema
-- DROP SCHEMA IF EXISTS auth CASCADE;
-- CREATE SCHEMA auth;

-- Recreate minimal auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email varchar(255) NOT NULL,
    encrypted_password varchar(255),
    email_confirmed_at timestamptz DEFAULT NOW(),
    invited_at timestamptz,
    confirmation_token varchar(255),
    confirmation_sent_at timestamptz,
    recovery_token varchar(255),
    recovery_sent_at timestamptz,
    email_change_token_new varchar(255),
    email_change varchar(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    is_super_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    phone varchar(15),
    phone_confirmed_at timestamptz,
    phone_change varchar(15),
    phone_change_token varchar(255),
    phone_change_sent_at timestamptz,
    confirmed_at timestamptz,
    email_change_token_current varchar(255),
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamptz,
    reauthentication_token varchar(255),
    reauthentication_sent_at timestamptz,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamptz,
    aud varchar(255) DEFAULT 'authenticated',
    role varchar(255) DEFAULT 'authenticated',
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON auth.users(created_at);

-- Insert admin user
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    'admin@signaldesk.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"name": "Admin User"}'::jsonb,
    'authenticated',
    'authenticated'
);

-- Recreate auth functions and grant permissions
-- (Include all functions from Section 4)

-- Grant all permissions
-- (Include all grants from Sections 3 and 6)
*/

-- =====================================================
-- END OF DIAGNOSTIC AND REPAIR SCRIPT
-- =====================================================

-- Summary message
DO $$
BEGIN
    RAISE NOTICE 'Auth schema repair script completed. Please check the output above for any errors.';
    RAISE NOTICE 'If authentication still fails, uncomment and run Section 12 for a complete reset.';
END $$;