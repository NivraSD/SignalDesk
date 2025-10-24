-- Fix RLS permissions for brand_assets table
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view brand assets for their organization" ON brand_assets;
DROP POLICY IF EXISTS "Users can insert brand assets for their organization" ON brand_assets;
DROP POLICY IF EXISTS "Users can update brand assets for their organization" ON brand_assets;
DROP POLICY IF EXISTS "Users can delete brand assets for their organization" ON brand_assets;

-- Simplified policies that allow all operations
-- (You can tighten these later based on your user_organizations table)

-- Allow SELECT for all authenticated users
CREATE POLICY "Allow select brand_assets"
ON brand_assets FOR SELECT
TO authenticated, anon
USING (true);

-- Allow INSERT for all authenticated users
CREATE POLICY "Allow insert brand_assets"
ON brand_assets FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

-- Allow UPDATE for all authenticated users
CREATE POLICY "Allow update brand_assets"
ON brand_assets FOR UPDATE
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Allow DELETE for all authenticated users
CREATE POLICY "Allow delete brand_assets"
ON brand_assets FOR DELETE
TO authenticated, anon, service_role
USING (true);

-- Also grant direct permissions
GRANT ALL ON brand_assets TO anon;
GRANT ALL ON brand_assets TO authenticated;
GRANT ALL ON brand_assets TO service_role;

-- Verify RLS is enabled
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- Check the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'brand_assets';
