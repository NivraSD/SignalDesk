-- Grant table-level permissions to roles
-- RLS policies only work if the role has GRANT access to the table

-- Grant permissions on campaign_presentations
GRANT ALL ON campaign_presentations TO anon;
GRANT ALL ON campaign_presentations TO authenticated;
GRANT ALL ON campaign_presentations TO service_role;

-- Grant permissions on content_library
GRANT ALL ON content_library TO anon;
GRANT ALL ON content_library TO authenticated;
GRANT ALL ON content_library TO service_role;

-- Grant usage on sequences (for default gen_random_uuid())
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify grants
SELECT
  tablename,
  string_agg(DISTINCT grantee::text, ', ') as granted_to
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('campaign_presentations', 'content_library')
GROUP BY tablename
ORDER BY tablename;
