-- Create monitoring_sessions table for tracking continuous monitoring
CREATE TABLE IF NOT EXISTS monitoring_sessions (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    stopped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create analysis_results table for storing comprehensive analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_org_id ON monitoring_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_status ON monitoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_org_id ON analysis_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);