// Vercel Serverless Function for Niv Chat Orchestration
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// MCP Server URLs (these will run as separate services)
const MCP_ENDPOINTS = {
  crisis: process.env.MCP_CRISIS_URL || 'http://localhost:3001',
  social: process.env.MCP_SOCIAL_URL || 'http://localhost:3002',
  narratives: process.env.MCP_NARRATIVES_URL || 'http://localhost:3003',
  stakeholder: process.env.MCP_STAKEHOLDER_URL || 'http://localhost:3004',
  regulatory: process.env.MCP_REGULATORY_URL || 'http://localhost:3005',
  orchestrator: process.env.MCP_ORCHESTRATOR_URL || 'http://localhost:3006',
};

// CORS headers for Vercel
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Detect which MCPs should be triggered based on message content
function detectRelevantMCPs(message) {
  const triggers = {
    crisis: ['crisis', 'emergency', 'urgent', 'scandal', 'controversy', 'damage control', 'breaking'],
    social: ['social media', 'twitter', 'linkedin', 'viral', 'trending', 'influencer', 'engagement'],
    narratives: ['narrative', 'story', 'messaging', 'framing', 'perception', 'angle', 'spin'],
    stakeholder: ['stakeholder', 'investor', 'employee', 'customer', 'partner', 'coalition', 'groups'],
    regulatory: ['regulation', 'compliance', 'legal', 'policy', 'government', 'SEC', 'FDA', 'FTC'],
  };

  const relevant = [];
  const lowerMessage = message.toLowerCase();

  for (const [mcp, keywords] of Object.entries(triggers)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      relevant.push(mcp);
    }
  }

  // Always include orchestrator if multiple MCPs are triggered
  if (relevant.length > 1) {
    relevant.push('orchestrator');
  }

  return relevant;
}

// Call MCP servers for specialized analysis
async function callMCPs(message, relevantMCPs) {
  const mcpResponses = {};
  
  // Call each relevant MCP in parallel
  const promises = relevantMCPs.map(async (mcp) => {
    try {
      const response = await fetch(`${MCP_ENDPOINTS[mcp]}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: {} }),
      });
      
      if (response.ok) {
        mcpResponses[mcp] = await response.json();
      }
    } catch (error) {
      console.error(`Failed to call ${mcp} MCP:`, error);
      mcpResponses[mcp] = null;
    }
  });

  await Promise.all(promises);
  return mcpResponses;
}

// Detect if artifacts should be created
function detectArtifactType(message) {
  const types = {
    'press-release': ['press release', 'announcement', 'news release'],
    'media-list': ['media list', 'journalist', 'reporter', 'media contacts'],
    'strategy': ['strategy', 'strategic plan', 'campaign', 'pr plan'],
    'crisis-response': ['crisis response', 'holding statement', 'damage control'],
    'social-content': ['social media', 'social post', 'tweet', 'linkedin'],
    'messaging': ['key messages', 'talking points', 'messaging framework'],
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return type;
    }
  }
  
  return null;
}

// Main handler
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      message, 
      messages = [], 
      sessionId = `session-${Date.now()}`,
      userId = null,
      organizationId = null,
      mode = 'strategic'
    } = req.body;

    console.log('🔍 Processing Niv request:', { message, sessionId, mode });

    // Step 1: Detect relevant MCPs
    const relevantMCPs = detectRelevantMCPs(message);
    console.log('📡 Triggering MCPs:', relevantMCPs);

    // Step 2: Call MCPs for specialized analysis (parallel)
    const mcpPromise = relevantMCPs.length > 0 
      ? callMCPs(message, relevantMCPs)
      : Promise.resolve({});

    // Step 3: Call Claude for main AI response (parallel with MCPs)
    const systemPrompt = `You are Niv, an elite AI PR strategist with 20 years of experience. 
You're not just an advisor - you're a strategic partner helping organizations achieve PR excellence.

Your expertise includes:
- Media relations and journalist outreach
- Press release writing and distribution  
- Crisis communications and damage control
- Brand messaging and positioning
- Social media strategy
- Executive thought leadership
- PR campaign planning and execution
- Stakeholder management
- Regulatory communications

${relevantMCPs.length > 0 ? `You are being assisted by specialized intelligence systems analyzing: ${relevantMCPs.join(', ')}` : ''}

Provide strategic, actionable advice. When creating substantial content (press releases, strategies, plans), 
indicate this by using phrases like "Here's a strategic framework..." or "Let me create a comprehensive plan..."`;

    const claudePromise = anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: 'user', content: message }
      ]
    });

    // Wait for both Claude and MCPs
    const [claudeResponse, mcpResponses] = await Promise.all([claudePromise, mcpPromise]);
    
    const aiResponse = claudeResponse.content[0].text;

    // Step 4: Synthesize MCP insights into the response
    let enhancedResponse = aiResponse;
    
    if (Object.keys(mcpResponses).length > 0) {
      const insights = [];
      
      for (const [mcp, response] of Object.entries(mcpResponses)) {
        if (response && response.insight) {
          insights.push(`**${mcp.toUpperCase()} Analysis**: ${response.insight}`);
        }
      }
      
      if (insights.length > 0) {
        enhancedResponse += '\n\n---\n**Specialized Intelligence:**\n' + insights.join('\n');
      }
    }

    // Step 5: Detect if we should create an artifact
    const artifactType = detectArtifactType(message);
    const shouldSave = artifactType !== null;
    
    let artifact = null;
    if (shouldSave) {
      artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: artifactType,
        title: `${artifactType.replace('-', ' ').toUpperCase()}: ${message.substring(0, 50)}`,
        content: enhancedResponse,
        created: new Date().toISOString(),
      };
    }

    // Step 6: Save to database
    const savePromises = [];
    
    // Save conversation
    savePromises.push(
      supabase.from('niv_conversations').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      })
    );
    
    savePromises.push(
      supabase.from('niv_conversations').insert({
        session_id: sessionId,
        user_id: userId,
        role: 'assistant',
        content: enhancedResponse,
        created_at: new Date().toISOString(),
      })
    );

    // Save artifact if needed
    if (artifact) {
      savePromises.push(
        supabase.from('niv_artifacts').insert({
          session_id: sessionId,
          user_id: userId,
          type: artifactType,
          title: artifact.title,
          content: artifact.content,
          status: 'draft',
          created_at: new Date().toISOString(),
        })
      );
    }

    // Execute all saves in parallel
    await Promise.all(savePromises);

    // Step 7: Return orchestrated response
    const response = {
      response: enhancedResponse,
      message: enhancedResponse,
      chatMessage: shouldSave 
        ? `I've created a ${artifactType.replace('-', ' ')} for you. It's available in the workspace panel.`
        : enhancedResponse,
      shouldSave,
      artifact,
      sessionId,
      mcpsTriggered: relevantMCPs,
      mcpInsights: mcpResponses,
    };

    console.log('✅ Niv response complete:', { 
      sessionId, 
      artifactCreated: shouldSave,
      mcpsUsed: relevantMCPs.length 
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Niv orchestrator error:', error);
    
    // Fallback response
    return res.status(200).json({
      response: 'I understand your request. As your AI PR strategist, I can help with press releases, media strategies, crisis management, and campaign planning. Let me assist you with your specific needs.',
      message: 'Ready to help with your PR needs.',
      chatMessage: 'How can I assist with your PR strategy today?',
      shouldSave: false,
      error: error.message,
    });
  }
}