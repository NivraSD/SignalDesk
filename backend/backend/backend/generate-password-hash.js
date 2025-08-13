const bcrypt = require('bcryptjs');

const password = 'Demo123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to insert demo user:');
    console.log(`
INSERT INTO users (name, email, password, created_at, updated_at) 
VALUES ('Demo User', 'demo@signaldesk.com', '${hash}', NOW(), NOW());
    `);
});