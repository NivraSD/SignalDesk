// SignalDesk Full Platform Server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@crossover.proxy.rlwy.net:56706/railway',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Claude AI client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || 'dummy-key-for-now'
});

// Middleware - Fixed CORS for all origins
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
  }

  res.json({
    message: '🚀 SignalDesk Platform API',
    version: '2.0.0',
    status: 'operational',
    database: dbStatus,
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      content: '/api/content',
      campaigns: '/api/campaigns',
      crisis: '/api/crisis',
      opportunity: '/api/opportunity',
      media: '/api/media',
      monitoring: '/api/monitoring',
      intelligence: '/api/intelligence'
    },
    timestamp: new Date().toISOString()
  });
});

// ============= AUTHENTICATION =============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Demo user check
    if (email === 'demo@signaldesk.com' && password === 'demo123') {
      const token = jwt.sign(
        { id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858', email: 'demo@signaldesk.com', organization_id: 'demo-org' },
        process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user: {
          id: '7f39af2e-933c-44e9-b67c-1f7e28b3a858',
          email: 'demo@signaldesk.com',
          name: 'Demo User',
          organization_id: 'demo-org'
        }
      });
    }

    // Check database for real users
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (validPassword) {
          const token = jwt.sign(
            { id: user.id, email: user.email, organization_id: user.organization_id },
            process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024',
            { expiresIn: '24h' }
          );
          
          return res.json({
            success: true,
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              organization_id: user.organization_id
            }
          });
        }
      }
    } catch (dbError) {
      console.log('Database error, falling back to demo user');
    }

    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// ============= PROJECTS =============
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Projects fetch error:', error);
    // Return empty array if database fails
    res.json([]);
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    let userId = '7f39af2e-933c-44e9-b67c-1f7e28b3a858'; // Default to demo user
    let organizationId = 'demo-org';
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
        userId = decoded.id;
        organizationId = decoded.organization_id || 'demo-org';
      } catch (e) {
        console.log('Token decode error, using demo user');
      }
    }
    
    const result = await pool.query(
      'INSERT INTO projects (name, description, created_by, organization_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, userId, organizationId, 'active']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// ============= TODOS =============
app.get('/api/todos', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = '7f39af2e-933c-44e9-b67c-1f7e28b3a858'; // Default to demo user
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
        userId = decoded.id;
      } catch (e) {
        console.log('Token decode error, using demo user');
      }
    }
    
    const result = await pool.query(
      'SELECT * FROM todos WHERE created_by = $1 OR assigned_to = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Todos fetch error:', error);
    res.json([]);
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, project_id, status = 'pending', priority = 'medium' } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    let userId = '7f39af2e-933c-44e9-b67c-1f7e28b3a858';
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'signaldesk-jwt-secret-2024');
        userId = decoded.id;
      } catch (e) {
        console.log('Token decode error, using demo user');
      }
    }
    
    const result = await pool.query(
      'INSERT INTO todos (title, description, project_id, status, priority, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, project_id, status, priority, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Todo creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create todo',
      error: error.message
    });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    
    const result = await pool.query(
      'UPDATE todos SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), priority = COALESCE($4, priority), updated_at = NOW() WHERE id = $5 RETURNING *',
      [title, description, status, priority, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Todo update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update todo',
      error: error.message
    });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('Todo delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete todo',
      error: error.message
    });
  }
});

// ============= CONTENT GENERATION WITH CLAUDE =============
app.post('/api/content/ai-generate', async (req, res) => {
  try {
    const { prompt, type = 'general' } = req.body;
    
    const systemPrompt = `You are a professional PR and marketing content creator for SignalDesk. 
    Generate high-quality ${type} content based on the user's request.`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      res.json({
        success: true,
        content: response.content[0].text
      });
    } catch (aiError) {
      // Fallback response if Claude fails
      res.json({
        success: true,
        content: `Generated ${type} content for: ${prompt}\n\nThis is a placeholder response. Add your Claude API key to enable AI generation.`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Content generation failed'
    });
  }
});

// ============= CRISIS ADVISOR =============
app.post('/api/crisis/analyze', async (req, res) => {
  try {
    const { situation, severity = 'medium' } = req.body;
    
    const systemPrompt = `You are a crisis management expert. Analyze the situation and provide immediate actionable advice.`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Crisis situation (${severity} severity): ${situation}` }
        ]
      });
      
      res.json({
        success: true,
        analysis: response.content[0].text,
        severity,
        timestamp: new Date()
      });
    } catch (aiError) {
      // Fallback response
      res.json({
        success: true,
        analysis: `Crisis Response Plan for: ${situation}\n\n1. Immediate Actions\n2. Communication Strategy\n3. Monitoring Steps\n\n(Add Claude API key for detailed analysis)`,
        severity,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Crisis analysis failed'
    });
  }
});

// ============= CAMPAIGN INTELLIGENCE =============
app.post('/api/campaigns/analyze', async (req, res) => {
  try {
    const { industry, goals, budget } = req.body;
    
    const prompt = `Analyze campaign opportunities for ${industry} industry with goals: ${goals} and budget: ${budget}`;
    
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        system: 'You are a marketing strategist. Provide campaign insights and recommendations.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      res.json({
        success: true,
        insights: response.content[0].text
      });
    } catch (aiError) {
      res.json({
        success: true,
        insights: `Campaign Analysis for ${industry}\n\nGoals: ${goals}\nBudget: ${budget}\n\nRecommendations will appear here with Claude API key.`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Campaign analysis failed'
    });
  }
});

// ============= OPPORTUNITY ENGINE =============
app.post('/api/opportunity/analyze', async (req, res) => {
  try {
    const { company, industry, position } = req.body;
    
    res.json({
      success: true,
      opportunities: [
        {
          type: 'Thought Leadership',
          description: `Position ${company} as industry leader in ${industry}`,
          priority: 'high'
        },
        {
          type: 'Media Coverage',
          description: `Target top ${industry} publications for feature stories`,
          priority: 'medium'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Opportunity analysis failed'
    });
  }
});

// ============= MEDIA LIST BUILDER =============
app.post('/api/media/discover', async (req, res) => {
  try {
    const { industry, topic, region } = req.body;
    
    res.json({
      success: true,
      media: [
        {
          name: 'TechCrunch',
          type: 'Online Publication',
          relevance: 'High',
          contact: 'tips@techcrunch.com'
        },
        {
          name: 'Wall Street Journal',
          type: 'Newspaper',
          relevance: 'High',
          contact: 'newsroom@wsj.com'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Media discovery failed'
    });
  }
});

// ============= MONITORING =============
app.get('/api/monitoring/status', async (req, res) => {
  res.json({
    success: true,
    status: 'active',
    sources: 125,
    articlesProcessed: 5420,
    lastUpdate: new Date()
  });
});

// ============= INTELLIGENCE =============
app.get('/api/intelligence/targets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM intelligence_targets LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    res.json([
      {
        id: 1,
        name: 'Demo Target',
        type: 'company',
        status: 'active'
      }
    ]);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
🚀 SignalDesk Full Platform Server
========================================
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Using default'}
🤖 Claude AI: ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Not configured'}
⏰ Started: ${new Date().toISOString()}
========================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

module.exports = app;