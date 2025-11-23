-- Batch Scraping Architecture
-- Centralized article collection, processing, and distribution system
-- Scrape once, serve many: articles shared across organizations by industry

-- ============================================================================
-- TABLE 1: source_registry
-- Master list of all sources we monitor (RSS feeds, websites, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source Info
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_type VARCHAR(50) NOT NULL, -- 'rss_feed', 'website', 'company_page', 'press_release'

  -- Classification
  industries TEXT[], -- ['technology', 'finance', 'healthcare']
  topics TEXT[], -- ['m&a', 'leadership', 'regulatory']
  tier INTEGER NOT NULL DEFAULT 2, -- 1=premium (Bloomberg, WSJ), 2=standard, 3=supplemental

  -- Monitoring Config
  scrape_frequency_hours INTEGER DEFAULT 6, -- How often to check this source
  monitor_method VARCHAR(50) DEFAULT 'firecrawl_observer', -- 'firecrawl_observer', 'rss', 'sitemap'
  monitor_config JSONB, -- Method-specific config (selectors, etc.)

  -- Quality Metrics
  reliability_score INTEGER DEFAULT 50, -- 0-100, based on consistent quality
  avg_articles_per_day DECIMAL(10,2),
  last_successful_scrape TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN DEFAULT true,
  added_by VARCHAR(50) DEFAULT 'system', -- 'system' or organization_id

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_source_type CHECK (source_type IN ('rss_feed', 'website', 'company_page', 'press_release', 'social_media')),
  CONSTRAINT valid_tier CHECK (tier BETWEEN 1 AND 3)
);

CREATE INDEX idx_source_registry_industries ON source_registry USING GIN(industries);
CREATE INDEX idx_source_registry_active ON source_registry(active) WHERE active = true;
CREATE INDEX idx_source_registry_tier ON source_registry(tier);
CREATE INDEX idx_source_registry_next_scrape ON source_registry(last_successful_scrape, scrape_frequency_hours);

-- ============================================================================
-- TABLE 2: raw_articles
-- Unprocessed articles as scraped (before AI processing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  source_id UUID REFERENCES source_registry(id),
  source_name TEXT NOT NULL,

  -- Article Data
  url TEXT NOT NULL UNIQUE, -- Unique constraint for deduplication
  title TEXT NOT NULL,
  description TEXT,
  full_content TEXT, -- Full article text from Firecrawl
  author TEXT,

  -- Dates
  published_at TIMESTAMP, -- From article metadata
  scraped_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Raw Metadata
  raw_metadata JSONB, -- Everything from scraper (og tags, etc.)
  content_length INTEGER,

  -- Processing Status
  processed BOOLEAN DEFAULT false,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  processing_error TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_content_length CHECK (content_length >= 0)
);

CREATE INDEX idx_raw_articles_url ON raw_articles(url);
CREATE INDEX idx_raw_articles_source ON raw_articles(source_id);
CREATE INDEX idx_raw_articles_published ON raw_articles(published_at DESC);
CREATE INDEX idx_raw_articles_scraped ON raw_articles(scraped_at DESC);
CREATE INDEX idx_raw_articles_unprocessed ON raw_articles(processed) WHERE processed = false;
CREATE INDEX idx_raw_articles_source_published ON raw_articles(source_id, published_at DESC);

-- ============================================================================
-- TABLE 3: processed_articles
-- AI-processed, categorized, and tagged articles ready for distribution
-- ============================================================================
CREATE TABLE IF NOT EXISTS processed_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_article_id UUID REFERENCES raw_articles(id) ON DELETE CASCADE,

  -- Article Info (denormalized for fast queries)
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT, -- AI-generated summary
  source_name TEXT NOT NULL,
  published_at TIMESTAMP,

  -- AI Categorization
  primary_industry VARCHAR(100), -- 'technology', 'finance', 'healthcare', etc.
  secondary_industries TEXT[], -- Additional relevant industries
  topics TEXT[], -- ['m&a', 'leadership', 'product_launch', 'regulatory']
  event_type VARCHAR(50), -- 'acquisition', 'funding', 'executive_move', 'product_launch'

  -- Entity Extraction
  companies_mentioned TEXT[], -- All companies mentioned in article
  people_mentioned TEXT[], -- Key people mentioned
  locations TEXT[], -- Geographic mentions

  -- Sentiment & Tone
  overall_sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral', 'mixed'
  tone VARCHAR(50), -- 'breaking_news', 'analysis', 'opinion', 'press_release'

  -- Quality & Relevance
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  newsworthiness_score INTEGER CHECK (newsworthiness_score BETWEEN 0 AND 100),

  -- Searchable Content
  search_vector TSVECTOR, -- Full-text search
  keywords TEXT[], -- Extracted keywords

  -- AI Processing Metadata
  ai_model_version VARCHAR(50),
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  processing_cost_cents INTEGER, -- Track API costs

  -- Distribution Tracking
  served_to_organizations UUID[], -- Which orgs have seen this
  view_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_quality_score CHECK (quality_score >= 0 AND quality_score <= 100),
  CONSTRAINT valid_newsworthiness CHECK (newsworthiness_score >= 0 AND newsworthiness_score <= 100)
);

