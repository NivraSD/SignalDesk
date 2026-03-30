-- Business Development Proposals Table
-- Purpose: Track proposal history, outcomes, and enable intelligent retrieval for future proposals

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- PROPOSALS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,

    -- Core identification
    title TEXT NOT NULL,
    client_name TEXT,
    industry TEXT NOT NULL,
    sector TEXT, -- More specific than industry (e.g., "Commercial Banking" within "Financial Services")

    -- Proposal details
    proposal_type TEXT NOT NULL CHECK (proposal_type IN (
        'new_business',
        'renewal',
        'rfp_response',
        'unsolicited_pitch',
        'partnership',
        'other'
    )),
    services_offered TEXT[] DEFAULT '{}', -- Array of services proposed
    deal_value_range TEXT CHECK (deal_value_range IN (
        'under_50k',
        '50k_100k',
        '100k_250k',
        '250k_500k',
        '500k_1m',
        '1m_5m',
        '5m_plus',
        'unknown'
    )),

    -- Content & structure
    file_path TEXT, -- Path to uploaded proposal file in storage
    file_type TEXT, -- pdf, docx, etc.
    file_size_bytes BIGINT,
    proposal_sections JSONB DEFAULT '{}', -- { "executive_summary": "...", "technical_approach": "...", etc. }
    key_differentiators TEXT[] DEFAULT '{}', -- What made this unique

    -- Outcome tracking
    outcome TEXT DEFAULT 'unknown' CHECK (outcome IN (
        'won',
        'lost',
        'pending',
        'no_decision',
        'unknown'
    )),
    outcome_date TIMESTAMPTZ,
    outcome_notes TEXT, -- Why won/lost, lessons learned
    win_probability INTEGER CHECK (win_probability >= 0 AND win_probability <= 100),

    -- Context & intelligence
    competitive_landscape JSONB DEFAULT '{}', -- { "competitors": ["Company A", "Company B"], "why_we_won": "...", "why_we_lost": "..." }
    client_requirements JSONB DEFAULT '{}', -- Specific requirements they had
    decision_criteria JSONB DEFAULT '{}', -- What they cared about most
    pricing_strategy TEXT, -- Brief description of how we priced it

    -- Important dates
    proposal_date TIMESTAMPTZ DEFAULT NOW(),
    submission_deadline TIMESTAMPTZ,
    decision_date TIMESTAMPTZ,

    -- Team & collaboration
    team_members TEXT[] DEFAULT '{}', -- Who worked on this proposal

    -- Memory Vault integration (for future use when Memory Vault v2 is deployed)
    memory_vault_id UUID, -- Link to Memory Vault entry
    -- embeddings vector(1536), -- For semantic search (commented out until vector extension confirmed)

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    notes TEXT, -- Internal notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,

    -- Constraints
    CONSTRAINT valid_dates CHECK (
        (submission_deadline IS NULL OR proposal_date <= submission_deadline) AND
        (decision_date IS NULL OR proposal_date <= decision_date)
    )
);

-- ========================================
-- INDEXES
-- ========================================

-- Core lookup indexes
CREATE INDEX idx_proposals_org_id ON proposals(organization_id);
CREATE INDEX idx_proposals_org_industry ON proposals(organization_id, industry);
CREATE INDEX idx_proposals_org_outcome ON proposals(organization_id, outcome, outcome_date DESC NULLS LAST);
CREATE INDEX idx_proposals_org_type ON proposals(organization_id, proposal_type);

-- Array column indexes (GIN for array searching)
CREATE INDEX idx_proposals_services ON proposals USING GIN(services_offered);
CREATE INDEX idx_proposals_differentiators ON proposals USING GIN(key_differentiators);
CREATE INDEX idx_proposals_tags ON proposals USING GIN(tags);
CREATE INDEX idx_proposals_team ON proposals USING GIN(team_members);

-- JSONB indexes
CREATE INDEX idx_proposals_sections ON proposals USING GIN(proposal_sections);
CREATE INDEX idx_proposals_competitive ON proposals USING GIN(competitive_landscape);

-- Date indexes for time-based queries
CREATE INDEX idx_proposals_proposal_date ON proposals(proposal_date DESC);
CREATE INDEX idx_proposals_outcome_date ON proposals(outcome_date DESC NULLS LAST);

-- Vector similarity search index (IVFFlat for large datasets)
-- Note: Uncomment when vector embeddings are enabled
-- CREATE INDEX idx_proposals_embeddings ON proposals
--     USING ivfflat(embeddings vector_cosine_ops)
--     WITH (lists = 100);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Note: RLS will be enabled when using Supabase Auth
-- For now, access control should be handled at the application level
-- ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Future RLS policy (enable when using Supabase Auth):
-- CREATE POLICY proposals_org_access ON proposals
--     FOR ALL
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proposals_timestamp
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_proposals_updated_at();

-- ========================================
-- MEMORY VAULT SYNC TRIGGER
-- ========================================

-- Note: Memory Vault sync will be added when Memory Vault v2 is deployed
-- For now, proposals table is standalone

-- Future: CREATE TRIGGER sync_proposal_to_memory_vault_trigger
--     BEFORE INSERT OR UPDATE ON proposals
--     FOR EACH ROW
--     EXECUTE FUNCTION sync_proposal_to_memory_vault();

-- ========================================
-- ANALYTICS VIEWS
-- ========================================

