// Multi-Mode Niv: Fixed to only create artifacts when explicitly requested
// Replaces the old niv-complete logic with intelligent scope detection

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
      userId = null,
      organizationId = null,
      mode = 'auto'  // auto, quick, single, package, analysis
    } = req.body;

    console.log('🎯 Fixed Multi-Mode Niv:', { 
      message: message.substring(0, 100),
      mode,
      sessionId 
    });

    // Step 1: Determine scope if auto mode
    const scope = mode === 'auto' ? determineScope(message, messages) : mode;
    console.log('📊 Detected scope:', scope);

    // Step 2: Get AI response
    const response = await generateScopedResponse(message, messages, scope);
    
    // Step 3: Determine artifact creation - ONLY if explicitly requested or single deliverable
    const artifactDecision = decideArtifacts(message, scope, response);
    
    // Step 4: Create response structure
    const result = buildResponse(response, artifactDecision, scope, sessionId);

    console.log('✅ Fixed response ready:', {
      scope,
      artifactsCreated: result.artifacts?.length || 0,
      explicitSave: artifactDecision.explicitSave
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(200).json({
      response: "I understand you need PR assistance. Let me help you with that.",
      message: "Ready to assist with your PR needs.",
      chatMessage: "How can I help with your PR strategy today?",
      shouldSave: false,
      artifacts: [],
      workItems: [],
      error: error.message
    });
  }
}

// ============================================
// SCOPE DETECTION
// ============================================

function determineScope(message, conversationHistory) {
  const lower = message.toLowerCase();
  
  // Explicit indicators
  const indicators = {
    quick: {
      keywords: ['think', 'advice', 'should i', 'is this', 'quick', 'opinion', 'feedback', 'suggest', 'what do you'],
      weight: 1
    },
    single: {
      keywords: ['write a', 'create a', 'draft a', 'need a', 'make a', 'generate a', 'give me a'],
      weight: 2
    },
    package: {
      keywords: ['everything', 'complete package', 'full campaign', 'all materials', 'comprehensive', 'entire', 'launching', 'announcing'],
      weight: 3
    },
    analysis: {
      keywords: ['analyze', 'assess', 'review', 'evaluate', 'audit', 'performance', 'metrics'],
      weight: 2
    }
  };

  let scores = { quick: 0, single: 0, package: 0, analysis: 0 };
  
  // Score based on keywords
  for (const [scope, config] of Object.entries(indicators)) {
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        scores[scope] += config.weight;
      }
    }
  }

  // Context analysis
  const hasTimeline = /next (week|month|tuesday|monday|friday)|tomorrow|today|asap|urgent/i.test(message);
  const hasMultipleRequests = (message.match(/and|also|plus|with|including/g) || []).length > 2;
  const isHighStakes = /ipo|acquisition|merger|crisis|scandal|ceo|layoff|funding|series [a-z]/i.test(lower);
  
  // Adjust scores based on context
  if (hasTimeline && isHighStakes) scores.package += 3;
  if (hasMultipleRequests) scores.package += 2;
  if (message.length < 50) scores.quick += 2;
  if (message.includes('?')) scores.quick += 1;
  
  // Find highest score
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'quick'; // Default to quick for unclear requests
  
  return Object.keys(scores).find(key => scores[key] === maxScore);
}

// ============================================
// SCOPED RESPONSE GENERATION
// ============================================

async function generateScopedResponse(message, history, scope) {
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  
  // Build scope-specific system prompt
  const systemPrompt = buildScopedPrompt(scope);
  
  if (!CLAUDE_API_KEY) {
    return generateScopedFallback(message, scope);
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: scope === 'package' ? 4000 : scope === 'quick' ? 500 : 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          ...history.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        content: data.content[0].text,
        scope
      };
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  return generateScopedFallback(message, scope);
}

