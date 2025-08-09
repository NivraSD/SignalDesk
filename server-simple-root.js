// Temporary simple server for Railway debugging
// This file will be renamed to server.js for deployment

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('========================================');
console.log('🚀 SignalDesk Simple Server Starting...');
console.log('========================================');
console.log('Port:', PORT);
console.log('Node Version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Current Directory:', __dirname);
console.log('========================================');

// Check environment variables
const envStatus = {
  DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set',
  JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Not set (using default)'
};

console.log('Environment Variables:');
Object.entries(envStatus).forEach(([key, status]) => {
  console.log(`  ${key}: ${status}`);
});
console.log('========================================');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    nodeVersion: process.version
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 SignalDesk API - Simple Mode',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      verify: '/api/auth/verify'
    },
    demo: {
      email: 'demo@signaldesk.com',
      password: 'Demo123'
    }
  });
});

// Login endpoint with demo user fallback
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`Login attempt for: ${email}`);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Demo user - works without database
    if (email.toLowerCase() === 'demo@signaldesk.com' && 
        (password === 'Demo123' || password === 'demo123' || password === 'password')) {
      
      const demoUser = {
        id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
        email: 'demo@signaldesk.com',
        name: 'Demo User',
        company: 'SignalDesk Demo',
        role: 'admin'
      };
      
      const token = jwt.sign(
        { 
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name
        },
        process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
        { expiresIn: '24h' }
      );
      
      console.log('✅ Demo user login successful');
      
      return res.json({
        success: true,
        token,
        user: demoUser,
        message: 'Demo login successful'
      });
    }
    
    // For now, only demo user is supported in simple mode
    console.log('❌ Invalid credentials');
    res.status(401).json({
      error: 'Invalid credentials',
      message: 'Please use demo@signaldesk.com with Demo123'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
});

// Token verification endpoint
app.get('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided' 
      });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024'
    );
    
    res.json({
      valid: true,
      user: decoded
    });
    
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      verify: '/api/auth/verify'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log(`✅ Server is running!`);
  console.log(`Port: ${PORT}`);
  console.log(`URL: http://0.0.0.0:${PORT}`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});