-- Create a demo user with confirmed email
-- Run this in Supabase SQL Editor

-- First, check if user exists and delete if needed
DELETE FROM auth.users WHERE email = 'demo@signaldesk.com';

-- Create new user with confirmed email
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    gen_random_uuid(),
    'demo@signaldesk.com',
    crypt('DemoPassword123!', gen_salt('bf')),
    now(), -- This confirms the email immediately
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
);

-- Verify the user was created
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'demo@signaldesk.com';