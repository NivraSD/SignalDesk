/**
 * API endpoint for interacting with Niv PR Strategist
 */

import NivPRStrategist from '../../src/agents/NivPRStrategist.js';

// Initialize Niv instance
let niv = null;

const initializeNiv = () => {
  if (!niv) {
    niv = new NivPRStrategist({
      apiKey: process.env.ANTHROPIC_API_KEY,
      database: process.env.DATABASE_URL
    });
  }
  return niv;
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { message, context, conversationId, mode } = req.body;
    
    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Initialize Niv
    const nivAgent = initializeNiv();
    
    // Load conversation memory if exists
    if (conversationId) {
      nivAgent.loadMemory(conversationId);
    }

    // Add context about current state
    const enrichedContext = {
      ...context,
      mode: mode || 'general',
      timestamp: new Date().toISOString(),
      user: req.headers.authorization ? 'authenticated' : 'anonymous'
    };

    // Get Niv's response
    const response = await nivAgent.chat(message, enrichedContext);
    
    // Save conversation to memory
    if (conversationId) {
      nivAgent.saveToMemory(conversationId);
    }

    // Return response
    return res.status(200).json({
      success: true,
      response: response,
      conversationId: conversationId || Date.now().toString(),
      agent: {
        name: 'Niv',
        role: 'Senior PR Strategist',
        mode: enrichedContext.mode
      }
    });

  } catch (error) {
    console.error('Niv chat error:', error);
    
    // Fallback response if Niv fails
    return res.status(200).json({
      success: true,
      response: `I'm having trouble connecting to my full capabilities right now, but let me help you with basic PR guidance. 

As a senior PR strategist, here's my initial thought: ${req.body.message?.includes('crisis') ? 
  'In crisis situations, speed and accuracy are critical. Prepare a holding statement immediately while gathering facts.' :
  'Strategic PR starts with understanding your audience and crafting messages that resonate with their needs.'}

What specific aspect would you like to explore further?`,
      conversationId: req.body.conversationId || Date.now().toString(),
      agent: {
        name: 'Niv',
        role: 'Senior PR Strategist (Limited Mode)',
        mode: 'fallback'
      }
    });
  }
}