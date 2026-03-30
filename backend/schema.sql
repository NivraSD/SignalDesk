-- SignalDesk Database Schema

-- Users table (extends existing auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_name VARCHAR(255),
    industry VARCHAR(100),
    project_type VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Planning',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MemoryVault documents
CREATE TABLE IF NOT EXISTS memory_vault_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    size VARCHAR(50),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    -- embedding VECTOR(1536), -- Comment out or remove this line
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Intelligence
CREATE TABLE IF NOT EXISTS campaign_intelligence (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    brief TEXT,
    analysis JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_types (
    id SERIAL PRIMARY KEY,
    type_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration VARCHAR(50),
    phases JSONB,
    key_activities JSONB,
    channels JSONB,
    metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_tasks (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    phase VARCHAR(100),
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(255),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    dependencies JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE campaign_budgets (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    total_budget DECIMAL(12,2),
    allocated_budget JSONB,
    spent_budget JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_metrics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    metric_name VARCHAR(255),
    target_value VARCHAR(255),
    current_value VARCHAR(255),
    measurement_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_content_briefs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    content_type VARCHAR(50),
    brief TEXT,
    due_date DATE,
    assigned_to VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    content_generator_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated Content
CREATE TABLE IF NOT EXISTS generated_content (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    content_type VARCHAR(100) NOT NULL,
    brief TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    versions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Analyses table
CREATE TABLE content_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES content(id) ON DELETE SET NULL,
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'performance',
    analysis_results JSONB NOT NULL,
    scores JSONB NOT NULL,
    tone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media Contacts
CREATE TABLE IF NOT EXISTS media_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    publication VARCHAR(255),
    beat VARCHAR(100),
    location VARCHAR(255),
    notes TEXT,
    social_media JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media Lists
CREATE TABLE IF NOT EXISTS media_lists (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media List Contacts (junction table)
CREATE TABLE IF NOT EXISTS media_list_contacts (
    media_list_id INTEGER REFERENCES media_lists(id) ON DELETE CASCADE,
    media_contact_id INTEGER REFERENCES media_contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (media_list_id, media_contact_id)
);

-- Crisis Plans
CREATE TABLE IF NOT EXISTS crisis_plans (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    industry VARCHAR(100),
    scenarios JSONB DEFAULT '[]',
    team JSONB DEFAULT '[]',
    protocols JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'Normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring & Sentiment Analysis
CREATE TABLE IF NOT EXISTS media_monitoring (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    source VARCHAR(255),
    url TEXT,
    title TEXT,
    content TEXT,
    sentiment VARCHAR(50),
    sentiment_score DECIMAL(3,2),
    mentions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Export History
CREATE TABLE IF NOT EXISTS export_history (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    export_type VARCHAR(50), -- 'google_docs', 'word', 'pdf', 'ppt'
    content_type VARCHAR(100),
    file_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External API Integrations
CREATE TABLE IF NOT EXISTS api_integrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    api_key TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_memory_vault_project_id ON memory_vault_documents(project_id);
CREATE INDEX idx_generated_content_project_id ON generated_content(project_id);
CREATE INDEX idx_media_monitoring_project_id ON media_monitoring(project_id);
CREATE INDEX idx_crisis_plans_project_id ON crisis_plans(project_id);
CREATE INDEX idx_content_analyses_user_id ON content_analyses(user_id);
CREATE INDEX idx_content_analyses_content_id ON content_analyses(content_id);

-- Enable pgvector extension for AI embeddings (if needed)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Campaign Intelligence Index
CREATE INDEX idx_campaign_tasks_campaign_id ON campaign_tasks(campaign_id);
CREATE INDEX idx_campaign_tasks_status ON campaign_tasks(status);
CREATE INDEX idx_campaign_content_briefs_campaign_id ON campaign_content_briefs(campaign_id);