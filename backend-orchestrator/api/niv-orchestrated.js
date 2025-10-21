// Complete Niv Orchestrator with MCP Integration and Claude AI
import Anthropic from '@anthropic-ai/sdk';

// MCP Server Configuration
const MCP_SERVERS = {
  crisis: {
    name: 'Crisis Management',
    triggers: ['crisis', 'emergency', 'urgent', 'damage control', 'scandal', 'controversy'],
    capabilities: ['Real-time crisis assessment', 'Response strategy', 'Stakeholder messaging']
  },
  social: {
    name: 'Social Media Intelligence',
    triggers: ['social', 'twitter', 'linkedin', 'facebook', 'instagram', 'viral', 'trending'],
    capabilities: ['Social sentiment analysis', 'Influencer identification', 'Viral content strategy']
  },
  narratives: {
    name: 'Narrative Intelligence',
    triggers: ['narrative', 'story', 'messaging', 'positioning', 'brand', 'perception'],
    capabilities: ['Message development', 'Story arc creation', 'Brand narrative alignment']
  },
  stakeholders: {
    name: 'Stakeholder Groups',
    triggers: ['stakeholder', 'investor', 'customer', 'employee', 'partner', 'community'],
    capabilities: ['Stakeholder mapping', 'Interest analysis', 'Engagement strategies']
  },
  regulatory: {
    name: 'Regulatory Intelligence',
    triggers: ['regulatory', 'compliance', 'government', 'policy', 'legislation', 'SEC', 'FDA'],
    capabilities: ['Regulatory monitoring', 'Compliance messaging', 'Policy impact analysis']
  },
  orchestrator: {
    name: 'Strategic Orchestrator',
    triggers: ['strategy', 'campaign', 'launch', 'announcement', 'comprehensive'],
    capabilities: ['Multi-channel coordination', 'Campaign planning', 'Resource allocation']
  }
};

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

    console.log('🎯 Niv Orchestrator Request:', { 
      message: message.substring(0, 100), 
      sessionId, 
      mode,
      messageHistory: messages.length 
    });

    // Detect which MCPs should be triggered
    const triggeredMCPs = detectMCPTriggers(message);
    console.log('🔌 MCPs Triggered:', triggeredMCPs.map(m => m.name));

    // Build enhanced system prompt with MCP context
    const systemPrompt = buildSystemPrompt(triggeredMCPs);

    // Get Claude API response
    let aiResponse;
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      console.error('❌ No Claude API key found!');
      throw new Error('Claude API key not configured');
    }

    try {
      const anthropic = new Anthropic({
        apiKey: CLAUDE_API_KEY,
      });

      console.log('🤖 Calling Claude API...');
      
      const claudeMessages = [
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: 'user', content: message }
      ];

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: claudeMessages
      });

      aiResponse = response.content[0].text;
      console.log('✅ Claude API response received:', aiResponse.substring(0, 100) + '...');
      
    } catch (claudeError) {
      console.error('❌ Claude API Error:', claudeError);
      
      // Enhanced fallback that's still useful
      aiResponse = generateEnhancedFallback(message, triggeredMCPs);
    }

    // Determine if this should create an artifact (only for substantial strategic content)
    const artifactAnalysis = analyzeForArtifact(message, aiResponse);
    
    let artifact = null;
    let chatMessage = aiResponse;
    
    if (artifactAnalysis.shouldCreate) {
      artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: artifactAnalysis.type,
        title: artifactAnalysis.title,
        content: aiResponse,
        created: new Date().toISOString(),
        mcpsUsed: triggeredMCPs.map(m => m.name)
      };
      
      // Provide a brief chat message when artifact is created
      chatMessage = `I've created a comprehensive ${artifactAnalysis.type.replace('-', ' ')} for you. ${triggeredMCPs.length > 0 ? `This leverages insights from: ${triggeredMCPs.map(m => m.name).join(', ')}.` : ''} You can find it in the workspace panel.`;
    }

    // Build MCP insights object
    const mcpInsights = {};
    triggeredMCPs.forEach(mcp => {
      mcpInsights[mcp.id] = {
        name: mcp.name,
        capabilities: mcp.capabilities,
        relevance: `Applied for ${mcp.triggers.filter(t => message.toLowerCase().includes(t)).join(', ')}`
      };
    });

    // Return orchestrated response
    const response = {
      response: aiResponse,
      message: aiResponse,
      chatMessage: chatMessage,
      shouldSave: artifactAnalysis.shouldCreate,
      artifact,
      sessionId,
      mcpsTriggered: triggeredMCPs.map(m => m.id),
      mcpInsights,
      orchestrationMetadata: {
        claudeModel: 'claude-haiku-4-5-20251001',
        mcpsActive: triggeredMCPs.length,
        artifactCreated: !!artifact,
        responseType: artifactAnalysis.type || 'chat'
      }
    };

    console.log('🚀 Orchestration complete:', {
      sessionId,
      mcpsTriggered: triggeredMCPs.length,
      artifactCreated: !!artifact,
      responseLength: aiResponse.length
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Orchestrator error:', error);
    
    return res.status(200).json({
      response: `I understand you need help with: "${req.body.message}". I'm experiencing a temporary issue but I'm still here to help with your PR strategy.`,
      message: 'Ready to assist with your PR needs.',
      chatMessage: 'How can I help with your PR strategy?',
      shouldSave: false,
      error: error.message,
      mcpsTriggered: [],
      mcpInsights: {}
    });
  }
}

