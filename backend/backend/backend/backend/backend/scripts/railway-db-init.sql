-- SignalDesk Complete Database Schema
-- Run this in Railway PostgreSQL Data tab after creating database

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Todos table
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Content table
CREATE TABLE IF NOT EXISTS content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  type VARCHAR(50),
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Intelligence targets table
CREATE TABLE IF NOT EXISTS intelligence_targets (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  target_name VARCHAR(255) NOT NULL,
  target_type VARCHAR(50),
  priority_level INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Intelligence findings table
CREATE TABLE IF NOT EXISTS intelligence_findings (
  id SERIAL PRIMARY KEY,
  target_id INTEGER REFERENCES intelligence_targets(id),
  finding_type VARCHAR(50),
  content TEXT,
  source VARCHAR(255),
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create demo user (password: demo123)
-- Password hash for 'demo123' using bcrypt
INSERT INTO users (email, password, organization) 
VALUES (
  'demo@signaldesk.com', 
  '$2a$10$XQq43fTCJGzT7XOqKUPxNOJ7ghlSZhzYkqU4eSZHtQoHbeH1vbmQm',
  'Demo Organization'
)
ON CONFLICT (email) DO UPDATE 
SET password = '$2a$10$XQq43fTCJGzT7XOqKUPxNOJ7ghlSZhzYkqU4eSZHtQoHbeH1vbmQm';

-- 9. Create demo organization
INSERT INTO organizations (name, description)
VALUES ('Demo Organization', 'Demo organization for testing')
ON CONFLICT DO NOTHING;

-- 10. Create demo project for demo user
INSERT INTO projects (name, description, user_id)
SELECT 'Sample Project', 'A demo project to get started', id
FROM users WHERE email = 'demo@signaldesk.com'
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as project_count FROM projects;