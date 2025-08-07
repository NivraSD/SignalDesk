require('dotenv').config();
const db = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.query('SELECT NOW()');
    console.log('✅ Connected to database at:', result.rows[0].now);
    
    // Test tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Test user exists
    const users = await db.query('SELECT * FROM users WHERE email = $1', ['demo@signaldesk.com']);
    console.log('\n👤 Demo user exists:', users.rows.length > 0);
    if (users.rows.length > 0) {
      console.log('   Email:', users.rows[0].email);
      console.log('   Name:', users.rows[0].name);
    }
    
    // Test projects table
    const projects = await db.query('SELECT COUNT(*) FROM projects');
    console.log('\n📁 Projects in database:', projects.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testConnection();
