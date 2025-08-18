// Complete Niv Orchestrator - Simplified without SDK dependencies
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

    console.log('🎯 Niv Complete Orchestrator:', { 
      message: message.substring(0, 100), 
      sessionId,
      hasClaudeKey: !!process.env.CLAUDE_API_KEY
    });

    // MCP Detection
    const mcpTriggers = detectMCPs(message);
    console.log('🔌 MCPs detected:', mcpTriggers);

    // Get AI response
    let aiResponse;
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (CLAUDE_API_KEY) {
      try {
        console.log('📡 Calling Claude API...');
        
        const systemPrompt = buildSystemPrompt(mcpTriggers);
        
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',  // Using latest Sonnet model
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

        if (claudeResponse.ok) {
          const data = await claudeResponse.json();
          console.log('✅ Claude responded successfully');
          aiResponse = data.content[0].text;
        } else {
          const errorText = await claudeResponse.text();
          console.error('❌ Claude API error:', errorText);
          aiResponse = generateStrategicFallback(message, mcpTriggers);
        }
      } catch (error) {
        console.error('❌ Claude call failed:', error.message);
        aiResponse = generateStrategicFallback(message, mcpTriggers);
      }
    } else {
      console.log('⚠️ No Claude API key, using strategic fallback');
      aiResponse = generateStrategicFallback(message, mcpTriggers);
    }

    // Artifact detection
    const artifactInfo = analyzeForArtifact(message, aiResponse);
    
    let artifact = null;
    let chatMessage = aiResponse;
    
    if (artifactInfo.shouldCreate) {
      artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: artifactInfo.type,
        title: artifactInfo.title,
        content: aiResponse,
        created: new Date().toISOString(),
        mcpsUsed: mcpTriggers
      };
      
      chatMessage = `I've created a ${artifactInfo.type.replace('-', ' ')} for you. ${mcpTriggers.length > 0 ? `This leverages: ${mcpTriggers.join(', ')}.` : ''} Check the workspace panel.`;
    }

    // Response - Include both artifact AND workItems for compatibility
    const response = {
      response: aiResponse,
      message: aiResponse,
      chatMessage: chatMessage,
      shouldSave: artifactInfo.shouldCreate,
      artifact,
      // Also include workItems array for frontend compatibility
      // IMPORTANT: Frontend expects both 'content' at root AND 'generatedContent' object
      workItems: artifact ? [{
        type: artifact.type || 'artifact',  // Use the actual artifact type (press-release, media-list, etc.)
        id: artifact.id,
        title: artifact.title,
        content: artifact.content,  // Direct content for NivWorkspace
        generatedContent: { 
          content: artifact.content,  // Also in generatedContent for other components
          type: artifact.type
        },
        created: artifact.created
      }] : [],
      sessionId,
      mcpsTriggered: mcpTriggers,
      mcpInsights: buildMCPInsights(mcpTriggers, message),
      metadata: {
        model: 'claude-3.5-sonnet',
        mcpsActive: mcpTriggers.length,
        artifactCreated: !!artifact
      }
    };

    console.log('🚀 Response ready:', {
      sessionId,
      mcps: mcpTriggers.length,
      artifact: !!artifact,
      responseLength: aiResponse.length
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return res.status(200).json({
      response: `I understand you need help with: "${req.body.message}". Let me assist you with strategic PR guidance.`,
      message: 'Ready to help.',
      chatMessage: 'How can I assist with your PR strategy?',
      shouldSave: false,
      mcpsTriggered: [],
      error: error.message
    });
  }
}

// MCP Detection
function detectMCPs(message) {
  const lower = message.toLowerCase();
  const mcps = [];
  
  const mcpMap = {
    'crisis': ['crisis', 'emergency', 'urgent', 'damage', 'scandal'],
    'social': ['social', 'twitter', 'linkedin', 'viral', 'trending'],
    'narratives': ['narrative', 'story', 'messaging', 'positioning'],
    'stakeholders': ['stakeholder', 'investor', 'employee', 'customer'],
    'regulatory': ['regulatory', 'compliance', 'government', 'SEC', 'FDA'],
    'orchestrator': ['strategy', 'campaign', 'launch', 'comprehensive']
  };
  
  for (const [mcp, triggers] of Object.entries(mcpMap)) {
    if (triggers.some(t => lower.includes(t))) {
      mcps.push(mcp);
    }
  }
  
  // Default to orchestrator for complex requests
  if (mcps.length === 0 && lower.split(' ').length > 10) {
    mcps.push('orchestrator');
  }
  
  return mcps;
}

