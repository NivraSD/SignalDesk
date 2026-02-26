-- SignalDesk Database Schema
-- Run this to set up all necessary tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    type VARCHAR(100),
    title VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crisis Events table
CREATE TABLE IF NOT EXISTS crisis_events (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    situation TEXT,
    severity VARCHAR(50),
    analysis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255),
    industry VARCHAR(100),
    goals TEXT,
    budget DECIMAL(10, 2),
    insights TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media Contacts table
CREATE TABLE IF NOT EXISTS media_contacts (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255),
    type VARCHAR(100),
    relevance VARCHAR(50),
    contact VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Intelligence Targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo user (password: demo123)
INSERT INTO users (email, password, name) 
VALUES ('demo@signaldesk.com', '$2a$10$YourHashedPasswordHere', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- Create demo project
INSERT INTO projects (name, description, user_id)
VALUES ('Demo Project', 'Sample project for demonstration', 1)
ON CONFLICT DO NOTHING;

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;