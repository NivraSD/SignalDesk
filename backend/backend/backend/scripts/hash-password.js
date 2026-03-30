const bcrypt = require('bcryptjs');

const password = 'Demo1234!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to update demo user:');
    console.log(`UPDATE users SET password = '${hash}' WHERE email = 'demo@signaldesk.com';`);
  }
});