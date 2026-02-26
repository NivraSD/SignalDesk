-- Create all required tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  project_id INTEGER REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create demo user (password: demo123)
INSERT INTO users (email, password, organization) 
VALUES ('demo@signaldesk.com', '$2a$10$XQq43fTCJGzT7XOqKUPxNOJ7ghlSZhzYkqU4eSZHtQoHbeH1vbmQm', 'Demo Organization')
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT 'Tables created successfully!' as status;