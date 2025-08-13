#!/usr/bin/env node

/**
 * Railway PostgreSQL Connection Test & Database Initialization Script
 * 
 * This script helps you:
 * 1. Test if your backend can connect to Railway PostgreSQL
 * 2. Initialize all required database tables
 * 3. Verify the setup is working correctly
 * 
 * Usage:
 * 1. Deploy your backend to Railway first
 * 2. Run: node test-railway-connection.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection(baseUrl) {
  log('\n📡 Testing connection to your Railway backend...', 'cyan');
  
  try {
    // Test basic health
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'ok') {
      log('✅ Backend is running!', 'green');
      log(`   Message: ${healthData.message}`, 'green');
    } else {
      log('⚠️ Backend responded but status is not OK', 'yellow');
    }
    
    // Test database health
    log('\n🔍 Checking database connection...', 'cyan');
    const dbHealthResponse = await fetch(`${baseUrl}/api/database/health`);
    const dbHealthData = await dbHealthResponse.json();
    
    if (dbHealthData.success) {
      log('✅ Database is connected!', 'green');
      log(`   Database: ${dbHealthData.database}`, 'green');
      log(`   Tables: ${dbHealthData.tableCount}`, 'green');
      log(`   Users: ${dbHealthData.userCount}`, 'green');
      
      if (dbHealthData.tableCount === 0) {
        log('\n⚠️ No tables found. Database needs initialization.', 'yellow');
        return { connected: true, needsInit: true };
      } else {
        log('\n✅ Database already has tables.', 'green');
        return { connected: true, needsInit: false };
      }
    } else {
      log('❌ Database connection failed!', 'red');
      log(`   Error: ${dbHealthData.error}`, 'red');
      log('\n🔧 Please check:', 'yellow');
      log('   1. DATABASE_URL is set in Railway backend Variables', 'yellow');
      log('   2. It references ${{Postgres.DATABASE_URL}}', 'yellow');
      log('   3. Backend has been redeployed after adding the variable', 'yellow');
      return { connected: false, needsInit: false };
    }
    
  } catch (error) {
    log(`\n❌ Failed to connect to backend: ${error.message}`, 'red');
    log('\n🔧 Please check:', 'yellow');
    log('   1. Your backend is deployed on Railway', 'yellow');
    log('   2. The URL is correct (check Railway dashboard)', 'yellow');
    log('   3. Your backend is running without errors', 'yellow');
    return { connected: false, needsInit: false };
  }
}

async function initializeDatabase(baseUrl) {
  log('\n🚀 Initializing database tables...', 'cyan');
  
  try {
    const response = await fetch(`${baseUrl}/api/database/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      log('✅ Database initialized successfully!', 'green');
      log('\n📊 Created tables:', 'cyan');
      data.data.tables.forEach(table => {
        log(`   - ${table}`, 'green');
      });
      log('\n📈 Database statistics:', 'cyan');
      log(`   - Users: ${data.data.stats.users}`, 'green');
      log(`   - Projects: ${data.data.stats.projects}`, 'green');
      
      if (data.data.stats.users > 0) {
        log('\n🎉 Demo user created!', 'green');
        log('   Email: demo@signaldesk.com', 'cyan');
        log('   Password: demo123', 'cyan');
      }
      
      return true;
    } else {
      log('❌ Database initialization failed!', 'red');
      log(`   Error: ${data.error}`, 'red');
      if (data.details) {
        log(`   Details: ${data.details}`, 'red');
      }
      return false;
    }
    
  } catch (error) {
    log(`\n❌ Failed to initialize database: ${error.message}`, 'red');
    return false;
  }
}

async function getSchema(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/database/schema`);
    const data = await response.json();
    
    if (data.success) {
      log('\n📋 Current database schema:', 'cyan');
      data.tables.forEach(table => {
        log(`\n   📁 ${table.table_name}:`, 'yellow');
        table.columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? ' (nullable)' : '';
          log(`      - ${col.column_name}: ${col.data_type}${nullable}`, 'green');
        });
      });
    }
  } catch (error) {
    log('Could not fetch schema', 'yellow');
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚂 RAILWAY POSTGRESQL CONNECTION TESTER', 'bright');
  log('='.repeat(60), 'cyan');
  
  log('\n📌 Prerequisites:', 'yellow');
  log('   1. Backend deployed to Railway', 'reset');
  log('   2. PostgreSQL service created in Railway', 'reset');
  log('   3. DATABASE_URL variable set in backend service', 'reset');
  
  rl.question('\n🔗 Enter your Railway backend URL (e.g., https://your-app.railway.app): ', async (baseUrl) => {
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');
    
    // Test connection
    const { connected, needsInit } = await testConnection(baseUrl);
    
    if (!connected) {
      log('\n❌ Cannot proceed without database connection.', 'red');
      log('Please fix the connection issues and try again.', 'yellow');
      rl.close();
      return;
    }
    
    if (needsInit) {
      rl.question('\n🔧 Do you want to initialize the database now? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          const success = await initializeDatabase(baseUrl);
          if (success) {
            await getSchema(baseUrl);
            log('\n🎉 Setup complete! Your database is ready to use.', 'green');
            log('\n📝 Next steps:', 'cyan');
            log('   1. Test login with demo@signaldesk.com / demo123', 'reset');
            log('   2. Your app should now work with the database!', 'reset');
          }
        } else {
          log('\nSkipping initialization. You can run this script again later.', 'yellow');
        }
        rl.close();
      });
    } else {
      await getSchema(baseUrl);
      log('\n✅ Your database is already set up and working!', 'green');
      rl.close();
    }
  });
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  log('\n\n👋 Goodbye!', 'cyan');
  process.exit(0);
});

main();