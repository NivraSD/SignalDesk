-- Reset demo user password to Demo1234!
-- The password will be hashed with bcrypt in the application
UPDATE users 
SET password = '$2b$10$YhX.7XyRg6Rv1wkkK5LBYOj.z.P.qJqOoGnzyCtIU4E3DfmF4sSVu'
WHERE email = 'demo@signaldesk.com';

-- This is the bcrypt hash for 'Demo1234!'
-- If this doesn't work, we'll need to generate a new hash