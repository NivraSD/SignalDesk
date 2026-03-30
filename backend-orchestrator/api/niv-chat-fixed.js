// Fixed Vercel Serverless Function for Niv Chat
export default async function handler(req, res) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // For now, let's get a working response without external dependencies
    // We'll add Claude/Supabase after confirming the basic function works
    
    const aiResponse = `I understand you need help with: "${message}". As Niv, your AI PR strategist, I can assist with:
    
• Press releases and announcements
• Media strategies and journalist outreach  
• Crisis management and damage control
• Strategic PR planning and campaigns
• Executive positioning and thought leadership

Based on your request, I'll provide strategic guidance tailored to your needs.`;

    // Detect if we should create an artifact
    const shouldSave = message.toLowerCase().includes('press') ||
                       message.toLowerCase().includes('media') ||
                       message.toLowerCase().includes('announce') ||
                       message.toLowerCase().includes('strategy') ||
                       message.toLowerCase().includes('crisis');
    
    let artifact = null;
    if (shouldSave) {
      const artifactTypes = {
        'press': 'press-release',
        'media': 'media-list',
        'announce': 'announcement',
        'strategy': 'strategic-plan',
        'crisis': 'crisis-response'
      };
      
      let artifactType = 'general';
      for (const [keyword, type] of Object.entries(artifactTypes)) {
        if (message.toLowerCase().includes(keyword)) {
          artifactType = type;
          break;
        }
      }
      
      artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: artifactType,
        title: `${artifactType.replace('-', ' ').toUpperCase()}: ${message.substring(0, 50)}`,
        content: aiResponse,
        created: new Date().toISOString(),
      };
    }

    // Return orchestrated response
    const response = {
      response: aiResponse,
      message: aiResponse,
      chatMessage: shouldSave 
        ? `I've created a ${artifact?.type.replace('-', ' ')} for you. It's available in the workspace panel.`
        : aiResponse,
      shouldSave,
      artifact,
      sessionId,
      mcpsTriggered: [], // Will add MCP detection later
      mcpInsights: {},
    };

    console.log('✅ Niv response complete:', { 
      sessionId, 
      artifactCreated: shouldSave
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