-- Temporarily disable RLS to test if that's the issue
ALTER TABLE niv_strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategy_executions DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategy_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE niv_strategy_collaborators DISABLE ROW LEVEL SECURITY;

-- Make sure the tables have proper permissions
GRANT ALL ON niv_strategies TO anon;
GRANT ALL ON niv_strategies TO authenticated;
GRANT ALL ON niv_strategies TO service_role;

GRANT ALL ON niv_strategy_executions TO anon;
GRANT ALL ON niv_strategy_executions TO authenticated;
GRANT ALL ON niv_strategy_executions TO service_role;

GRANT ALL ON niv_strategy_versions TO anon;
GRANT ALL ON niv_strategy_versions TO authenticated;
GRANT ALL ON niv_strategy_versions TO service_role;

GRANT ALL ON niv_strategy_collaborators TO anon;
GRANT ALL ON niv_strategy_collaborators TO authenticated;
GRANT ALL ON niv_strategy_collaborators TO service_role;

-- Also grant usage on sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;