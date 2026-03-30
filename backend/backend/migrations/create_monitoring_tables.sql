-- Monitoring mentions table
CREATE TABLE IF NOT EXISTS monitoring_mentions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  external_id VARCHAR(255) UNIQUE,
  content TEXT NOT NULL,
  source VARCHAR(100),
  source_type VARCHAR(50),
  author VARCHAR(100),
  publish_date TIMESTAMP,
  url TEXT,
  reach INTEGER DEFAULT 0,
  engagement JSONB,
  sentiment VARCHAR(20) DEFAULT 'unanalyzed',
  sentiment_score INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0,
  claude_analysis JSONB,
  analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring configurations table
CREATE TABLE IF NOT EXISTS monitoring_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  config_type VARCHAR(50) NOT NULL,
  config_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, config_type)
);

-- Monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50),
  severity VARCHAR(20),
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_monitoring_mentions_user_id ON monitoring_mentions(user_id);
CREATE INDEX idx_monitoring_mentions_sentiment ON monitoring_mentions(sentiment);
CREATE INDEX idx_monitoring_mentions_publish_date ON monitoring_mentions(publish_date);
CREATE INDEX idx_monitoring_alerts_user_id ON monitoring_alerts(user_id);
CREATE INDEX idx_monitoring_alerts_acknowledged ON monitoring_alerts(acknowledged);
