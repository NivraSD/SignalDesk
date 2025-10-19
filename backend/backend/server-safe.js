// Safe server for Railway - handles all errors gracefully
const express = require("express");
const cors = require("cors");
const app = express();

// Use Railway's PORT
const PORT = process.env.PORT || 3001;

console.log('Starting SignalDesk backend (safe mode)...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);
console.log('Database:', process.env.DATABASE_URL ? 'configured' : 'missing');
console.log('Claude API:', process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing');

// Simple CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check - ALWAYS works
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'safe' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mode: 'safe',
    env: {
      node: process.env.NODE_ENV,
      port: PORT,
      hasDB: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasClaude: !!process.env.ANTHROPIC_API_KEY
    }
  });
});

// Test login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'demo@signaldesk.com' && password === 'demo123') {
    res.json({
      success: true,
      token: 'demo-token-railway',
      user: { email, name: 'Demo User' }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Test content endpoint
app.post('/api/content/ai-generate', (req, res) => {
  res.json({
    success: true,
    content: 'Railway backend is working! Claude integration will be added once stable.',
    metadata: { mode: 'safe', powered_by: 'railway' }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Safe server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

// Don't crash on errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});