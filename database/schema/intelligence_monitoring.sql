-- Intelligence Monitoring Database Schema
-- Optimized for SignalDesk Platform
-- Using best practices from database-optimization agent

-- ============================================
-- CORE ENTITIES
-- ============================================

-- Organizations (your clients)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    industry VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    INDEX idx_org_industry (industry),
    INDEX idx_org_created (created_at DESC)
);

-- Intelligence Targets (competitors, topics, etc.)
CREATE TABLE intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('competitor', 'topic', 'influencer', 'keyword')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    threat_level INTEGER DEFAULT 50 CHECK (threat_level >= 0 AND threat_level <= 100),
    keywords TEXT[], -- Array of keywords to monitor
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible additional data
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_targets_org (organization_id),
    INDEX idx_targets_type (type),
    INDEX idx_targets_active (active),
    INDEX idx_targets_priority (priority, threat_level DESC)
);

-- Monitoring Sources
CREATE TABLE monitoring_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL, -- 'news', 'social', 'academic', 'financial', etc.
    source_name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    api_endpoint VARCHAR(500),
    frequency VARCHAR(20) DEFAULT 'daily', -- 'real-time', 'hourly', 'daily', 'weekly'
    credentials_encrypted TEXT, -- Encrypted API keys/credentials
    active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    next_check TIMESTAMP,
    error_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sources_target (target_id),
    INDEX idx_sources_active_next (active, next_check),
    INDEX idx_sources_type (source_type)
);

-- ============================================
-- INTELLIGENCE DATA
-- ============================================

-- Raw intelligence findings
CREATE TABLE intelligence_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    source_id UUID REFERENCES monitoring_sources(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    url VARCHAR(500),
    author VARCHAR(255),
    published_at TIMESTAMP,
    sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    importance VARCHAR(20) DEFAULT 'medium' CHECK (importance IN ('critical', 'high', 'medium', 'low')),
    finding_type VARCHAR(50), -- 'news', 'announcement', 'analysis', 'opinion', etc.
    extracted_entities JSONB DEFAULT '[]'::jsonb, -- Named entities
    keywords_matched TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_findings_target (target_id),
    INDEX idx_findings_date (published_at DESC),
    INDEX idx_findings_importance (importance, relevance_score DESC),
    INDEX idx_findings_processed (processed, created_at),
    INDEX idx_findings_sentiment (sentiment_score)
);

-- ============================================
-- OPPORTUNITY DETECTION
-- ============================================

-- Identified opportunities (using NVS and other algorithms)
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    opportunity_type VARCHAR(50) NOT NULL, -- 'thought_leadership', 'competitive_response', 'market_gap', etc.
    nvs_score DECIMAL(5,2), -- Narrative Vacuum Score
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('immediate', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'identified' CHECK (status IN ('identified', 'analyzing', 'actioned', 'dismissed')),
    supporting_findings UUID[], -- Array of intelligence_findings IDs
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_opportunities_org (organization_id),
    INDEX idx_opportunities_status (status),
    INDEX idx_opportunities_nvs (nvs_score DESC),
    INDEX idx_opportunities_urgency (urgency, expires_at)
);

-- ============================================
-- RESEARCH & ANALYSIS
-- ============================================

-- Research projects (using deep research team)
CREATE TABLE research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    clarified_query TEXT,
    research_type VARCHAR(50), -- 'competitor_analysis', 'topic_research', 'opportunity_validation'
    status VARCHAR(20) DEFAULT 'queued',
    coordinator_plan JSONB, -- Research coordinator's task allocation
    synthesized_findings JSONB, -- Research synthesizer's output
    final_report TEXT, -- Report generator's output
    quality_metrics JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_research_org (organization_id),
    INDEX idx_research_status (status),
    INDEX idx_research_created (created_at DESC)
);

-- ============================================
-- ANALYTICS & METRICS
-- ============================================

-- Track performance metrics
CREATE TABLE monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    target_id UUID REFERENCES intelligence_targets(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    findings_count INTEGER DEFAULT 0,
    opportunities_identified INTEGER DEFAULT 0,
    average_relevance DECIMAL(3,2),
    average_sentiment DECIMAL(3,2),
    source_coverage DECIMAL(3,2), -- Percentage of sources returning data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, target_id, metric_date),
    INDEX idx_metrics_date (metric_date DESC),
    INDEX idx_metrics_org_date (organization_id, metric_date DESC)
);

-- ============================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================

-- Competitor activity summary (refreshed hourly)
CREATE MATERIALIZED VIEW competitor_activity_summary AS
SELECT 
    it.organization_id,
    it.id as target_id,
    it.name as competitor_name,
    COUNT(DISTINCT if.id) as total_findings_24h,
    AVG(if.sentiment_score) as avg_sentiment,
    MAX(if.relevance_score) as max_relevance,
    COUNT(DISTINCT CASE WHEN if.importance IN ('critical', 'high') THEN if.id END) as high_importance_count,
    MAX(if.published_at) as latest_activity,
    array_agg(DISTINCT if.finding_type) as activity_types
