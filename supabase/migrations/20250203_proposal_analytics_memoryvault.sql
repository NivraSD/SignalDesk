-- Proposal Analytics for Memory Vault (content_library)
-- These functions query proposals stored in content_library with folder='proposals'

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- Win rate analytics by industry and proposal type
CREATE OR REPLACE VIEW proposal_analytics_mv AS
SELECT
    organization_id,
    metadata->'proposalMetadata'->>'industry' as industry,
    metadata->'proposalMetadata'->>'proposalType' as proposal_type,
    COUNT(*) as total_proposals,
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'won') as wins,
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'lost') as losses,
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'pending') as pending,
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' IN ('no_decision', 'unknown')) as undecided,
    ROUND(
        (COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' IN ('won', 'lost')), 0)) * 100,
        2
    ) as win_rate_percent,
    MAX(created_at) as most_recent_date,
    MIN(created_at) as earliest_date
FROM content_library
WHERE folder = 'proposals'
  AND content_type = 'proposal'
  AND metadata->'proposalMetadata' IS NOT NULL
GROUP BY organization_id, metadata->'proposalMetadata'->>'industry', metadata->'proposalMetadata'->>'proposalType';

-- Overall organization performance
CREATE OR REPLACE VIEW proposal_org_summary_mv AS
SELECT
    organization_id,
    COUNT(*) as total_proposals,
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'won') as total_wins,
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'lost') as total_losses,
    ROUND(
        (COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' IN ('won', 'lost')), 0)) * 100,
        2
    ) as overall_win_rate_percent,
    COUNT(DISTINCT metadata->'proposalMetadata'->>'industry') as industries_served,
    array_agg(DISTINCT metadata->'proposalMetadata'->>'industry') FILTER (WHERE metadata->'proposalMetadata'->>'industry' IS NOT NULL) as all_industries
FROM content_library
WHERE folder = 'proposals'
  AND content_type = 'proposal'
  AND metadata->'proposalMetadata' IS NOT NULL
GROUP BY organization_id;

-- Key differentiators performance analysis
CREATE OR REPLACE VIEW proposal_differentiator_performance_mv AS
WITH differentiators AS (
    SELECT
        organization_id,
        metadata->'proposalMetadata'->>'outcome' as outcome,
        jsonb_array_elements_text(metadata->'proposalMetadata'->'keyDifferentiators') as differentiator
    FROM content_library
    WHERE folder = 'proposals'
      AND content_type = 'proposal'
      AND metadata->'proposalMetadata'->'keyDifferentiators' IS NOT NULL
)
SELECT
    organization_id,
    differentiator,
    COUNT(*) as times_used,
    COUNT(*) FILTER (WHERE outcome = 'won') as wins,
    COUNT(*) FILTER (WHERE outcome = 'lost') as losses,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE outcome IN ('won', 'lost')), 0)) * 100,
        1
    ) as win_rate_when_used_percent
FROM differentiators
GROUP BY organization_id, differentiator
HAVING COUNT(*) >= 2  -- Only show differentiators used at least twice
ORDER BY win_rate_when_used_percent DESC NULLS LAST;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to find similar proposals based on industry and services
CREATE OR REPLACE FUNCTION find_similar_proposals_mv(
    p_organization_id TEXT,
    p_industry TEXT,
    p_services_offered TEXT[],
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    client_name TEXT,
    industry TEXT,
    outcome TEXT,
    created_at TIMESTAMPTZ,
    match_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH proposal_data AS (
        SELECT
            cl.id,
            cl.title,
            cl.metadata->'proposalMetadata'->>'clientName' as client_name,
            cl.metadata->'proposalMetadata'->>'industry' as industry,
            cl.metadata->'proposalMetadata'->>'outcome' as outcome,
            cl.metadata->'proposalMetadata'->'servicesOffered' as services_jsonb,
            cl.created_at
        FROM content_library cl
        WHERE cl.folder = 'proposals'
          AND cl.content_type = 'proposal'
          AND cl.organization_id = p_organization_id
          AND cl.metadata->'proposalMetadata' IS NOT NULL
    ),
    scored_proposals AS (
        SELECT
            pd.*,
            (
                -- Industry match: 50 points
                CASE WHEN pd.industry = p_industry THEN 50 ELSE 0 END +
                -- Services overlap: up to 50 points
                (
                    SELECT COUNT(*)::NUMERIC * 50.0 / NULLIF(array_length(p_services_offered, 1), 0)
                    FROM jsonb_array_elements_text(pd.services_jsonb) s
                    WHERE s = ANY(p_services_offered)
                )
            ) as match_score
        FROM proposal_data pd
        WHERE pd.industry = p_industry
           OR EXISTS (
               SELECT 1
               FROM jsonb_array_elements_text(pd.services_jsonb) s
               WHERE s = ANY(p_services_offered)
           )
    )
    SELECT
        sp.id,
        sp.title,
        sp.client_name,
        sp.industry,
        sp.outcome,
        sp.created_at,
        sp.match_score
    FROM scored_proposals sp
    WHERE sp.match_score > 0
    ORDER BY sp.match_score DESC, sp.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- HELPER FUNCTION: Get Proposal by ID
-- ========================================

CREATE OR REPLACE FUNCTION get_proposal_by_id_mv(p_proposal_id TEXT)
RETURNS TABLE (
    id TEXT,
    organization_id TEXT,
    title TEXT,
    content TEXT,
    file_url TEXT,
    metadata JSONB,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cl.id,
        cl.organization_id,
        cl.title,
        cl.content,
        cl.file_url,
        cl.metadata,
        cl.tags,
        cl.created_at,
        cl.updated_at
    FROM content_library cl
    WHERE cl.id = p_proposal_id
      AND cl.folder = 'proposals'
      AND cl.content_type = 'proposal';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON VIEW proposal_analytics_mv IS 'Win rate and performance metrics by industry and proposal type (from content_library)';
COMMENT ON VIEW proposal_org_summary_mv IS 'Overall organization proposal performance summary (from content_library)';
COMMENT ON VIEW proposal_differentiator_performance_mv IS 'Key differentiator performance analysis (from content_library)';
COMMENT ON FUNCTION find_similar_proposals_mv IS 'Find proposals similar to given criteria based on industry and services (from content_library)';
COMMENT ON FUNCTION get_proposal_by_id_mv IS 'Get full proposal data by ID (from content_library)';

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Proposal analytics for Memory Vault created successfully!';
    RAISE NOTICE 'Created: 3 analytics views (proposal_analytics_mv, proposal_org_summary_mv, proposal_differentiator_performance_mv)';
    RAISE NOTICE 'Created: 2 helper functions (find_similar_proposals_mv, get_proposal_by_id_mv)';
    RAISE NOTICE 'All proposals now stored in content_library with folder="proposals"';
END $$;
