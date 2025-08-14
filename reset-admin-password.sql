-- RESET ADMIN PASSWORD DIRECTLY
-- This bypasses the trigger issues and updates the password

-- Update the admin user's password directly in auth.users
UPDATE auth.users 
SET 
    encrypted_password = crypt('admin123', gen_salt('bf')),
    updated_at = NOW(),
    email_confirmed_at = NOW()
WHERE email = 'admin@signaldesk.com';

-- Verify the update
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'admin@signaldesk.com';