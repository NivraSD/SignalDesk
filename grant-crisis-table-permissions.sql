-- GRANT BASE TABLE PERMISSIONS TO ROLES
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new

-- Grant all permissions on crisis_events to all roles
GRANT ALL ON TABLE public.crisis_events TO anon;
GRANT ALL ON TABLE public.crisis_events TO authenticated;
GRANT ALL ON TABLE public.crisis_events TO service_role;

-- Grant all permissions on crisis_communications to all roles
GRANT ALL ON TABLE public.crisis_communications TO anon;
GRANT ALL ON TABLE public.crisis_communications TO authenticated;
GRANT ALL ON TABLE public.crisis_communications TO service_role;

-- Grant usage on the sequences (for auto-incrementing IDs if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify grants were applied
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('crisis_events', 'crisis_communications')
ORDER BY table_name, grantee, privilege_type;
