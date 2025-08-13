-- Create table for AI monitoring strategies
CREATE TABLE IF NOT EXISTS ai_monitoring_strategies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_profile JSONB NOT NULL,
    strategy JSONB NOT NULL,
    setup_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add index for user lookups
CREATE INDEX idx_ai_monitoring_strategies_user_id ON ai_monitoring_strategies(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_monitoring_strategies_updated_at 
    BEFORE UPDATE ON ai_monitoring_strategies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();