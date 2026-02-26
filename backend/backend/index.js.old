// Railway-compatible Express server
// IMPORTANT: This file redirects to server.js which has all routes
console.log('⚠️  index.js called - redirecting to server.js');
console.log('📍 All routes are in server.js');
require('./server.js');
return; // Exit to prevent duplicate server

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001; // Match existing setup

console.log('Starting SignalDesk server...');
console.log('PORT from env:', process.env.PORT);
console.log('Using port:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'SignalDesk API on Railway',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'signaldesk-backend',
    environment: process.env.NODE_ENV || 'development',
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY
  });
});

// Test endpoint that always works
app.get('/test', (req, res) => {
  res.send('OK');
});

// Start server exactly as Railway expects
const server = app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
  console.log(`Test URL: http://localhost:${port}/test`);
  console.log('Ready for connections...');
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});