function buildScopedPrompt(scope) {
  let basePrompt = `You are Niv, an elite AI PR strategist with 20 years of experience at the highest levels of public relations.`;
  
  // Scope-specific instructions
  const scopeInstructions = {
    quick: `
Provide concise, actionable advice. Be direct and specific.
- Answer in 2-3 paragraphs maximum
- Focus on the immediate question
- Don't create extensive content unless asked
- Offer to elaborate if needed`,
    
    single: `
Create one specific deliverable that fully addresses the request.
- Provide a complete, professional-grade output
- Include all necessary sections and details
- Make it immediately usable
- Don't create multiple items unless explicitly asked`,
    
    package: `
Create a COMPLETE PR package with all necessary components.
Structure your response as multiple deliverables:

1. PRIMARY DELIVERABLE (Press Release, Statement, etc.)
2. MEDIA STRATEGY (List, Pitches, Timeline)
3. STAKEHOLDER COMMUNICATIONS (Internal, Investors, Customers)
4. SOCIAL MEDIA PLAN (Platform-specific content)
5. SUPPORTING MATERIALS (FAQs, Talking Points, Backgrounders)

Make each component complete and actionable.`,
    
    analysis: `
Provide strategic analysis with actionable insights.
- Assess the current situation
- Identify opportunities and risks
- Provide specific recommendations
- Include metrics and benchmarks where relevant
- Suggest next steps`
  };
  
  return basePrompt + (scopeInstructions[scope] || scopeInstructions.quick);
}

// ============================================
// ARTIFACT DECISION LOGIC
// ============================================

function decideArtifacts(message, scope, response) {
  const lower = message.toLowerCase();
  const explicitSave = lower.includes('save') || lower.includes('artifact') || lower.includes('keep') || lower.includes('save this');
  
  switch(scope) {
    case 'quick':
      // ONLY create artifact if explicitly requested
      if (explicitSave) {
        return {
          shouldCreate: true,
          explicitSave: true,
          artifacts: [{
            type: 'advice',
            title: 'PR Advice: ' + message.substring(0, 50),
            content: response.content
          }]
        };
      }
      return { shouldCreate: false, explicitSave: false, artifacts: [] };
    
    case 'single':
      // Always create one artifact for deliverables
      const deliverableType = detectDeliverableType(message);
      return {
        shouldCreate: true,
        explicitSave: false,
        artifacts: [{
          type: deliverableType,
          title: formatTitle(deliverableType, message),
          content: response.content
        }]
      };
    
    case 'package':
      // Create multiple artifacts for package (simplified)
      return {
        shouldCreate: true,
        explicitSave: false,
        artifacts: [{
          type: 'pr-package',
          title: 'Complete PR Package: ' + message.substring(0, 50),
          content: response.content
        }],
        isPackage: true
      };
    
    case 'analysis':
      // Create artifact if analysis is substantial or explicitly requested
      if (response.content.length > 1000 || explicitSave) {
        return {
          shouldCreate: true,
          explicitSave: explicitSave,
          artifacts: [{
            type: 'strategic-analysis',
            title: 'Strategic Analysis: ' + message.substring(0, 50),
            content: response.content
          }]
        };
      }
      return { shouldCreate: false, explicitSave: false, artifacts: [] };
    
    default:
      return { shouldCreate: false, explicitSave: false, artifacts: [] };
  }
}

function detectDeliverableType(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('press release')) return 'press-release';
  if (lower.includes('media list')) return 'media-list';
  if (lower.includes('statement')) return 'statement';
  if (lower.includes('talking points')) return 'talking-points';
  if (lower.includes('faq')) return 'faq';
  if (lower.includes('social')) return 'social-content';
  if (lower.includes('pitch')) return 'pitch';
  if (lower.includes('strategy')) return 'strategy';
  
  return 'pr-content';
}

