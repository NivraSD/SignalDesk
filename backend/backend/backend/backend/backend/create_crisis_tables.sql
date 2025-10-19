-- Crisis Plans table
CREATE TABLE IF NOT EXISTS crisis_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    industry VARCHAR(255) NOT NULL,
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Crisis Event Logs table
CREATE TABLE IF NOT EXISTS crisis_event_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crisis_plans_user_id ON crisis_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_event_logs_user_id ON crisis_event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_event_logs_created_at ON crisis_event_logs(created_at DESC);
