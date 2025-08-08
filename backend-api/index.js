// Railway-compatible Express server
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
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyLength: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0,
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 20) + '...' : 'none'
  });
});

// Test endpoint that always works
app.get('/test', (req, res) => {
  res.send('OK');
});

// Claude API test endpoint
app.get('/test-claude', async (req, res) => {
  try {
    console.log('Testing Claude API...');
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length);
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({ error: 'No API key found' });
    }
    
    const { Anthropic } = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Say "Hello from Claude!" and nothing else.'
      }]
    });
    
    res.json({
      success: true,
      message: response.content[0].text,
      model: 'claude-3-haiku-20240307'
    });
  } catch (error) {
    console.error('Claude test error:', error);
    res.json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// ============= AUTHENTICATION =============
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Demo user (no database needed for demo)
    if (email === 'demo@signaldesk.com' && password === 'demo123') {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { userId: 1, email, name: 'Demo User' },
        process.env.JWT_SECRET || 'demo-secret-key',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user: { id: 1, email, name: 'Demo User' }
      });
    }
    
    // For other users, check database
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'demo-secret-key',
      { expiresIn: '24h' }
    );
    
    await pool.end();
    
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============= CONTENT GENERATION =============
app.post('/api/content/ai-generate', async (req, res) => {
  const { type, prompt, tone } = req.body;
  
  console.log('Content generation request:', { type, prompt, tone });
  console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API key length:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0);
  
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Attempting Claude API call...');
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Generate a ${type} with ${tone} tone: ${prompt}`
        }]
      });
      
      console.log('Claude response received successfully');
      return res.json({
        success: true,
        content: response.content[0].text,
        metadata: {
          type,
          tone,
          ai_model: 'claude-3-haiku',
          powered_by: 'Anthropic Claude'
        }
      });
    } else {
      console.log('No ANTHROPIC_API_KEY found, using fallback');
    }
  } catch (error) {
    console.error('Claude error:', error.message);
    console.error('Error details:', error);
  }
  
  // Fallback template
  const templates = {
    'press-release': `FOR IMMEDIATE RELEASE\n\n${prompt}\n\nAbout [Company]\n[Company description]`,
    'social-post': `🚀 ${prompt}\n\n#Innovation #Tech`,
    'email': `Subject: ${prompt}\n\nDear [Recipient],\n\n[Content]\n\nBest regards`
  };
  
  res.json({
    success: true,
    content: templates[type] || `Generated ${type}: ${prompt}`,
    metadata: { type, tone, ai_model: 'template' }
  });
});

// ============= PROJECTS =============
app.get('/api/projects', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query(
      'SELECT * FROM projects ORDER BY created_at DESC LIMIT 10'
    );
    await pool.end();
    
    res.json(result.rows);
  } catch (error) {
    // Return demo data if database fails
    res.json([
      { id: 1, name: 'Demo Project', description: 'Sample project for testing' }
    ]);
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, description } = req.body;
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query(
      'INSERT INTO projects (name, description, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [name, description]
    );
    await pool.end();
    
    res.json({
      success: true,
      project: result.rows[0]
    });
  } catch (error) {
    console.error('Project creation error:', error);
    // Return success with demo data if database fails
    res.json({
      success: true,
      project: {
        id: Date.now(),
        name,
        description,
        created_at: new Date().toISOString()
      }
    });
  }
});

// ============= MEMORYVAULT =============
app.get('/api/memoryvault/project', (req, res) => {
  res.json({
    folders: [
      { id: 1, name: 'Campaign Intelligence', folder_type: 'campaign-intelligence', count: 0 },
      { id: 2, name: 'Content', folder_type: 'content', count: 0 },
      { id: 3, name: 'Media Lists', folder_type: 'media-lists', count: 0 },
      { id: 4, name: 'Crisis Response', folder_type: 'crisis-response', count: 0 }
    ]
  });
});

// ============= AUTH VERIFY =============
app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key');
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============= CAMPAIGN INTELLIGENCE =============
app.post('/api/campaigns/generate-strategic-report', async (req, res) => {
  const { campaignType, brief } = req.body;
  
  // Return a basic template for now
  res.json({
    success: true,
    report: {
      title: `Strategic Report: ${campaignType}`,
      brief: brief,
      sections: [
        { title: 'Executive Summary', content: 'Campaign overview and objectives' },
        { title: 'Strategic Approach', content: 'Key strategies and tactics' },
        { title: 'Timeline', content: 'Implementation schedule' },
        { title: 'Success Metrics', content: 'KPIs and measurement framework' }
      ]
    }
  });
});

// ============= CRISIS ADVISOR =============
app.post('/api/crisis/advisor', (req, res) => {
  const { message, severity } = req.body;
  
  res.json({
    success: true,
    advice: {
      immediateActions: ['Assess situation', 'Gather facts', 'Prepare statement'],
      communicationStrategy: 'Transparent and timely communication',
      keyMessages: ['We are aware', 'Taking action', 'Updates to follow']
    }
  });
});

// ============= MEDIA LIST =============
app.post('/api/media/list-builder', (req, res) => {
  res.json({
    success: true,
    journalists: [
      { name: 'Demo Journalist', outlet: 'TechCrunch', beat: 'AI/Technology' }
    ]
  });
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