CREATE INDEX idx_processed_articles_industry ON processed_articles(primary_industry);
CREATE INDEX idx_processed_articles_industries ON processed_articles USING GIN(secondary_industries);
CREATE INDEX idx_processed_articles_topics ON processed_articles USING GIN(topics);
CREATE INDEX idx_processed_articles_companies ON processed_articles USING GIN(companies_mentioned);
CREATE INDEX idx_processed_articles_people ON processed_articles USING GIN(people_mentioned);
CREATE INDEX idx_processed_articles_published ON processed_articles(published_at DESC);
CREATE INDEX idx_processed_articles_quality ON processed_articles(quality_score DESC);
CREATE INDEX idx_processed_articles_search ON processed_articles USING GIN(search_vector);
CREATE INDEX idx_processed_articles_keywords ON processed_articles USING GIN(keywords);
CREATE INDEX idx_processed_articles_event_type ON processed_articles(event_type);

-- GIN index for full-text search
CREATE INDEX idx_processed_articles_fts ON processed_articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(summary, '')));

-- ============================================================================
-- TABLE 4: article_entity_mentions
-- Junction table for many-to-many article-entity relationships
-- Enables fast queries like "all articles mentioning Competitor X"
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_entity_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  processed_article_id UUID REFERENCES processed_articles(id) ON DELETE CASCADE,

  -- Entity Info
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'person', 'organization', 'product'
  entity_name TEXT NOT NULL,
  entity_canonical_name TEXT, -- Normalized version (e.g., "IBM" for "IBM Corp")

  -- Context
  mention_count INTEGER DEFAULT 1,
  mention_context TEXT, -- Sentence/paragraph where mentioned
  is_primary_subject BOOLEAN DEFAULT false, -- Is this article mainly about this entity?

  -- Relevance
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
  relationship_type VARCHAR(50), -- 'competitor', 'partner', 'customer', 'regulator'

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_entity_type CHECK (entity_type IN ('company', 'person', 'organization', 'product', 'location'))
);

CREATE INDEX idx_entity_mentions_article ON article_entity_mentions(processed_article_id);
CREATE INDEX idx_entity_mentions_entity ON article_entity_mentions(entity_name);
CREATE INDEX idx_entity_mentions_canonical ON article_entity_mentions(entity_canonical_name);
CREATE INDEX idx_entity_mentions_type ON article_entity_mentions(entity_type);
CREATE INDEX idx_entity_mentions_primary ON article_entity_mentions(is_primary_subject) WHERE is_primary_subject = true;
CREATE INDEX idx_entity_mentions_relevance ON article_entity_mentions(relevance_score DESC);

-- Composite index for fast entity lookups
CREATE INDEX idx_entity_mentions_entity_type_name ON article_entity_mentions(entity_type, entity_canonical_name);

-- ============================================================================
-- TABLE 5: batch_scrape_runs
-- Track each batch scraping execution for monitoring and debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Run Info
  run_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'targeted'
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'

  -- Scope
  sources_targeted INTEGER, -- How many sources we tried to scrape
  sources_successful INTEGER DEFAULT 0,
  sources_failed INTEGER DEFAULT 0,

  -- Results
  articles_discovered INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0, -- Truly new (not duplicates)
  articles_updated INTEGER DEFAULT 0,

  -- Performance
  duration_seconds INTEGER,
  total_cost_cents INTEGER, -- Firecrawl/API costs

  -- Errors
  error_summary JSONB, -- Array of errors encountered

  -- Metadata
  triggered_by VARCHAR(50), -- 'cron', 'user_id', 'system'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'partial'))
);

CREATE INDEX idx_batch_runs_status ON batch_scrape_runs(status);
CREATE INDEX idx_batch_runs_started ON batch_scrape_runs(started_at DESC);
CREATE INDEX idx_batch_runs_type ON batch_scrape_runs(run_type);

