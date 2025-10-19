<<<<<<< HEAD
-- Fix RLS policies for opportunities and alerts tables
-- Run this in Supabase SQL Editor to fix access issues

-- First, drop existing policies
DROP POLICY IF EXISTS "Enable all access for opportunities" ON opportunities;
DROP POLICY IF EXISTS "Enable all access for alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Allow public read access to opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow service role to insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow service role to update opportunities" ON opportunities;
DROP POLICY IF EXISTS "Allow public read access to alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Allow service role to insert alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Allow service role to update alerts" ON monitoring_alerts;
DROP POLICY IF EXISTS "Enable all for opportunities" ON opportunities;
DROP POLICY IF EXISTS "Enable all for alerts" ON monitoring_alerts;

-- Disable RLS temporarily to ensure access works
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_alerts DISABLE ROW LEVEL SECURITY;

-- Verify data exists
SELECT 'RLS disabled. Current data:' as status;
SELECT COUNT(*) as opportunity_count FROM opportunities;
SELECT COUNT(*) as alert_count FROM monitoring_alerts;

-- Show sample opportunities
SELECT id, title, score, urgency, category FROM opportunities ORDER BY score DESC LIMIT 5;
=======
-- Fix RLS policies to use 'users' table instead of 'profiles'
-- This migration fixes the critical issue where RLS policies reference wrong table

-- Drop existing incorrect policies that reference 'profiles' table
DROP POLICY IF EXISTS "Users can manage org targets" ON intelligence_targets;
DROP POLICY IF EXISTS "Users can manage org monitoring runs" ON monitoring_runs;
DROP POLICY IF EXISTS "Users can view org intelligence" ON intelligence_findings;
DROP POLICY IF EXISTS "Users can manage org opportunities" ON opportunity_queue;
DROP POLICY IF EXISTS "Users can manage org projects" ON projects;
DROP POLICY IF EXISTS "Users can manage org todos" ON todos;
DROP POLICY IF EXISTS "Users can manage org content" ON content;
DROP POLICY IF EXISTS "Users can manage org categories" ON categories;
DROP POLICY IF EXISTS "Users can manage org sources" ON sources;
DROP POLICY IF EXISTS "Users can manage monitoring alerts" ON monitoring_alerts;

-- Create corrected policies using 'users' table
CREATE POLICY "Users can manage org targets" ON intelligence_targets
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org monitoring runs" ON monitoring_runs
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can view org intelligence" ON intelligence_findings
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org opportunities" ON opportunity_queue
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org projects" ON projects
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org todos" ON todos
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org content" ON content
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org categories" ON categories
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage org sources" ON sources
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage monitoring alerts" ON monitoring_alerts
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

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
GRANT SELECT ON users TO anon; -- Needed for initial auth check

-- Add audit log for this migration
INSERT INTO monitoring_alerts (
    organization_id,
    alert_type,
    title,
    message,
    status,
    metadata
) 
SELECT 
    id,
    'system',
    'RLS Policies Updated',
    'Row Level Security policies have been updated to use the correct users table reference',
    'resolved',
    jsonb_build_object(
        'migration', 'fix_rls_policies',
        'timestamp', now(),
        'affected_tables', ARRAY[
            'intelligence_targets', 'monitoring_runs', 'intelligence_findings',
            'opportunity_queue', 'projects', 'todos', 'content', 
            'categories', 'sources', 'monitoring_alerts'
        ]
    )
FROM organizations
LIMIT 1;
>>>>>>> cb4c36f5bcebe01f9c38384c2055b4bc392323bb
