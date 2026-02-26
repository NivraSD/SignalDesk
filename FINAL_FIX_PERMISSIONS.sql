-- FINAL FIX: Grant all permissions and disable RLS
-- Run this in Supabase SQL Editor to fix all access issues

-- 1. Disable RLS on both tables
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts DISABLE ROW LEVEL SECURITY;

-- 2. Grant ALL privileges to anon, authenticated, and service_role
GRANT ALL PRIVILEGES ON TABLE opportunities TO anon;
GRANT ALL PRIVILEGES ON TABLE opportunities TO authenticated;
GRANT ALL PRIVILEGES ON TABLE opportunities TO service_role;
GRANT ALL PRIVILEGES ON TABLE monitoring_alerts TO anon;
GRANT ALL PRIVILEGES ON TABLE monitoring_alerts TO authenticated;
GRANT ALL PRIVILEGES ON TABLE monitoring_alerts TO service_role;

-- 3. Grant usage on sequences (for inserts)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 5. Verify the fix worked
SELECT 'Permissions fixed!' as status;
SELECT COUNT(*) as opportunity_count FROM opportunities;
SELECT id, title, score, urgency FROM opportunities ORDER BY score DESC LIMIT 3;