// Build system prompt with MCP context
function buildSystemPrompt(mcpTriggers) {
  let prompt = `You are Niv, an elite AI PR strategist with 20 years of experience. You've managed PR for Fortune 500 companies, handled international crises, and launched countless successful campaigns.

Your core expertise:
• Press releases and media relations
• Crisis communications and reputation management  
• Brand positioning and narrative development
• Executive thought leadership
• Social media strategy
• Stakeholder engagement
• Regulatory communications

`;

  if (mcpTriggers.length > 0) {
    prompt += `\nFor this request, you're leveraging specialized intelligence from:\n`;
    
    const mcpDescriptions = {
      'crisis': '**Crisis Management**: Real-time assessment, rapid response, stakeholder messaging',
      'social': '**Social Intelligence**: Sentiment analysis, influencer mapping, viral strategies',
      'narratives': '**Narrative Intelligence**: Message frameworks, story development, perception shaping',
      'stakeholders': '**Stakeholder Analysis**: Interest mapping, engagement strategies, coalition building',
      'regulatory': '**Regulatory Intelligence**: Compliance messaging, policy navigation, government relations',
      'orchestrator': '**Strategic Orchestration**: Multi-channel campaigns, resource optimization, timeline planning'
    };
    
    mcpTriggers.forEach(mcp => {
      if (mcpDescriptions[mcp]) {
        prompt += `${mcpDescriptions[mcp]}\n`;
      }
    });
  }
  
  prompt += `\nProvide strategic, detailed, actionable responses. For content creation (press releases, plans, etc.), deliver complete, professional-grade materials ready for immediate use. Include specific examples, timelines, and tactical steps.`;
  
  return prompt;
}

// Analyze for artifact creation
function analyzeForArtifact(message, response) {
  // Don't create artifacts for short responses
  if (response.length < 600) {
    return { shouldCreate: false };
  }
  
  const lower = message.toLowerCase();
  
  const artifactTypes = [
    { keywords: ['press release', 'announcement'], type: 'press-release', minLength: 800 },
    { keywords: ['media list', 'journalist'], type: 'media-list', minLength: 600 },
    { keywords: ['crisis', 'emergency'], type: 'crisis-response', minLength: 900 },
    { keywords: ['strategy', 'campaign'], type: 'strategic-plan', minLength: 900 },
    { keywords: ['ceo', 'executive'], type: 'executive-comms', minLength: 700 },
    { keywords: ['launch', 'product'], type: 'launch-plan', minLength: 800 },
    { keywords: ['social media', 'viral'], type: 'social-strategy', minLength: 700 }
  ];
  
  for (const type of artifactTypes) {
    if (type.keywords.some(k => lower.includes(k)) && response.length >= type.minLength) {
      return {
        shouldCreate: true,
        type: type.type,
        title: createTitle(message, type.type)
      };
    }
  }
  
  return { shouldCreate: false };
}

// Create artifact title
function createTitle(message, type) {
  let title = message.substring(0, 50).trim();
  
  // Remove common prefixes
  ['i need', 'help me', 'create', 'write', 'draft'].forEach(prefix => {
    if (title.toLowerCase().startsWith(prefix)) {
      title = title.substring(prefix.length).trim();
    }
  });
  
  // Capitalize
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Add type if not redundant
  const typeLabel = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (!title.toLowerCase().includes(type.split('-')[0])) {
    title = `${typeLabel}: ${title}`;
  }
  
  return title;
}

// Build MCP insights
function buildMCPInsights(mcpTriggers, message) {
  const insights = {};
  
  const capabilities = {
    'crisis': ['Real-time threat assessment', 'Response strategy', 'Stakeholder prioritization'],
    'social': ['Sentiment tracking', 'Influencer identification', 'Viral optimization'],
    'narratives': ['Message development', 'Story architecture', 'Perception management'],
    'stakeholders': ['Interest mapping', 'Coalition building', 'Engagement planning'],
    'regulatory': ['Compliance strategy', 'Policy navigation', 'Government relations'],
    'orchestrator': ['Campaign coordination', 'Resource allocation', 'Timeline optimization']
  };
  
  mcpTriggers.forEach(mcp => {
    insights[mcp] = {
      name: mcp.charAt(0).toUpperCase() + mcp.slice(1),
      capabilities: capabilities[mcp] || [],
      applied: true
    };
  });
  
  return insights;
}

