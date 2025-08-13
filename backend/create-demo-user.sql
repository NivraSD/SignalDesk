-- Create Demo User for SignalDesk
-- Password: Demo123

-- First, check if users table exists and what columns it has
-- \d users

-- Insert demo user (if not exists)
INSERT INTO users (name, email, password, created_at, updated_at) 
VALUES (
    'Demo User', 
    'demo@signaldesk.com', 
    '$2a$10$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6', -- Demo123 hashed
    NOW(), 
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verify the user was created
SELECT id, name, email, created_at FROM users WHERE email = 'demo@signaldesk.com';