// Simplified server for Railway debugging
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting SIMPLE SignalDesk server...');
console.log('Port:', PORT);
console.log('Environment:', process.env.NODE_ENV);
console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SignalDesk API (Simple Mode)',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/auth/login']
  });
});

// Simple login endpoint with demo user
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // Demo user - works without database
  if (email === 'demo@signaldesk.com' && 
      (password === 'Demo123' || password === 'demo123' || password === 'password')) {
    
    const token = jwt.sign(
      { 
        id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        email: 'demo@signaldesk.com',
        name: 'Demo User'
      },
      process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      token,
      user: {
        id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        email: 'demo@signaldesk.com',
        name: 'Demo User'
      }
    });
  }
  
  // Invalid credentials
  res.status(401).json({
    error: 'Invalid credentials',
    hint: 'Use demo@signaldesk.com with Demo123'
  });
});

// Token verification
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`Ready for connections at http://0.0.0.0:${PORT}`);
});