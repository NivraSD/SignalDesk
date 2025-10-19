-- Intelligence Pre-Index Database Schema
-- This creates a comprehensive intelligence database for pre-indexed industries, companies, topics, and sources

-- Industries table (top 15 key industries)
CREATE TABLE IF NOT EXISTS industries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    market_size_billions DECIMAL(10,2),
    growth_rate_percent DECIMAL(5,2),
    key_trends TEXT[],
    regulatory_bodies TEXT[],
    major_publications TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table (top 15 companies per industry)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    industry_id INTEGER REFERENCES industries(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    ticker_symbol VARCHAR(10),
    website_url VARCHAR(500),
    headquarters_location VARCHAR(200),
    employee_count INTEGER,
    revenue_billions DECIMAL(10,2),
    market_cap_billions DECIMAL(10,2),
    description TEXT,
    key_products TEXT[],
    key_executives JSONB,
    competitor_ids INTEGER[],
    ranking_in_industry INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(industry_id, name)
);

-- Topics table (top 15 topics per industry)
CREATE TABLE IF NOT EXISTS industry_topics (
    id SERIAL PRIMARY KEY,
    industry_id INTEGER REFERENCES industries(id) ON DELETE CASCADE,
    topic_name VARCHAR(200) NOT NULL,
    topic_category VARCHAR(50), -- 'regulation', 'technology', 'market', 'social', 'economic'
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    is_trending BOOLEAN DEFAULT FALSE,
    description TEXT,
    keywords TEXT[],
    related_regulations TEXT[],
    impact_areas TEXT[],
    monitoring_frequency VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'weekly'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(industry_id, topic_name)
);

-- Sources table (verified sources for monitoring)
CREATE TABLE IF NOT EXISTS intelligence_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(200) NOT NULL,
    source_url VARCHAR(500) UNIQUE NOT NULL,
    source_type VARCHAR(50), -- 'news', 'rss', 'api', 'social', 'regulatory', 'trade', 'research'
    content_type VARCHAR(50), -- 'articles', 'reports', 'filings', 'posts', 'data'
    api_endpoint VARCHAR(500),
    rss_feed_url VARCHAR(500),
    authentication_required BOOLEAN DEFAULT FALSE,
    api_key_required BOOLEAN DEFAULT FALSE,
    rate_limit_per_hour INTEGER,
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    is_verified BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Industry-Source mapping (which sources are best for which industries)
CREATE TABLE IF NOT EXISTS industry_sources (
    id SERIAL PRIMARY KEY,
    industry_id INTEGER REFERENCES industries(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES intelligence_sources(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    coverage_areas TEXT[],
    keywords_to_monitor TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(industry_id, source_id)
);

-- Company-Source mapping (specific sources for specific companies)
CREATE TABLE IF NOT EXISTS company_sources (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES intelligence_sources(id) ON DELETE CASCADE,
    source_priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    specific_urls TEXT[],
    specific_keywords TEXT[],
    executive_social_handles JSONB,
    investor_relations_url VARCHAR(500),
    press_release_feed VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, source_id)
);

-- Topic-Source mapping (which sources best cover which topics)
CREATE TABLE IF NOT EXISTS topic_sources (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES industry_topics(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES intelligence_sources(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2),
    specific_sections TEXT[],
    expert_authors TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, source_id)
);

-- Source discovery cache (for API responses)
CREATE TABLE IF NOT EXISTS source_discovery_cache (
    id SERIAL PRIMARY KEY,
    query VARCHAR(500),
    api_source VARCHAR(50),
    results TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-indexed stakeholders (commonly monitored entities)
CREATE TABLE IF NOT EXISTS pre_indexed_stakeholders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    type VARCHAR(50), -- 'company', 'regulator', 'media', 'influencer', 'organization'
    industry_id INTEGER REFERENCES industries(id),
    description TEXT,
    aliases TEXT[],
    verified_sources JSONB,
    social_handles JSONB,
    key_topics TEXT[],
    monitoring_priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stakeholder groups (for organization-specific monitoring)
CREATE TABLE IF NOT EXISTS stakeholder_groups (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(100),
    name VARCHAR(200),
    type VARCHAR(50),
    priority VARCHAR(20),
    reason TEXT,
    influence INTEGER,
    is_pre_indexed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stakeholder monitoring topics
CREATE TABLE IF NOT EXISTS stakeholder_monitoring_topics (
    id SERIAL PRIMARY KEY,
    stakeholder_group_id INTEGER REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
    topic VARCHAR(200),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stakeholder sources
CREATE TABLE IF NOT EXISTS stakeholder_sources (
    id SERIAL PRIMARY KEY,
    stakeholder_group_id INTEGER REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
    name VARCHAR(200),
    url VARCHAR(500),
    type VARCHAR(50),
    extraction_method VARCHAR(50),
    rss_feed_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMP,
    check_frequency_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence findings (actual discovered intelligence)
CREATE TABLE IF NOT EXISTS intelligence_findings (
    id SERIAL PRIMARY KEY,
    stakeholder_group_id INTEGER REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
    stakeholder_source_id INTEGER REFERENCES stakeholder_sources(id) ON DELETE SET NULL,
    title VARCHAR(500),
    content TEXT,
    url VARCHAR(500),
    type VARCHAR(50),
    sentiment_score DECIMAL(3,2),
    relevance_score DECIMAL(3,2),
    priority VARCHAR(20),
    published_at TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

-- Stakeholder predictions
CREATE TABLE IF NOT EXISTS stakeholder_predictions (
    id SERIAL PRIMARY KEY,
    stakeholder_group_id INTEGER REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
    prediction TEXT,
    confidence_score DECIMAL(3,2),
    predicted_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    url VARCHAR(500),
    industry VARCHAR(100),
    type VARCHAR(50),
    strategic_goals TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_companies_industry ON companies(industry_id);
CREATE INDEX idx_industry_topics_industry ON industry_topics(industry_id);
CREATE INDEX idx_industry_sources_industry ON industry_sources(industry_id);
CREATE INDEX idx_company_sources_company ON company_sources(company_id);
CREATE INDEX idx_topic_sources_topic ON topic_sources(topic_id);
CREATE INDEX idx_intelligence_findings_stakeholder ON intelligence_findings(stakeholder_group_id);
CREATE INDEX idx_source_discovery_cache_query ON source_discovery_cache(query);
CREATE INDEX idx_source_discovery_cache_expires ON source_discovery_cache(expires_at);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_industries_updated_at BEFORE UPDATE ON industries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_topics_updated_at BEFORE UPDATE ON industry_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intelligence_sources_updated_at BEFORE UPDATE ON intelligence_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();