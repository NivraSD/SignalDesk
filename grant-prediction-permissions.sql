-- Grant proper permissions to prediction tables
-- Run this in Supabase SQL Editor

-- Grant anon role SELECT access to patterns (public read)
GRANT SELECT ON stakeholder_patterns TO anon;
GRANT SELECT ON stakeholder_patterns TO authenticated;

-- Grant authenticated users access to other tables (controlled by RLS)
GRANT ALL ON stakeholder_profiles TO authenticated;
GRANT ALL ON stakeholder_predictions TO authenticated;
GRANT ALL ON stakeholder_action_history TO authenticated;
GRANT ALL ON prediction_metrics TO authenticated;

-- Grant usage on sequences if any
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Permissions granted!' as status;
