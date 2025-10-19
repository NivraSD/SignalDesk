-- Create Demo User for SignalDesk
-- Password: Demo123

-- IMPORTANT: The code expects password_hash column, not password!

-- First, check the users table structure
-- This will show you the actual column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Insert demo user with correct column name (password_hash)
INSERT INTO users (name, email, password_hash, created_at, updated_at) 
VALUES (
    'Demo User', 
    'demo@signaldesk.com', 
    '$2a$10$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6', -- Demo123 hashed
    NOW(), 
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = '$2a$10$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6',
    name = 'Demo User';

-- Verify the user was created/updated
SELECT id, name, email, created_at FROM users WHERE email = 'demo@signaldesk.com';