// Helper Functions

function detectMCPTriggers(message) {
  const lowerMessage = message.toLowerCase();
  const triggered = [];
  
  for (const [id, config] of Object.entries(MCP_SERVERS)) {
    const isTriggered = config.triggers.some(trigger => lowerMessage.includes(trigger));
    if (isTriggered) {
      triggered.push({ id, ...config });
    }
  }
  
  // If no specific MCP triggered but it's a complex request, use orchestrator
  if (triggered.length === 0 && lowerMessage.length > 50) {
    const words = lowerMessage.split(' ');
    if (words.includes('help') || words.includes('draft') || words.includes('create') || words.includes('write')) {
      triggered.push({ id: 'orchestrator', ...MCP_SERVERS.orchestrator });
    }
  }
  
  return triggered;
}

function buildSystemPrompt(triggeredMCPs) {
  let prompt = `You are Niv, an elite AI PR strategist with 20 years of experience at the highest levels of public relations. You're not just an advisor - you're a strategic partner who has managed PR for Fortune 500 companies, handled international crises, and launched countless successful campaigns.

Your expertise spans:
- Press releases and media relations
- Crisis communications and reputation management
- Brand positioning and narrative development
- Executive thought leadership
- Social media strategy and viral campaigns
- Stakeholder engagement and investor relations
- Regulatory communications
`;

  if (triggeredMCPs.length > 0) {
    prompt += `\n\nFor this request, you're drawing on specialized expertise from:\n`;
    
    triggeredMCPs.forEach(mcp => {
      prompt += `\n**${mcp.name}**:\n`;
      mcp.capabilities.forEach(cap => {
        prompt += `- ${cap}\n`;
      });
    });
    
    prompt += `\nIntegrate these specialized capabilities into your response to provide comprehensive, actionable guidance.`;
  }
  
  prompt += `\n\nProvide strategic, detailed, and actionable responses. When creating content like press releases, media lists, or strategic plans, provide complete, professional-grade deliverables that can be used immediately. Include specific examples, names, timelines, and tactical details.`;
  
  return prompt;
}

function analyzeForArtifact(message, response) {
  const lowerMessage = message.toLowerCase();
  const responseLength = response.length;
  
  // Don't create artifacts for simple questions or short responses
  if (responseLength < 500) {
    return { shouldCreate: false };
  }
  
  // Check for artifact-worthy content types
  const artifactTypes = [
    { keywords: ['press release', 'announcement'], type: 'press-release', minLength: 800 },
    { keywords: ['media list', 'journalist', 'reporters'], type: 'media-list', minLength: 600 },
    { keywords: ['crisis', 'emergency', 'damage control'], type: 'crisis-response', minLength: 1000 },
    { keywords: ['strategy', 'campaign', 'plan'], type: 'strategic-plan', minLength: 1000 },
    { keywords: ['ceo', 'executive', 'leadership'], type: 'executive-comms', minLength: 800 },
    { keywords: ['launch', 'product announcement'], type: 'launch-plan', minLength: 900 },
    { keywords: ['social media', 'viral', 'influencer'], type: 'social-strategy', minLength: 700 }
  ];
  
  for (const artifactType of artifactTypes) {
    const hasKeyword = artifactType.keywords.some(kw => lowerMessage.includes(kw));
    if (hasKeyword && responseLength >= artifactType.minLength) {
      // Extract a meaningful title
      const title = extractTitle(message, artifactType.type);
      return {
        shouldCreate: true,
        type: artifactType.type,
        title
      };
    }
  }
  
  return { shouldCreate: false };
}

