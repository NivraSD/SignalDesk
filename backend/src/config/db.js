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
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false
    })
  : new Pool({
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
      database: process.env.PGDATABASE || process.env.DB_NAME || 'signaldesk',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'your_postgres_password_here',
      port: process.env.PGPORT || process.env.DB_PORT || 5432,
    });

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});

module.exports = pool;
