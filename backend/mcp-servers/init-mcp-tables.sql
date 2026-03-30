-- MemoryVault tables
CREATE TABLE IF NOT EXISTS memoryvault_items (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign tables
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    objectives JSONB,
    start_date DATE,
    end_date DATE,
    target_audience TEXT,
    budget DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_tasks (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    assignee VARCHAR(255),
    dependencies JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media/Journalist tables
CREATE TABLE IF NOT EXISTS journalists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    publication VARCHAR(255),
    beat VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    twitter VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_lists (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    topic TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_outreach (
    id SERIAL PRIMARY KEY,
    journalist_id VARCHAR(255),
    user_id VARCHAR(255),
    status VARCHAR(50),
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(journalist_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memoryvault_user ON memoryvault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memoryvault_category ON memoryvault_items(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_journalists_beat ON journalists(beat);
CREATE INDEX IF NOT EXISTS idx_journalists_publication ON journalists(publication);
