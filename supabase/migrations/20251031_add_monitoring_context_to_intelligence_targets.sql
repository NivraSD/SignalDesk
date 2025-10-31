-- Add monitoring_context field to intelligence_targets table
-- This field explains WHY we're monitoring this target and WHAT makes it strategically relevant

ALTER TABLE intelligence_targets
ADD COLUMN IF NOT EXISTS monitoring_context TEXT;

COMMENT ON COLUMN intelligence_targets.monitoring_context IS
'Strategic context for why this target is being monitored. Examples:
- For competitor "Edelman": "Direct PR firm competitor - monitor for client wins, leadership changes, strategic positioning"
- For stakeholder "SEC": "Monitor SEC communications regulations affecting PR industry, not general enforcement"
- For topic "Crisis Communications": "Track major corporate crises creating demand for KARV services"';

-- Add relevance_filter field to specify what types of news are actually relevant
ALTER TABLE intelligence_targets
ADD COLUMN IF NOT EXISTS relevance_filter JSONB;

COMMENT ON COLUMN intelligence_targets.relevance_filter IS
'Filter criteria for determining if news about this target is strategically relevant. Structure:
{
  "include_patterns": ["crisis communications", "reputation management", "PR industry"],
  "exclude_patterns": ["general financial enforcement", "unrelated industries"],
  "strategic_angle": "How does this impact our narrative/positioning/reputation?"
}';

-- Add industry_context to help with entity disambiguation
ALTER TABLE intelligence_targets
ADD COLUMN IF NOT EXISTS industry_context TEXT;

COMMENT ON COLUMN intelligence_targets.industry_context IS
'Industry context to help disambiguate entities. For "Ketchum" this would be "PR & Communications" to avoid matching "Ketchum, Idaho"';
