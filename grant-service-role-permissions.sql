-- Grant service_role full access to prediction tables
-- Edge functions need this to work properly
-- Run this in Supabase SQL Editor

GRANT ALL ON stakeholder_profiles TO service_role;
GRANT ALL ON stakeholder_predictions TO service_role;
GRANT ALL ON stakeholder_patterns TO service_role;
GRANT ALL ON stakeholder_action_history TO service_role;
GRANT ALL ON prediction_metrics TO service_role;

-- Also grant to anon for read operations
GRANT SELECT ON stakeholder_profiles TO anon;
GRANT SELECT ON stakeholder_predictions TO anon;

SELECT 'Service role permissions granted!' as status;
