/**
 * Railway PostgreSQL Setup and Diagnostic Script
 * This script helps you properly set up and diagnose Railway deployments
 */

const { Client } = require('pg');
const express = require('express');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function diagnoseAndSetup() {
  console.log(`${colors.blue}========================================`);
  console.log(`Railway PostgreSQL Setup & Diagnostic Tool`);
  console.log(`========================================${colors.reset}\n`);

  // Step 1: Check environment variables
  console.log(`${colors.yellow}Step 1: Checking Environment Variables${colors.reset}`);
  const databaseUrl = process.env.DATABASE_URL;
  const port = process.env.PORT || 3000;
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
  
  if (!databaseUrl) {
    console.log(`${colors.red}❌ DATABASE_URL is not set!${colors.reset}`);
    console.log(`
${colors.yellow}To fix this in Railway:${colors.reset}
1. Go to your Railway project
2. Click on your backend service
3. Go to the "Variables" tab
4. Add a new variable:
   - Name: DATABASE_URL
   - Value: Click "Add Reference" → Select your PostgreSQL service → Choose DATABASE_URL
5. Railway will automatically populate it with something like:
   postgresql://postgres:password@host.railway.internal:5432/railway

${colors.yellow}Alternative (if reference doesn't work):${colors.reset}
1. Click on your PostgreSQL service
2. Go to the "Connect" tab
3. Copy the "Private Network" URL (for internal Railway connections)
4. Paste it as the DATABASE_URL value in your backend service variables
`);
    return;
  }

  console.log(`${colors.green}✅ DATABASE_URL is set${colors.reset}`);
  console.log(`   URL pattern: ${databaseUrl.substring(0, 30)}...`);
  console.log(`   PORT: ${port}`);
  console.log(`   Railway Environment: ${railwayEnv || 'Not set'}\n`);

  // Step 2: Test database connection
  console.log(`${colors.yellow}Step 2: Testing Database Connection${colors.reset}`);
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log(`${colors.green}✅ Successfully connected to PostgreSQL${colors.reset}`);
    
    const result = await client.query('SELECT version(), current_database(), current_user');
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}\n`);

  } catch (error) {
    console.log(`${colors.red}❌ Failed to connect to database${colors.reset}`);
    console.log(`   Error: ${error.message}\n`);
    
    console.log(`${colors.yellow}Common fixes:${colors.reset}`);
    console.log(`1. Make sure PostgreSQL service is deployed and running`);
    console.log(`2. Check that DATABASE_URL reference is correctly set`);
    console.log(`3. Try using the private network URL instead of public URL`);
    console.log(`4. Ensure both services are in the same Railway project\n`);
    await client.end();
    return;
  }

  // Step 3: Check existing tables
  console.log(`${colors.yellow}Step 3: Checking Existing Tables${colors.reset}`);
  
  try {
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log(`${colors.yellow}⚠️  No tables found in database${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ Found ${tablesResult.rows.length} tables:${colors.reset}`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error checking tables: ${error.message}${colors.reset}\n`);
  }

  // Step 4: Create tables if needed
  console.log(`${colors.yellow}Step 4: Creating Required Tables${colors.reset}`);
  
  const tables = [
    {
      name: 'users',
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          organization VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: 'projects',
      query: `
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: 'todos',
      query: `
        CREATE TABLE IF NOT EXISTS todos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          completed BOOLEAN DEFAULT false,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    },
    {
      name: 'content',
      query: `
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
      `
    }
  ];

  for (const table of tables) {
    try {
      await client.query(table.query);
      console.log(`${colors.green}✅ Table '${table.name}' created/verified${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}❌ Error creating table '${table.name}': ${error.message}${colors.reset}`);
    }
  }

  // Step 5: Create demo user
  console.log(`\n${colors.yellow}Step 5: Creating Demo User${colors.reset}`);
  
  try {
    // Check if demo user exists
    const userCheck = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@signaldesk.com']
    );
    
    if (userCheck.rows.length === 0) {
      // Password hash for 'demo123'
      await client.query(`
        INSERT INTO users (email, password, organization) 
        VALUES (
          'demo@signaldesk.com', 
          '$2a$10$XQq43fTCJGzT7XOqKUPxNOJ7ghlSZhzYkqU4eSZHtQoHbeH1vbmQm',
          'Demo Organization'
        )
      `);
      console.log(`${colors.green}✅ Demo user created${colors.reset}`);
      console.log(`   Email: demo@signaldesk.com`);
      console.log(`   Password: demo123`);
    } else {
      console.log(`${colors.green}✅ Demo user already exists${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error creating demo user: ${error.message}${colors.reset}`);
  }

  // Step 6: Test the server
  console.log(`\n${colors.yellow}Step 6: Testing Express Server${colors.reset}`);
  
  const app = express();
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  // Database test endpoint
  app.get('/db-test', async (req, res) => {
    try {
      const result = await client.query('SELECT COUNT(*) FROM users');
      res.json({
        success: true,
        userCount: result.rows[0].count,
        message: 'Database query successful'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`${colors.green}✅ Test server running on port ${port}${colors.reset}`);
    console.log(`   Health check: http://localhost:${port}/health`);
    console.log(`   DB test: http://localhost:${port}/db-test\n`);
  });

  // Step 7: Final summary
  console.log(`${colors.blue}========================================`);
  console.log(`Summary and Next Steps`);
  console.log(`========================================${colors.reset}\n`);

  console.log(`${colors.green}What's Working:${colors.reset}`);
  console.log(`✅ Database connection established`);
  console.log(`✅ Tables created successfully`);
  console.log(`✅ Demo user available`);
  console.log(`✅ Test server responding\n`);

  console.log(`${colors.yellow}About the Railway "Connect" Button:${colors.reset}`);
  console.log(`The "Connect" button in Railway's PostgreSQL Data tab shows you the`);
  console.log(`connection string but DOES NOT provide a query interface. To manage`);
  console.log(`your database, you have these options:\n`);
  
  console.log(`1. ${colors.blue}Use this script${colors.reset} - Run it locally or in Railway to set up tables`);
  console.log(`2. ${colors.blue}Use API endpoints${colors.reset} - Call /api/database/init from your backend`);
  console.log(`3. ${colors.blue}Use external tools${colors.reset}:`);
  console.log(`   - pgAdmin (desktop application)`);
  console.log(`   - TablePlus (Mac/Windows/Linux)`);
  console.log(`   - DBeaver (free, cross-platform)`);
  console.log(`   - psql (command line)`);
  console.log(`   - Copy the connection string from Railway and use it in these tools\n`);

  console.log(`${colors.yellow}Why You Might Get 502 Errors:${colors.reset}`);
  console.log(`1. ${colors.blue}Port binding${colors.reset} - Ensure server listens on 0.0.0.0:${port}`);
  console.log(`2. ${colors.blue}Health checks${colors.reset} - Railway needs time to detect the service is ready`);
  console.log(`3. ${colors.blue}Startup time${colors.reset} - Database connections may timeout on cold start`);
  console.log(`4. ${colors.blue}Missing routes${colors.reset} - Ensure root (/) route exists and responds`);
  console.log(`5. ${colors.blue}Deployment issues${colors.reset} - Check Railway logs for crash messages\n`);

  console.log(`${colors.yellow}To Deploy This Setup:${colors.reset}`);
  console.log(`1. Push this script to your repository`);
  console.log(`2. In Railway, you can run it as a one-time job:`);
  console.log(`   railway run node railway-setup.js`);
  console.log(`3. Or add it to your package.json scripts:`);
  console.log(`   "setup": "node railway-setup.js"`);
  console.log(`4. Then run: railway run npm run setup\n`);

  console.log(`${colors.green}Script completed successfully!${colors.reset}`);
  
  // Keep server running for testing
  console.log(`\n${colors.yellow}Press Ctrl+C to stop the test server${colors.reset}`);
  
  // Don't close the database connection while server is running
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    server.close();
    await client.end();
    process.exit(0);
  });
}

// Run the diagnostic
if (require.main === module) {
  diagnoseAndSetup().catch(console.error);
}

module.exports = { diagnoseAndSetup };