function extractTitle(message, type) {
  // Clean up the message for a title
  let title = message.substring(0, 60).trim();
  
  // Remove common prefixes
  const prefixes = ['i need', 'help me', 'create', 'write', 'draft', 'can you', 'please'];
  prefixes.forEach(prefix => {
    if (title.toLowerCase().startsWith(prefix)) {
      title = title.substring(prefix.length).trim();
    }
  });
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Add type prefix if not redundant
  const typeLabel = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!title.toLowerCase().includes(type.split('-')[0])) {
    title = `${typeLabel}: ${title}`;
  }
  
  return title;
}

function generateEnhancedFallback(message, triggeredMCPs) {
  const lowerMessage = message.toLowerCase();
  
  let response = `As Niv, your strategic PR advisor, I understand you need assistance with: "${message}"\n\n`;
  
  if (triggeredMCPs.length > 0) {
    response += `Based on your request, I'm applying expertise from: ${triggeredMCPs.map(m => m.name).join(', ')}.\n\n`;
  }
  
  // Provide specific guidance based on keywords
  if (lowerMessage.includes('press release')) {
    response += `For your press release, I recommend the following structure:\n\n`;
    response += `**HEADLINE**: Create a compelling, newsworthy headline that captures the essence of your announcement\n\n`;
    response += `**LEAD PARAGRAPH**: Answer the who, what, when, where, and why in the first 2-3 sentences\n\n`;
    response += `**SUPPORTING DETAILS**: Provide context, data, and evidence that validates your news\n\n`;
    response += `**QUOTE**: Include a powerful quote from leadership that adds human perspective\n\n`;
    response += `**BOILERPLATE**: Standard company description and contact information\n\n`;
    response += `Key considerations:\n`;
    response += `- Target journalists who cover your industry vertical\n`;
    response += `- Time the release for maximum impact (typically Tuesday-Thursday, 10am ET)\n`;
    response += `- Include multimedia assets when possible\n`;
    response += `- Follow up with personalized pitches to tier-1 media`;
  } else if (lowerMessage.includes('crisis')) {
    response += `**IMMEDIATE CRISIS RESPONSE FRAMEWORK**\n\n`;
    response += `1. **Assess** (First 30 minutes):\n`;
    response += `   - Gather all facts\n`;
    response += `   - Identify stakeholders impacted\n`;
    response += `   - Evaluate severity and potential spread\n\n`;
    response += `2. **Activate** (Within 1 hour):\n`;
    response += `   - Convene crisis team\n`;
    response += `   - Designate spokesperson\n`;
    response += `   - Prepare holding statement\n\n`;
    response += `3. **Communicate** (Within 2 hours):\n`;
    response += `   - Issue initial response\n`;
    response += `   - Brief internal teams\n`;
    response += `   - Monitor media and social\n\n`;
    response += `4. **Manage** (Ongoing):\n`;
    response += `   - Regular updates\n`;
    response += `   - Stakeholder outreach\n`;
    response += `   - Course corrections as needed`;
  } else {
    response += `I can help you with:\n\n`;
    response += `• **Strategic PR Planning**: Campaign development, messaging frameworks, audience targeting\n`;
    response += `• **Media Relations**: Press releases, media lists, journalist outreach, pitch development\n`;
    response += `• **Crisis Management**: Response strategies, stakeholder communications, reputation recovery\n`;
    response += `• **Executive Communications**: Thought leadership, speaking opportunities, executive positioning\n`;
    response += `• **Content Strategy**: Blog posts, op-eds, social media content, marketing collateral\n\n`;
    response += `Please provide more details about your specific needs, and I'll create a comprehensive strategic response.`;
  }
  
  return response;
}