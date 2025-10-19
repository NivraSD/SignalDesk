/**
 * Simple API Proxy Server for SignalDesk
 * Hides API keys from frontend in production
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Keys from environment
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasClaudeKey: !!CLAUDE_API_KEY,
    hasOpenAIKey: !!OPENAI_API_KEY 
  });
});

// Claude proxy endpoint
app.post('/api/claude', async (req, res) => {
  if (!CLAUDE_API_KEY) {
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: 'Failed to call Claude API' });
  }
});

// OpenAI proxy endpoint
app.post('/api/openai', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to call OpenAI API' });
  }
});

app.listen(PORT, () => {
  console.log(`API Proxy server running on port ${PORT}`);
  console.log('Claude API:', CLAUDE_API_KEY ? 'Configured' : 'Missing');
  console.log('OpenAI API:', OPENAI_API_KEY ? 'Configured' : 'Missing');
});