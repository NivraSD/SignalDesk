/**
 * Niv PR Strategist Routes
 * Handles all API endpoints for Niv AI PR Agent
 */

const express = require('express');
const router = express.Router();
const NivPRStrategist = require('../agents/NivPRStrategist');

// Initialize Niv instance
let nivInstance = null;

const getNivInstance = () => {
  if (!nivInstance) {
    console.log('🎯 Initializing Niv PR Strategist...');
    nivInstance = new NivPRStrategist({
      apiKey: process.env.ANTHROPIC_API_KEY,
      database: process.env.DATABASE_URL
    });
    console.log('✅ Niv PR Strategist initialized');
  }
  return nivInstance;
};

// Main chat endpoint
router.post('/chat', async (req, res) => {
  console.log('💬 Niv chat request received');
  
  try {
    const { message, context, conversationId, mode } = req.body;
    
    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get Niv instance
    const niv = getNivInstance();
    
    // Load conversation memory if exists
    if (conversationId) {
      niv.loadMemory(conversationId);
    }

    // Add context about current state
    const enrichedContext = {
      ...context,
      mode: mode || 'general',
      timestamp: new Date().toISOString(),
      user: req.user ? req.user.email : 'anonymous'
    };

    console.log('🧠 Processing with Niv:', { 
      messageLength: message.length, 
      mode: enrichedContext.mode,
      conversationId 
    });

    // Get Niv's response
    const response = await niv.chat(message, enrichedContext);
    
    // Save conversation to memory
    const finalConversationId = conversationId || Date.now().toString();
    if (conversationId) {
      niv.saveToMemory(conversationId);
    }

    console.log('✅ Niv response generated successfully');

    // Return response
    return res.status(200).json({
      success: true,
      response: response,
      conversationId: finalConversationId,
      agent: {
        name: 'Niv',
        role: 'Senior PR Strategist',
        mode: enrichedContext.mode
      }
    });

  } catch (error) {
    console.error('❌ Niv chat error:', error);
    
    // Fallback response if Niv fails
    const fallbackResponse = generateFallbackResponse(req.body.message);
    
    return res.status(200).json({
      success: true,
      response: fallbackResponse,
      conversationId: req.body.conversationId || Date.now().toString(),
      agent: {
        name: 'Niv',
        role: 'Senior PR Strategist (Limited Mode)',
        mode: 'fallback'
      }
    });
  }
});

// Get Niv's capabilities
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    agent: 'Niv PR Strategist',
    experience: '20 years',
    capabilities: [
      {
        area: 'Media Relations',
        skills: ['Journalist outreach', 'Pitch development', 'Media list building', 'Relationship management']
      },
      {
        area: 'Crisis Management',
        skills: ['Crisis response', 'Reputation recovery', 'Stakeholder communication', 'Message control']
      },
      {
        area: 'Campaign Strategy',
        skills: ['Campaign planning', 'Message development', 'Timeline creation', 'KPI setting']
      },
      {
        area: 'Content Creation',
        skills: ['Press releases', 'Media pitches', 'Executive statements', 'Op-eds']
      },
      {
        area: 'Strategic Planning',
        skills: ['PR strategy', 'Brand positioning', 'Thought leadership', 'Executive visibility']
      }
    ],
    quickActions: [
      { id: 'strategy', label: 'PR Strategy', description: 'Develop comprehensive PR strategy' },
      { id: 'media', label: 'Media List', description: 'Build targeted journalist lists' },
      { id: 'crisis', label: 'Crisis Help', description: 'Immediate crisis communication support' },
      { id: 'campaign', label: 'Campaign', description: 'Plan and execute PR campaigns' },
      { id: 'pitch', label: 'Pitch Review', description: 'Review and improve media pitches' }
    ]
  });
});

// Get conversation history
router.get('/history/:conversationId', (req, res) => {
  try {
    const niv = getNivInstance();
    const { conversationId } = req.params;
    
    // Load conversation from memory
    const hasHistory = niv.loadMemory(conversationId);
    
    if (hasHistory) {
      res.json({
        success: true,
        conversationId,
        history: niv.memory.shortTerm
      });
    } else {
      res.json({
        success: false,
        error: 'Conversation not found'
      });
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history'
    });
  }
});

// Health check for Niv
router.get('/health', (req, res) => {
  const niv = getNivInstance();
  res.json({
    success: true,
    status: 'operational',
    agent: 'Niv PR Strategist',
    initialized: !!niv,
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Generate fallback response when API fails
function generateFallbackResponse(message) {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('crisis')) {
    return `I understand you're dealing with a crisis situation. Here's my immediate guidance:

1. **First Hour Actions:**
   - Assess the situation fully
   - Prepare a holding statement
   - Alert key stakeholders
   - Monitor media and social channels

2. **Key Message Framework:**
   - Acknowledge the situation
   - Express appropriate concern
   - Commit to investigation/action
   - Provide next update timeline

3. **Stakeholder Priority:**
   - Affected parties first
   - Employees
   - Media
   - General public

Would you like me to help draft specific statements or develop a fuller crisis response plan?`;
  }
  
  if (messageLower.includes('media') || messageLower.includes('journalist')) {
    return `For media relations, I recommend:

1. **Target the Right Journalists:**
   - Research their recent coverage
   - Understand their beat and interests
   - Check their preferred contact methods

2. **Craft Your Pitch:**
   - Lead with the news angle
   - Keep it concise (150-200 words)
   - Include relevant data/stats
   - Offer exclusive access if possible

3. **Timing Matters:**
   - Tuesday-Thursday mornings are best
   - Avoid Mondays and Fridays
   - Consider news cycles and deadlines

What specific media outreach challenge can I help you with?`;
  }
  
  if (messageLower.includes('campaign')) {
    return `Let's build your PR campaign strategically:

1. **Define Clear Objectives:**
   - What specific outcomes do you want?
   - Who is your target audience?
   - What's your timeline?

2. **Key Campaign Elements:**
   - Core messages and proof points
   - Content calendar
   - Media strategy
   - Measurement plan

3. **Success Metrics:**
   - Media coverage quality and reach
   - Message penetration
   - Audience engagement
   - Business impact

What aspect of your campaign would you like to develop first?`;
  }
  
  // Default response
  return `I'm Niv, your Senior PR Strategist with 20 years of experience. I can help you with:

• **Strategic PR Planning** - Developing comprehensive PR strategies
• **Media Relations** - Building journalist relationships and securing coverage  
• **Crisis Management** - Protecting and recovering reputation
• **Campaign Development** - Creating impactful PR campaigns
• **Content Strategy** - Crafting compelling stories and messages

What PR challenge can I help you tackle today?`;
}

module.exports = router;