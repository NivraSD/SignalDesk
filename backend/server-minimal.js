// Minimal server for Railway testing
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Log environment
console.log('Starting minimal server...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV || 'not set',
  PORT: PORT,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ? 'Set' : 'Not set'
});

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SignalDesk Backend Running',
    version: '1.0.0'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Bound to 0.0.0.0 for Railway`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});