/**
 * Minimal test server to isolate 502 error cause
 * Run this to see if the issue is with the server setup or database
 */

const express = require('express');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Most basic possible endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'minimal server working',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Test database connection without crashing
app.get('/db-test', async (req, res) => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return res.json({
      success: false,
      error: 'DATABASE_URL not set',
      fix: 'Set DATABASE_URL in Railway variables'
    });
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as db');
    await client.end();
    
    res.json({
      success: true,
      database: result.rows[0].db,
      serverTime: result.rows[0].time,
      message: 'Database connection successful'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
});

// Start server with explicit 0.0.0.0 binding for Railway
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal test server started on 0.0.0.0:${PORT}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'NOT SET!'}`);
  console.log(`Ready for connections...`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});