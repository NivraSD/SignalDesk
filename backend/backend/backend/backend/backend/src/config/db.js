const { Pool } = require('pg');

// Log environment for debugging
console.log('Database configuration:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
  PGHOST: process.env.PGHOST || 'Not set',
  PGDATABASE: process.env.PGDATABASE || 'Not set',
  NODE_ENV: process.env.NODE_ENV || 'Not set'
});

// Use DATABASE_URL if available (Railway), otherwise use individual variables
const connectionString = process.env.DATABASE_URL;

const pool = connectionString 
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('proxy.rlwy.net')
        ? { rejectUnauthorized: false }
        : false,
      // Full resources on $20 plan
      max: 20, // Increased for better performance
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : new Pool({
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      database: process.env.PGDATABASE || process.env.DB_NAME || 'signaldesk',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'your_postgres_password_here',
      port: process.env.PGPORT || process.env.DB_PORT || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

// Test the connection - CRITICAL FOR DEBUGGING
console.log('🔍 ATTEMPTING POSTGRES CONNECTION...');
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) + '...' : 'NOT SET!!!');

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌❌❌ POSTGRES CONNECTION FAILED ❌❌❌');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Connection details:', {
      host: err.host || 'unknown',
      port: err.port || 'unknown'
    });
    // Don't crash - let the app run with mock data
    console.log('⚠️ WARNING: Running without database - using mock data only');
  } else {
    console.log('✅✅✅ POSTGRES CONNECTED SUCCESSFULLY ✅✅✅');
    console.log('Connected to:', {
      host: client.host,
      database: client.database,
      port: client.port
    });
    release();
  }
});

module.exports = pool;
