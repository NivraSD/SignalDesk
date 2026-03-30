-- Fix RLS policies to use 'users' table instead of 'profiles'
-- This version only handles tables that exist in your database

-- First, let's check which tables actually exist and have policies
DO $$
BEGIN
    -- Drop and recreate policies only for tables that exist
    
    -- intelligence_targets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_targets') THEN
        DROP POLICY IF EXISTS "Users can manage org targets" ON intelligence_targets;
        CREATE POLICY "Users can manage org targets" ON intelligence_targets
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for intelligence_targets';
    END IF;

    -- monitoring_runs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monitoring_runs') THEN
        DROP POLICY IF EXISTS "Users can manage org monitoring runs" ON monitoring_runs;
        CREATE POLICY "Users can manage org monitoring runs" ON monitoring_runs
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for monitoring_runs';
    END IF;

    -- intelligence_findings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intelligence_findings') THEN
        DROP POLICY IF EXISTS "Users can view org intelligence" ON intelligence_findings;
        CREATE POLICY "Users can view org intelligence" ON intelligence_findings
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for intelligence_findings';
    END IF;

    -- opportunity_queue
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunity_queue') THEN
        DROP POLICY IF EXISTS "Users can manage org opportunities" ON opportunity_queue;
        CREATE POLICY "Users can manage org opportunities" ON opportunity_queue
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for opportunity_queue';
    END IF;

    -- projects
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        DROP POLICY IF EXISTS "Users can manage org projects" ON projects;
        CREATE POLICY "Users can manage org projects" ON projects
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for projects';
    END IF;

    -- todos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todos') THEN
        DROP POLICY IF EXISTS "Users can manage org todos" ON todos;
        CREATE POLICY "Users can manage org todos" ON todos
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for todos';
    END IF;

    -- content
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content') THEN
        DROP POLICY IF EXISTS "Users can manage org content" ON content;
        CREATE POLICY "Users can manage org content" ON content
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for content';
    END IF;

    -- sources
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sources') THEN
        DROP POLICY IF EXISTS "Users can manage org sources" ON sources;
        CREATE POLICY "Users can manage org sources" ON sources
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for sources';
    END IF;

    -- monitoring_alerts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monitoring_alerts') THEN
        DROP POLICY IF EXISTS "Users can manage monitoring alerts" ON monitoring_alerts;
        CREATE POLICY "Users can manage monitoring alerts" ON monitoring_alerts
            FOR ALL USING (
                organization_id IN (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                )
            );
        RAISE NOTICE 'Fixed policies for monitoring_alerts';
    END IF;

END $$;

-- Grant proper permissions for Edge Functions (service role needs full access)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant proper permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure anon role has minimal access (only what's needed for auth)
GRANT USAGE ON SCHEMA public TO anon;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        GRANT SELECT ON users TO anon;
    END IF;
END $$;

-- Show which tables have RLS policies after the fix
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;