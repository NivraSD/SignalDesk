-- SQL commands to add demo user to PostgreSQL database on Railway
-- Password hash for 'Demo123': $2a$10$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6

-- First, check if users table exists and its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Delete any existing demo user
DELETE FROM users WHERE email = 'demo@signaldesk.com';

-- Insert demo user with password_hash column (if it exists)
-- Try this first:
INSERT INTO users (
    id,
    email, 
    password_hash, 
    name, 
    company, 
    role, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'demo@signaldesk.com',
    '$2a$10$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6',
    'Demo User',
    'SignalDesk Demo',
    'admin',
    NOW(),
    NOW()
);

-- If the above fails due to password_hash column not existing, try with password column:
-- INSERT INTO users (
--     id,
--     email, 
--     password, 
--     name, 
--     company, 
--     role, 
--     created_at, 
--     updated_at
-- ) VALUES (
--     gen_random_uuid(),
--     'demo@signaldesk.com',
--     '$2a$10$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6',
--     'Demo User',
--     'SignalDesk Demo',
--     'admin',
--     NOW(),
--     NOW()
-- );

-- Verify the user was created
SELECT id, email, name, company, role, created_at 
FROM users 
WHERE email = 'demo@signaldesk.com';

-- Check if password_hash or password column has the correct value
SELECT 
    CASE 
        WHEN password_hash IS NOT NULL THEN 'password_hash column exists and has value'
        WHEN password IS NOT NULL THEN 'password column exists and has value'
        ELSE 'No password column found'
    END as password_status
FROM users 
WHERE email = 'demo@signaldesk.com';