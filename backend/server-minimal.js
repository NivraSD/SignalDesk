// Minimal SignalDesk Backend - Core Features Only (No Monitoring)
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Database connection (with better error handling)
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  console.log('Database pool created');
} catch (error) {
  console.error('Database connection error:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "🚀 SignalDesk Platform API",
    version: "1.0.0 (Minimal)",
    status: "operational",
    features: ["auth", "projects", "todos", "organizations"]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    message: "SignalDesk API is running",
    timestamp: new Date().toISOString(),
    database: pool ? "connected" : "not connected"
  });
});

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // For demo/testing
    if (email === 'demo@signaldesk.com' && password === 'demo123') {
      const token = jwt.sign(
        { userId: 1, email },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user: { id: 1, email, name: 'Demo User' }
      });
    }
    
    // Try database if available
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (validPassword) {
          const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'dev-secret',
            { expiresIn: '24h' }
          );
          
          return res.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name }
          });
        }
      }
    }
    
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (pool) {
      const result = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, hashedPassword, name]
      );
      
      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user
      });
    }
    
    // Fallback if no database
    res.json({
      success: true,
      message: 'Registration simulated (no database)',
      user: { email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    userId: req.userId,
    message: 'Token is valid' 
  });
});

// PROJECTS ROUTES (simplified)
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM projects WHERE user_id = $1',
        [req.userId]
      );
      return res.json(result.rows);
    }
    
    // Mock data if no database
    res.json([
      { id: 1, name: 'Project 1', description: 'Demo project' },
      { id: 2, name: 'Project 2', description: 'Another demo project' }
    ]);
  } catch (error) {
    console.error('Projects error:', error);
    res.json([]);
  }
});

// TODOS ROUTES (simplified)
app.get('/api/todos', authMiddleware, async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query(
        'SELECT * FROM todos WHERE user_id = $1',
        [req.userId]
      );
      return res.json(result.rows);
    }
    
    // Mock data if no database
    res.json([
      { id: 1, title: 'Setup platform', completed: true },
      { id: 2, title: 'Test deployment', completed: false },
      { id: 3, title: 'Add monitoring', completed: false }
    ]);
  } catch (error) {
    console.error('Todos error:', error);
    res.json([]);
  }
});

// ORGANIZATIONS ROUTES (simplified)
app.post('/api/organizations', authMiddleware, (req, res) => {
  res.json({
    success: true,
    organization: {
      id: Date.now(),
      ...req.body,
      created_at: new Date().toISOString()
    }
  });
});

// INTELLIGENCE ROUTES (mocked for now)
app.post('/api/intelligence/analyze-organization', authMiddleware, (req, res) => {
  const { organization } = req.body;
  
  res.json({
    success: true,
    organization,
    analysis: {
      industry: "Technology",
      competitors: [
        { name: "Competitor A", relevance: 0.9 },
        { name: "Competitor B", relevance: 0.7 }
      ],
      topics: [
        { name: "Digital Transformation", importance: "high" },
        { name: "Market Expansion", importance: "medium" }
      ]
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
    message: err.message,
  });
});

// Start server only if not in Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SignalDesk Backend (Minimal) running on port ${PORT}`);
    console.log(`📱 Frontend expected at http://localhost:3000`);
    console.log("✅ Core features only - no monitoring services");
    console.log("✅ Database:", pool ? "connected" : "not required for demo");
  });
}

module.exports = app;