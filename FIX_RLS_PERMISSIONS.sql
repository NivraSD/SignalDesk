-- Fix RLS permissions for monitoring tables
-- Run this to allow the Edge Function to access tables

-- Allow anon role to access tables (needed for Edge Function)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Update RLS policies to allow service_role access
DROP POLICY IF EXISTS "Users can manage org targets" ON intelligence_targets;
CREATE POLICY "Users can manage org targets" ON intelligence_targets
    FOR ALL USING (
        -- Allow authenticated users to see their org targets
        (auth.role() = 'authenticated' AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
        OR 
        -- Allow service_role (Edge Functions) to access all
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Users can manage org monitoring runs" ON monitoring_runs;
CREATE POLICY "Users can manage org monitoring runs" ON monitoring_runs
    FOR ALL USING (
        -- Allow authenticated users to see their org runs
        (auth.role() = 'authenticated' AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
        OR 
        -- Allow service_role (Edge Functions) to access all
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Users can view org intelligence" ON intelligence_findings;
CREATE POLICY "Users can view org intelligence" ON intelligence_findings
    FOR ALL USING (
        -- Allow authenticated users to see their org findings
        (auth.role() = 'authenticated' AND organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
        OR 
        -- Allow service_role (Edge Functions) to access all
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Users can manage org sources" ON target_sources;
CREATE POLICY "Users can manage org sources" ON target_sources
    FOR ALL USING (
        -- Allow authenticated users to manage sources for their targets
        (auth.role() = 'authenticated' AND target_id IN (
            SELECT id FROM intelligence_targets 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        ))
        OR 
        -- Allow service_role (Edge Functions) to access all
        auth.role() = 'service_role'
    );