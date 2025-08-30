// SIMPLIFIED Strategic Niv - Only creates artifacts when explicitly requested
export default async function handler(req, res) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      message, 
      messages = [], 
      sessionId = `session-${Date.now()}`,
    } = req.body;

    console.log('🎯 Strategic Niv Request:', message.substring(0, 100));

    // CRITICAL: Detect explicit save requests
    const explicitSaveRequest = detectExplicitSaveRequest(message);
    const strategicValue = assessStrategicValue(message);
    
    console.log('💡 Analysis:', { 
      explicitSave: explicitSaveRequest, 
      strategicValue 
    });

    // Get AI response
    let aiResponse;
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (CLAUDE_API_KEY) {
      try {
        const systemPrompt = `You are Niv, an elite AI PR strategist with 20 years of experience.

CRITICAL INSTRUCTIONS:
1. Provide strategic, actionable PR advice
2. When creating deliverables (press releases, media lists, etc.), make them complete and professional
3. Be direct and specific - no fluff
4. Understand the difference between giving advice and creating deliverables

Your expertise: Press releases, media relations, crisis management, brand positioning, executive communications, campaign strategy.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 3000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              ...messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
              })),
              { role: 'user', content: message }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.content[0].text;
        } else {
          console.error('Claude API error');
          aiResponse = generateFallbackResponse(message);
        }
      } catch (error) {
        console.error('Claude call failed:', error.message);
        aiResponse = generateFallbackResponse(message);
      }
    } else {
      aiResponse = generateFallbackResponse(message);
    }

    // ONLY create artifact if explicitly requested
    let artifact = null;
    let chatMessage = aiResponse;
    
    if (explicitSaveRequest) {
      // User explicitly asked to save - create artifact
      artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: determineContentType(message, aiResponse),
        title: extractTitle(message),
        content: aiResponse,  // Save the full response as text
        created: new Date().toISOString(),
        strategic: strategicValue.isStrategic
      };
      
      chatMessage = `✅ I've saved this as an artifact. ${strategicValue.isStrategic ? 'This contains strategic value for your PR efforts.' : ''} You can view and edit it in the workspace panel.`;
    } else if (strategicValue.isStrategic && strategicValue.score >= 8) {
      // High strategic value but not auto-saving
      chatMessage = aiResponse + '\n\n💡 *This response contains strategic value. Say "save this" if you'd like to keep it as an artifact.*';
    } else {
      // Regular response
      chatMessage = aiResponse;
    }

    // Response
    const response = {
      response: aiResponse,
      message: aiResponse,
      chatMessage: chatMessage,
      shouldSave: !!artifact,
      artifact,
      // Include workItems for frontend compatibility
      workItems: artifact ? [{
        type: artifact.type,
        id: artifact.id,
        title: artifact.title,
        content: artifact.content,
        generatedContent: { 
          content: artifact.content,
          type: artifact.type
        },
        created: artifact.created
      }] : [],
      sessionId,
      metadata: {
        explicitSaveRequest,
        strategicValue: strategicValue.score,
        strategicReason: strategicValue.reason
      }
    };

    console.log('✅ Response ready:', {
      sessionId,
      artifactCreated: !!artifact,
      explicitSave: explicitSaveRequest,
      strategicScore: strategicValue.score
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return res.status(200).json({
      response: `I understand you need help with: "${req.body.message}". Let me assist you with strategic PR guidance.`,
      message: 'Ready to help.',
      chatMessage: 'How can I assist with your PR strategy?',
      shouldSave: false,
      workItems: [],
      error: error.message
    });
  }
}

// Detect explicit save requests
function detectExplicitSaveRequest(message) {
  const lower = message.toLowerCase();
  const savePatterns = [
    'save this',
    'save as',
    'create artifact',
    'make this an artifact',
    'keep this',
    'save to workspace',
    'add to workspace'
  ];
  
  return savePatterns.some(pattern => lower.includes(pattern));
}

// Assess strategic value
function assessStrategicValue(message) {
  const lower = message.toLowerCase();
  
  // High strategic indicators
  const strategicIndicators = {
    deliverables: ['press release', 'media list', 'announcement', 'statement', 'messaging'],
    strategy: ['strategy', 'campaign', 'plan', 'approach', 'framework'],
    crisis: ['crisis', 'emergency', 'urgent', 'damage control'],
    analysis: ['analyze', 'review', 'assess', 'evaluate'],
    creation: ['create', 'write', 'draft', 'develop', 'build']
  };
  
  let score = 0;
  let reasons = [];
  
  // Check for deliverable creation
  if (strategicIndicators.deliverables.some(d => lower.includes(d))) {
    score += 4;
    reasons.push('deliverable creation');
  }
  
  // Check for strategic planning
  if (strategicIndicators.strategy.some(s => lower.includes(s))) {
    score += 3;
    reasons.push('strategic planning');
  }
  
  // Check for crisis management
  if (strategicIndicators.crisis.some(c => lower.includes(c))) {
    score += 5;
    reasons.push('crisis management');
  }
  
  // Check for analysis request
  if (strategicIndicators.analysis.some(a => lower.includes(a))) {
    score += 2;
    reasons.push('strategic analysis');
  }
  
  // Check for creation intent
  if (strategicIndicators.creation.some(c => lower.includes(c))) {
    score += 3;
    reasons.push('content creation');
  }
  
  return {
    isStrategic: score >= 5,
    score: Math.min(score, 10),
    reason: reasons.join(', ') || 'general inquiry'
  };
}

// Determine content type
function determineContentType(message, response) {
  const lower = message.toLowerCase();
  
  if (lower.includes('press release')) return 'press-release';
  if (lower.includes('media') && lower.includes('list')) return 'media-list';
  if (lower.includes('crisis')) return 'crisis-response';
  if (lower.includes('strategy') || lower.includes('plan')) return 'strategic-plan';
  if (lower.includes('message') || lower.includes('messaging')) return 'key-messaging';
  if (lower.includes('social')) return 'social-content';
  
  // Default based on response length
  if (response.length > 1500) return 'strategic-document';
  return 'strategic-note';
}

// Extract title
function extractTitle(message) {
  // Remove common prefixes
  let title = message
    .replace(/^(save|create|make|keep|add)/i, '')
    .replace(/^(this|as|an?|to|the)/i, '')
    .trim();
  
  // Limit length and capitalize
  title = title.substring(0, 60);
  if (title.length === 0) title = 'Strategic Content';
  
  return title.charAt(0).toUpperCase() + title.slice(1);
}

// Fallback response
function generateFallbackResponse(message) {
  return `I understand you need help with: "${message}". As your AI PR strategist, I can assist with:

• Press releases and media announcements
• Media list development and journalist outreach
• Crisis communication strategies
• Brand messaging and positioning
• Campaign planning and execution
• Executive communications

Please provide more details about your specific needs, and I'll create strategic, actionable guidance for you.

If you'd like to save any of my responses for later use, just say "save this" and I'll create an artifact you can edit and refine.`;
}