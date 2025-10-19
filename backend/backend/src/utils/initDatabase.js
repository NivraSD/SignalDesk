const pool = require('../config/db');

async function initializeDatabase() {
  console.log('🔧 Starting database initialization...');
  
  try {
    // Test connection first
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', testResult.rows[0].now);
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created/verified');
    
    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Projects table created/verified');
    
    // Create todos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT false,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Todos table created/verified');
    
    // Create content table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type VARCHAR(50),
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Content table created/verified');
    
    // Create organizations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Organizations table created/verified');
    
    // Check if demo user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@signaldesk.com']
    );
    
    if (userCheck.rows.length === 0) {
      // Create demo user (password: demo123)
      // Password hash for 'demo123' using bcrypt
      await pool.query(`
        INSERT INTO users (email, password, organization) 
        VALUES (
          'demo@signaldesk.com', 
          '$2a$10$XQq43fTCJGzT7XOqKUPxNOJ7ghlSZhzYkqU4eSZHtQoHbeH1vbmQm',
          'Demo Organization'
        )
      `);
      console.log('✅ Demo user created');
      
      // Get the demo user ID
      const demoUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        ['demo@signaldesk.com']
      );
      
      // Create demo project
      await pool.query(`
        INSERT INTO projects (name, description, user_id)
        VALUES ('Sample Project', 'A demo project to get started', $1)
      `, [demoUser.rows[0].id]);
      console.log('✅ Demo project created');
    } else {
      console.log('ℹ️ Demo user already exists');
    }
    
    // Verify table creation
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n📊 Database tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Count records
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const projectCount = await pool.query('SELECT COUNT(*) FROM projects');
    
    console.log('\n📈 Database statistics:');
    console.log(`  - Users: ${userCount.rows[0].count}`);
    console.log(`  - Projects: ${projectCount.rows[0].count}`);
    
    return {
      success: true,
      message: 'Database initialized successfully',
      tables: tables.rows.map(r => r.tablename),
      stats: {
        users: parseInt(userCount.rows[0].count),
        projects: parseInt(projectCount.rows[0].count)
      }
    };
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return {
      success: false,
      error: error.message,
      details: error.detail || 'No additional details'
    };
  }
}

module.exports = { initializeDatabase };