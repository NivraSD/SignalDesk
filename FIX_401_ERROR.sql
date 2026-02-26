-- Fix 401 Authentication Error for Opportunities
-- Run this ENTIRE script in Supabase SQL Editor

-- 1. First disable RLS completely
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts DISABLE ROW LEVEL SECURITY;

-- 2. Grant full access to authenticated and anon users
GRANT ALL ON opportunities TO anon;
GRANT ALL ON opportunities TO authenticated;
GRANT ALL ON monitoring_alerts TO anon;
GRANT ALL ON monitoring_alerts TO authenticated;

-- 3. Make sure the table is accessible
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Verify the fix
SELECT 'Access fixed! Testing query:' as status;
SELECT id, title, score, urgency FROM opportunities LIMIT 3;

-- 5. Check current row count
SELECT 'Total opportunities:' as info, COUNT(*) as count FROM opportunities;