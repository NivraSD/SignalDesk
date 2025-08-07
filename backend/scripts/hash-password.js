const bcrypt = require('bcryptjs');

const password = 'password'; // The demo password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to insert/update demo user:');
    console.log(`
UPDATE users 
SET password_hash = '${hash}' 
WHERE email = 'demo@signaldesk.com';

-- Or if user doesn't exist:
INSERT INTO users (email, password_hash, name, role) 
VALUES ('demo@signaldesk.com', '${hash}', 'Demo User', 'user')
ON CONFLICT (email) 
DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `);
  }
});