-- ============================================================================
-- TABLE 6: user_article_interactions
-- Track which articles have been shown to which users (prevent duplicates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_article_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  processed_article_id UUID REFERENCES processed_articles(id) ON DELETE CASCADE,

  -- Interaction Type
  interaction_type VARCHAR(50) NOT NULL, -- 'viewed', 'dismissed', 'saved', 'shared'

  -- Context
  shown_in_context VARCHAR(50), -- 'executive_summary', 'competitor_alert', 'industry_trends'
  relevance_score_at_time INTEGER, -- What was the relevance when shown

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_interaction CHECK (interaction_type IN ('viewed', 'dismissed', 'saved', 'shared', 'clicked'))
);

CREATE INDEX idx_user_interactions_org ON user_article_interactions(organization_id);
CREATE INDEX idx_user_interactions_article ON user_article_interactions(processed_article_id);
CREATE INDEX idx_user_interactions_type ON user_article_interactions(interaction_type);
CREATE INDEX idx_user_interactions_org_article ON user_article_interactions(organization_id, processed_article_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_source_registry_updated_at BEFORE UPDATE ON source_registry
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processed_articles_updated_at BEFORE UPDATE ON processed_articles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate search_vector for full-text search
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.summary, '') || ' ' ||
        COALESCE(array_to_string(NEW.keywords, ' '), '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_processed_articles_search_vector BEFORE INSERT OR UPDATE ON processed_articles
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- VIEWS: Convenient queries for common patterns
-- ============================================================================

-- Recent articles by industry
CREATE OR REPLACE VIEW recent_articles_by_industry AS
SELECT
  primary_industry,
  COUNT(*) as article_count,
  COUNT(DISTINCT source_name) as source_count,
  MAX(published_at) as latest_article,
  AVG(quality_score) as avg_quality,
  AVG(newsworthiness_score) as avg_newsworthiness
FROM processed_articles
WHERE published_at >= NOW() - INTERVAL '7 days'
GROUP BY primary_industry
ORDER BY article_count DESC;

-- Top entities by mention frequency
CREATE OR REPLACE VIEW top_mentioned_entities AS
SELECT
  entity_type,
  entity_canonical_name,
  COUNT(DISTINCT processed_article_id) as article_count,
  AVG(relevance_score) as avg_relevance,
  MAX(aem.created_at) as last_mentioned
FROM article_entity_mentions aem
JOIN processed_articles pa ON aem.processed_article_id = pa.id
WHERE pa.published_at >= NOW() - INTERVAL '30 days'
GROUP BY entity_type, entity_canonical_name
ORDER BY article_count DESC
LIMIT 100;

-- Source performance metrics
CREATE OR REPLACE VIEW source_performance AS
SELECT
  sr.source_name,
  sr.tier,
  sr.reliability_score,
  COUNT(ra.id) as total_articles,
  COUNT(ra.id) FILTER (WHERE ra.scraped_at >= NOW() - INTERVAL '7 days') as articles_last_7d,
  sr.last_successful_scrape,
  sr.consecutive_failures,
  sr.active
FROM source_registry sr
LEFT JOIN raw_articles ra ON sr.id = ra.source_id
GROUP BY sr.id, sr.source_name, sr.tier, sr.reliability_score, sr.last_successful_scrape, sr.consecutive_failures, sr.active
ORDER BY articles_last_7d DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE source_registry IS 'Master registry of all monitored sources (RSS feeds, websites, company pages)';
COMMENT ON TABLE raw_articles IS 'Unprocessed articles as scraped, before AI categorization';
COMMENT ON TABLE processed_articles IS 'AI-processed articles tagged by industry, topics, entities - ready for distribution';
COMMENT ON TABLE article_entity_mentions IS 'Junction table tracking which entities are mentioned in which articles';
COMMENT ON TABLE batch_scrape_runs IS 'Audit log of batch scraping executions';
COMMENT ON TABLE user_article_interactions IS 'Track which articles have been shown to which users';

COMMENT ON COLUMN source_registry.tier IS '1=Premium (Bloomberg, WSJ), 2=Standard industry pubs, 3=Supplemental/company pages';
COMMENT ON COLUMN source_registry.monitor_method IS 'How we scrape this source: firecrawl_observer, rss, sitemap, etc.';
COMMENT ON COLUMN processed_articles.quality_score IS 'Overall article quality (0-100): credibility, depth, clarity';
COMMENT ON COLUMN processed_articles.newsworthiness_score IS 'How newsworthy/timely (0-100): breaking news > analysis > evergreen';
COMMENT ON COLUMN article_entity_mentions.is_primary_subject IS 'True if this article is primarily about this entity';
