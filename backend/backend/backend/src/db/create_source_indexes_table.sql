-- Create source_indexes table for storing discovered and categorized sources
CREATE TABLE IF NOT EXISTS source_indexes (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'company', 'industry', 'topic', 'stakeholder', etc.
    entity_name VARCHAR(255) NOT NULL,
    entity_data JSONB NOT NULL, -- Full entity profile and metadata
    index_data JSONB NOT NULL, -- All discovered and validated sources
    statistics JSONB, -- Index statistics and quality metrics
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_validated TIMESTAMP,
    validation_status VARCHAR(50) DEFAULT 'pending',
    quality_score DECIMAL(3,1), -- Overall quality score 0-10
    source_count INTEGER,
    active BOOLEAN DEFAULT true
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_source_indexes_entity_type ON source_indexes(entity_type);
CREATE INDEX IF NOT EXISTS idx_source_indexes_entity_name ON source_indexes(entity_name);
CREATE INDEX IF NOT EXISTS idx_source_indexes_created_at ON source_indexes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_indexes_quality_score ON source_indexes(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_source_indexes_entity_data ON source_indexes USING GIN(entity_data);
CREATE INDEX IF NOT EXISTS idx_source_indexes_statistics ON source_indexes USING GIN(statistics);

-- Create a table for individual sources (normalized)
CREATE TABLE IF NOT EXISTS indexed_sources (
    id SERIAL PRIMARY KEY,
    index_id INTEGER REFERENCES source_indexes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'official', 'news', 'social', 'academic', etc.
    subtype VARCHAR(50), -- More specific categorization
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium',
    quality_score DECIMAL(3,1),
    tier VARCHAR(10), -- 'tier1', 'tier2', 'tier3', 'tier4'
    validation_status VARCHAR(50),
    last_validated TIMESTAMP,
    content_analysis JSONB,
    metadata JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for indexed_sources
CREATE INDEX IF NOT EXISTS idx_indexed_sources_index_id ON indexed_sources(index_id);
CREATE INDEX IF NOT EXISTS idx_indexed_sources_type ON indexed_sources(type);
CREATE INDEX IF NOT EXISTS idx_indexed_sources_priority ON indexed_sources(priority);
CREATE INDEX IF NOT EXISTS idx_indexed_sources_quality_score ON indexed_sources(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_indexed_sources_tier ON indexed_sources(tier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_indexed_sources_url_index ON indexed_sources(url, index_id);

-- Create a table for tracking indexing jobs
CREATE TABLE IF NOT EXISTS indexing_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_data JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    next_run TIMESTAMP,
    interval_ms BIGINT, -- Milliseconds between runs
    error_message TEXT,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for indexing_jobs
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_status ON indexing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_next_run ON indexing_jobs(next_run);
CREATE INDEX IF NOT EXISTS idx_indexing_jobs_entity_name ON indexing_jobs(entity_name);

-- Create a materialized view for quick source statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS source_statistics AS
SELECT 
    entity_type,
    COUNT(DISTINCT entity_name) as entity_count,
    COUNT(*) as total_indexes,
    AVG(quality_score) as avg_quality_score,
    SUM(source_count) as total_sources,
    MAX(created_at) as last_indexed
FROM source_indexes
WHERE active = true
GROUP BY entity_type;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_source_statistics_entity_type ON source_statistics(entity_type);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_source_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY source_statistics;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables
CREATE TRIGGER update_source_indexes_updated_at BEFORE UPDATE ON source_indexes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indexed_sources_updated_at BEFORE UPDATE ON indexed_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indexing_jobs_updated_at BEFORE UPDATE ON indexing_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();