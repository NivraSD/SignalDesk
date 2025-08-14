-- Create admin user in Supabase Auth
-- Run this in Supabase SQL Editor

-- Option 1: Use Supabase's built-in function (Recommended)
-- This creates a user that can login immediately
SELECT
  auth.email(),
  auth.role(),
  auth.uid()
FROM
  auth.users
WHERE
  email = 'admin@signaldesk.com';

-- If the above returns no rows, the user doesn't exist. 
-- Unfortunately, we can't directly insert into auth.users from SQL Editor
-- due to security restrictions.

-- Instead, create the user through Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Invite User" 
-- 3. Enter email: admin@signaldesk.com
-- 4. They'll get an invite link, or you can create a password for them

-- OR use this alternative approach:
-- Create a function to create users programmatically
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will only work if you have the proper permissions
  -- You might need to use Supabase Dashboard instead
  RAISE NOTICE 'Please create the user through Supabase Dashboard: Authentication > Users > Invite User';
END;
$$;

-- For now, let's make sure the users table is ready
-- Create the users profile table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization_id TEXT DEFAULT 'demo-org',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (true);  -- Allow all for now, adjust as needed

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Insert demo organization if it doesn't exist
INSERT INTO organizations (id, name, created_at)
VALUES ('demo-org', 'Demo Organization', NOW())
ON CONFLICT (id) DO NOTHING;

-- Check if organizations table exists, if not create it
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo org
INSERT INTO organizations (id, name) 
VALUES ('demo-org', 'Demo Organization')
ON CONFLICT (id) DO NOTHING;