-- Create demo user for SignalDesk
-- Password: demo123 (hashed with bcrypt)

INSERT INTO users (email, password, name, created_at, updated_at)
VALUES (
  'demo@signaldesk.com',
  '$2b$10$YKuZQvzHFSlpMM.8lfRduejEFxGNOhtPMIpUq/ulA2kERshEJJUNW',
  'Demo User',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET password = '$2b$10$YKuZQvzHFSlpMM.8lfRduejEFxGNOhtPMIpUq/ulA2kERshEJJUNW',
    name = 'Demo User';