// Strategic fallback
function generateStrategicFallback(message, mcpTriggers) {
  const lower = message.toLowerCase();
  
  if (lower.includes('press release')) {
    return `# Press Release Framework

## HEADLINE
[Company] Announces [Major News] to [Impact/Benefit]

## SUBHEADLINE  
[Expanding detail that reinforces the main announcement]

## DATELINE
[CITY, State] – [Month Day, Year] – 

## LEAD PARAGRAPH
[Company name], a [brief company description], today announced [the news] that will [key benefit/impact]. This [announcement/launch/partnership] represents [significance to industry/customers].

## BODY SECTION 1: The Details
[Expand on the announcement with specific details, features, capabilities, or scope. Include data points, statistics, or concrete examples that validate the importance.]

## BODY SECTION 2: Strategic Context
"[Powerful quote from CEO/Executive that provides vision and strategic context]," said [Name], [Title] at [Company]. "[Additional sentence about why this matters to stakeholders]."

## BODY SECTION 3: Market Impact
[Discuss the broader implications for the industry, market, or customers. Include relevant market data or trends that contextualize the announcement.]

## BODY SECTION 4: Availability & Next Steps
[Specific details about timing, availability, pricing if relevant, and how interested parties can learn more or take action.]

## ABOUT [COMPANY]
[100-150 word boilerplate describing the company, its mission, key achievements, and market position]

## MEDIA CONTACT
[Name]
[Title]
[Email]
[Phone]
[Company Website]

### PR DISTRIBUTION STRATEGY
- **Tier 1**: Exclusive briefings with top-tier media 24 hours before
- **Tier 2**: Embargoed release to trade publications 
- **Tier 3**: Wire distribution at market open
- **Digital**: Social media cascade across all channels
- **Internal**: Employee announcement 1 hour before public`;
  }
  
  if (lower.includes('crisis')) {
    return `# Crisis Response Protocol

## IMMEDIATE ACTIONS (First Hour)

### 1. Assess & Contain
- Gather all facts from reliable sources
- Identify scope and potential escalation
- Implement immediate containment measures
- Document timeline of events

### 2. Activate Crisis Team
- CEO/President
- Head of Communications  
- Legal Counsel
- Operations Lead
- HR (if employee-related)
- Designated Spokesperson

### 3. Stakeholder Mapping
**Internal:**
- Employees (all-hands within 2 hours)
- Board of Directors
- Key investors

**External:**
- Affected customers/users
- Media (prepare holding statement)
- Regulators (if applicable)
- Partners/vendors

## COMMUNICATION FRAMEWORK

### Holding Statement (Issue within 90 minutes)
"We are aware of [situation] and take this matter extremely seriously. We are investigating the circumstances and will provide updates as more information becomes available. [If applicable: The safety and security of our customers/employees is our top priority.]"

### Key Messages
1. **Acknowledgment**: We recognize the seriousness
2. **Action**: Here's what we're doing
3. **Accountability**: We take responsibility
4. **Resolution**: Path forward and timeline

### Media Response Strategy
- Single designated spokesperson
- No speculation, stick to facts
- Regular update cadence (every 4-6 hours initially)
- Monitor social media sentiment continuously

## RECOVERY PLAN
1. Root cause analysis
2. Corrective actions implementation  
3. Stakeholder confidence rebuilding
4. Lessons learned documentation
5. Crisis preparedness improvements`;
  }
  
  return `# Strategic PR Guidance

Based on your request: "${message}"

${mcpTriggers.length > 0 ? `## Leveraging MCP Intelligence: ${mcpTriggers.join(', ')}\n\n` : ''}

## Strategic Recommendations

### Immediate Actions
1. **Define Clear Objectives**
   - What specific outcome do you need?
   - Who is your target audience?
   - What's your timeline?

2. **Develop Core Messaging**
   - Primary value proposition
   - Supporting proof points
   - Differentiation factors

3. **Identify Key Channels**
   - Media relations (earned)
   - Social media (owned)
   - Influencer partnerships (paid)
   - Executive platforms (shared)

### Tactical Execution

**Media Strategy**
- Develop targeted media list
- Create compelling pitch angles
- Prepare spokesperson briefing
- Schedule strategic embargoes

**Content Development**
- Press materials
- Social media assets
- Executive talking points
- Q&A documentation

**Measurement Framework**
- Media coverage quality/quantity
- Message penetration
- Stakeholder sentiment
- Business impact metrics

## Next Steps

Please provide more specific details about:
- Your company/organization
- The specific announcement or situation
- Target audiences
- Timeline and constraints
- Desired outcomes

This will allow me to create detailed, actionable materials tailored to your exact needs.`;
}