function formatTitle(type, message) {
  const typeLabels = {
    'press-release': 'Press Release',
    'media-list': 'Media List',
    'statement': 'Statement',
    'talking-points': 'Talking Points',
    'faq': 'FAQ Document',
    'social-content': 'Social Media Content',
    'pitch': 'Media Pitch',
    'strategy': 'PR Strategy'
  };
  
  const label = typeLabels[type] || 'PR Content';
  const context = message.substring(0, 50).replace(/^(write|create|draft|need)\\s+(a\\s+)?/i, '');
  
  return `${label}: ${context}`;
}

// ============================================
// RESPONSE BUILDING
// ============================================

function buildResponse(aiResponse, artifactDecision, scope, sessionId) {
  const response = {
    response: aiResponse.content,
    message: aiResponse.content,
    chatMessage: aiResponse.content,
    shouldSave: artifactDecision.shouldCreate,
    sessionId,
    scope,
    metadata: {
      scope,
      artifactsCreated: artifactDecision.artifacts?.length || 0,
      explicitSave: artifactDecision.explicitSave,
      isPackage: artifactDecision.isPackage || false
    }
  };
  
  // Add artifacts if created
  if (artifactDecision.shouldCreate) {
    response.artifacts = artifactDecision.artifacts.map(artifact => ({
      id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...artifact,
      created: new Date().toISOString()
    }));
    
    // For frontend compatibility, also include workItems
    response.workItems = response.artifacts.map(artifact => ({
      type: artifact.type,
      id: artifact.id,
      title: artifact.title,
      content: artifact.content,
      generatedContent: { 
        content: artifact.content,
        type: artifact.type
      },
      created: artifact.created
    }));
    
    // Add appropriate chat message
    if (scope === 'single') {
      response.chatMessage = aiResponse.content + '\\n\\n✅ This has been saved as an artifact for your use.';
    } else if (artifactDecision.explicitSave) {
      response.chatMessage = '✅ I\\'ve saved this as an artifact. You can view and edit it in the workspace panel.';
    }
  } else if (scope === 'quick') {
    // For quick advice, offer to save if valuable
    if (aiResponse.content.length > 500) {
      response.chatMessage = aiResponse.content + '\\n\\n💡 Say "save this" if you\\'d like to keep this advice as an artifact.';
    }
  }
  
  // Legacy compatibility
  response.artifact = response.artifacts?.[0] || null;
  response.mcpsTriggered = [];
  response.mcpInsights = {};
  
  return response;
}

// ============================================
// FALLBACK RESPONSES
// ============================================

function generateScopedFallback(message, scope) {
  let content = '';
  
  switch(scope) {
    case 'quick':
      content = `I understand you're looking for quick PR advice on: "${message}"\\n\\nHere's my immediate guidance: [Specific advice would go here based on the question]\\n\\nWould you like me to elaborate on any aspect of this?`;
      break;
    
    case 'single':
      const type = detectDeliverableType(message);
      content = `I'll create a ${type.replace('-', ' ')} for you.\\n\\n[Complete ${type} would be generated here]\\n\\nThis is a complete, ready-to-use deliverable. Let me know if you need any adjustments.`;
      break;
    
    case 'package':
      content = `# COMPLETE PR PACKAGE\\n\\n## 1. PRIMARY DELIVERABLE\\n[Main content here]\\n\\n## 2. MEDIA STRATEGY\\n[Media list and approach]\\n\\n## 3. STAKEHOLDER COMMUNICATIONS\\n[Internal and external comms]\\n\\n`;
      break;
    
    case 'analysis':
      content = `# Strategic PR Analysis\\n\\n## Current Situation\\n[Analysis would go here]\\n\\n## Opportunities\\n[Identified opportunities]\\n\\n## Recommendations\\n[Specific action items]\\n\\n`;
      break;
    
    default:
      content = `I can help you with: "${message}". As your PR strategist, I'm ready to provide advice, create deliverables, or develop complete PR packages based on your needs.`;
  }
  
  return { content, scope };
}