FROM intelligence_targets it
LEFT JOIN intelligence_findings if ON it.id = if.target_id 
    AND if.published_at > NOW() - INTERVAL '24 hours'
WHERE it.type = 'competitor'
GROUP BY it.organization_id, it.id, it.name;

CREATE INDEX idx_comp_activity_org ON competitor_activity_summary(organization_id);

-- Topic trending analysis (refreshed every 4 hours)
CREATE MATERIALIZED VIEW topic_trends AS
SELECT 
    it.organization_id,
    it.id as target_id,
    it.name as topic_name,
    DATE(if.published_at) as trend_date,
    COUNT(*) as mention_count,
    AVG(if.sentiment_score) as avg_sentiment,
    AVG(if.relevance_score) as avg_relevance,
    COUNT(*) - LAG(COUNT(*), 1, 0) OVER (
        PARTITION BY it.id ORDER BY DATE(if.published_at)
    ) as daily_change
FROM intelligence_targets it
JOIN intelligence_findings if ON it.id = if.target_id
WHERE it.type = 'topic' 
    AND if.published_at > NOW() - INTERVAL '30 days'
GROUP BY it.organization_id, it.id, it.name, DATE(if.published_at);

CREATE INDEX idx_topic_trends_org ON topic_trends(organization_id, trend_date DESC);

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Calculate Narrative Vacuum Score
CREATE OR REPLACE FUNCTION calculate_nvs(
    p_topic_id UUID,
    p_time_window INTERVAL DEFAULT '7 days'
) RETURNS DECIMAL AS $$
DECLARE
    v_media_demand DECIMAL;
    v_competitor_absence DECIMAL;
    v_client_strength DECIMAL;
    v_time_decay DECIMAL;
    v_market_saturation DECIMAL;
    v_nvs_score DECIMAL;
BEGIN
    -- Calculate media demand (volume of mentions)
    SELECT COUNT(*)::DECIMAL / 100 INTO v_media_demand
    FROM intelligence_findings
    WHERE target_id = p_topic_id 
        AND published_at > NOW() - p_time_window;
    
    -- Calculate competitor absence (inverse of competitor activity)
    SELECT 1 - (COUNT(*)::DECIMAL / 100) INTO v_competitor_absence
    FROM intelligence_findings if
    JOIN intelligence_targets it ON if.target_id = it.id
    WHERE it.type = 'competitor'
        AND if.published_at > NOW() - p_time_window
        AND EXISTS (
            SELECT 1 FROM intelligence_targets topic 
            WHERE topic.id = p_topic_id 
                AND topic.organization_id = it.organization_id
        );
    
    -- Set default values
    v_client_strength := 0.5; -- Would be calculated from client's historical performance
    v_time_decay := 0.8; -- Recent topics score higher
    v_market_saturation := 0.3; -- Lower saturation = higher opportunity
    
    -- Calculate NVS
    v_nvs_score := (
        (v_media_demand * 0.25) +
        (v_competitor_absence * 0.25) +
        (v_client_strength * 0.20) +
        (v_time_decay * 0.15) +
        ((1 - v_market_saturation) * 0.15)
    ) * 100;
    
    RETURN v_nvs_score;
END;
$$ LANGUAGE plpgsql;

-- Auto-identify opportunities
CREATE OR REPLACE FUNCTION identify_opportunities() RETURNS void AS $$
DECLARE
    v_finding RECORD;
    v_nvs_score DECIMAL;
BEGIN
    -- Loop through recent high-relevance findings
    FOR v_finding IN 
        SELECT DISTINCT ON (it.id) 
            it.id as target_id,
            it.organization_id,
            if.title,
            if.id as finding_id
        FROM intelligence_findings if
        JOIN intelligence_targets it ON if.target_id = it.id
        WHERE if.processed = false
            AND if.relevance_score > 0.7
            AND if.published_at > NOW() - INTERVAL '24 hours'
        ORDER BY it.id, if.relevance_score DESC
    LOOP
        -- Calculate NVS for this topic
        v_nvs_score := calculate_nvs(v_finding.target_id);
        
        -- If NVS is high enough, create an opportunity
        IF v_nvs_score > 60 THEN
            INSERT INTO opportunities (
                organization_id,
                title,
                opportunity_type,
                nvs_score,
                confidence_score,
                urgency,
                supporting_findings
            ) VALUES (
                v_finding.organization_id,
                'Opportunity: ' || v_finding.title,
                'narrative_vacuum',
                v_nvs_score,
                0.7,
                CASE 
                    WHEN v_nvs_score > 80 THEN 'high'
                    WHEN v_nvs_score > 70 THEN 'medium'
                    ELSE 'low'
                END,
                ARRAY[v_finding.finding_id]
            );
        END IF;
        
        -- Mark finding as processed
        UPDATE intelligence_findings 
        SET processed = true 
        WHERE id = v_finding.finding_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule opportunity identification every hour
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('identify-opportunities', '0 * * * *', 'SELECT identify_opportunities();');