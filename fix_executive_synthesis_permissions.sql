-- Fix executive_synthesis table permissions for Supabase API access
-- Run this in your Supabase SQL Editor

-- Enable public schema access
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO public;

-- Grant permissions on the table to public role (which Supabase API uses)
GRANT ALL ON executive_synthesis TO postgres;
GRANT ALL ON executive_synthesis TO public;

-- Make sure RLS is OFF (we already did this but let's be sure)
ALTER TABLE executive_synthesis DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'Permissions updated!' as status;