-- Win rate analytics by industry and proposal type
CREATE OR REPLACE VIEW proposal_analytics AS
SELECT
    organization_id,
    industry,
    proposal_type,
    COUNT(*) as total_proposals,
    COUNT(*) FILTER (WHERE outcome = 'won') as wins,
    COUNT(*) FILTER (WHERE outcome = 'lost') as losses,
    COUNT(*) FILTER (WHERE outcome = 'pending') as pending,
    COUNT(*) FILTER (WHERE outcome IN ('no_decision', 'unknown')) as undecided,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE outcome IN ('won', 'lost')), 0)) * 100,
        2
    ) as win_rate_percent,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (decision_date - proposal_date)) / 86400.0)
        FILTER (WHERE decision_date IS NOT NULL AND outcome IN ('won', 'lost')),
        1
    ) as avg_decision_time_days,
    MAX(outcome_date) as most_recent_outcome_date,
    MIN(proposal_date) as earliest_proposal_date,
    MAX(proposal_date) as latest_proposal_date
FROM proposals
GROUP BY organization_id, industry, proposal_type;

-- Overall organization performance
CREATE OR REPLACE VIEW proposal_org_summary AS
SELECT
    organization_id,
    COUNT(*) as total_proposals,
    COUNT(*) FILTER (WHERE outcome = 'won') as total_wins,
    COUNT(*) FILTER (WHERE outcome = 'lost') as total_losses,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE outcome IN ('won', 'lost')), 0)) * 100,
        2
    ) as overall_win_rate_percent,
    COUNT(DISTINCT industry) as industries_served,
    array_agg(DISTINCT industry) as all_industries,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (decision_date - proposal_date)) / 86400.0)
        FILTER (WHERE decision_date IS NOT NULL),
        1
    ) as avg_decision_time_days
FROM proposals
GROUP BY organization_id;

-- Key differentiators performance analysis
CREATE OR REPLACE VIEW proposal_differentiator_performance AS
SELECT
    organization_id,
    unnest(key_differentiators) as differentiator,
    COUNT(*) as times_used,
    COUNT(*) FILTER (WHERE outcome = 'won') as wins,
    COUNT(*) FILTER (WHERE outcome = 'lost') as losses,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome = 'won')::NUMERIC /
         NULLIF(COUNT(*) FILTER (WHERE outcome IN ('won', 'lost')), 0)) * 100,
        1
    ) as win_rate_when_used_percent
FROM proposals
WHERE key_differentiators IS NOT NULL AND array_length(key_differentiators, 1) > 0
GROUP BY organization_id, differentiator
HAVING COUNT(*) >= 2  -- Only show differentiators used at least twice
ORDER BY win_rate_when_used_percent DESC NULLS LAST;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get similar proposals based on industry and services
CREATE OR REPLACE FUNCTION find_similar_proposals(
    p_organization_id UUID,
    p_industry TEXT,
    p_services_offered TEXT[],
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    client_name TEXT,
    industry TEXT,
    outcome TEXT,
    proposal_date TIMESTAMPTZ,
    match_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.client_name,
        p.industry,
        p.outcome,
        p.proposal_date,
        -- Simple match score: industry match (50 points) + service overlap (up to 50 points)
        (
            CASE WHEN p.industry = p_industry THEN 50 ELSE 0 END +
            (
                -- Count overlapping services
                SELECT COUNT(*)::NUMERIC * 50.0 / NULLIF(array_length(p_services_offered, 1), 0)
                FROM unnest(p.services_offered) s
                WHERE s = ANY(p_services_offered)
            )
        ) as match_score
    FROM proposals p
    WHERE p.organization_id = p_organization_id
    AND (
        p.industry = p_industry
        OR p.services_offered && p_services_offered  -- Array overlap operator
    )
    ORDER BY match_score DESC, p.proposal_date DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Note: Permissions will be granted to appropriate roles when using Supabase
-- For direct PostgreSQL access, default permissions apply

-- Future grants (when using Supabase):
-- GRANT ALL ON proposals TO authenticated;
-- GRANT SELECT ON proposal_analytics TO authenticated;
-- GRANT SELECT ON proposal_org_summary TO authenticated;
-- GRANT SELECT ON proposal_differentiator_performance TO authenticated;
-- GRANT EXECUTE ON FUNCTION find_similar_proposals TO authenticated;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE proposals IS 'Business development proposals with outcome tracking for intelligent retrieval and learning';
COMMENT ON COLUMN proposals.outcome IS 'Proposal outcome: won (secured business), lost (competitor won), pending (awaiting decision), no_decision (client did not proceed), unknown (not tracked)';
COMMENT ON COLUMN proposals.key_differentiators IS 'Unique value propositions or capabilities that made this proposal distinctive';
COMMENT ON COLUMN proposals.competitive_landscape IS 'JSON object with competitors array and win/loss reasons';
COMMENT ON COLUMN proposals.memory_vault_id IS 'Reference to the Memory Vault entry (auto-populated by trigger)';
COMMENT ON VIEW proposal_analytics IS 'Win rate and performance metrics by industry and proposal type';
COMMENT ON FUNCTION find_similar_proposals IS 'Find proposals similar to given criteria based on industry and services';

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Proposals table created successfully!';
    RAISE NOTICE 'Created: proposals table with RLS policies';
    RAISE NOTICE 'Created: Memory Vault sync trigger';
    RAISE NOTICE 'Created: Analytics views (proposal_analytics, proposal_org_summary, proposal_differentiator_performance)';
    RAISE NOTICE 'Created: Helper function find_similar_proposals()';
    RAISE NOTICE 'Next steps: Add proposal content types to TypeScript and build upload flow';
END $$;
