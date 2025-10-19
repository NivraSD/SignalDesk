#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function resetDemoPassword() {
  try {
    // Set a known password for demo user
    const newPassword = 'password';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update demo user password
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'demo@signaldesk.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password reset successful!');
      console.log('\n📧 Email: demo@signaldesk.com');
      console.log('🔑 Password: password');
      console.log('\n🌐 Login at: http://localhost:3000');
    } else {
      // Create demo user if doesn't exist
      console.log('Demo user not found, creating...');
      await pool.query(
        'INSERT INTO users (email, password_hash, name, created_at) VALUES ($1, $2, $3, NOW())',
        ['demo@signaldesk.com', hashedPassword, 'Demo User']
      );
      console.log('✅ Demo user created!');
      console.log('\n📧 Email: demo@signaldesk.com');
      console.log('🔑 Password: password');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetDemoPassword();