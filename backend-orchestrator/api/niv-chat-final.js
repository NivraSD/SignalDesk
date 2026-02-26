// Final Vercel Serverless Function with Claude Integration
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

    // Check if we have Claude API key
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    let aiResponse;
    
    if (CLAUDE_API_KEY) {
      // Call Claude API for real AI response
      try {
        const systemPrompt = `You are Niv, an elite AI PR strategist with 20 years of experience. You're not just an advisor - you're a strategic partner helping organizations achieve PR excellence.

Your expertise includes:
- Press releases and announcements
- Media relations and journalist outreach  
- Crisis communications and damage control
- Brand messaging and positioning
- Social media strategy
- Executive thought leadership
- PR campaign planning and execution
- Stakeholder management

Provide strategic, actionable advice. Be specific and helpful. When the user mentions press releases, media lists, announcements, or strategic content, create comprehensive, detailed responses that can serve as actual work products.

For press releases: Include headline, subheadline, lead paragraph, body paragraphs, quotes, and boilerplate.
For media lists: Include journalist names, outlets, beats, and contact approach.
For announcements: Include messaging framework, distribution strategy, and timeline.`;

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',  // Fixed model name
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
          })
        });

        if (claudeResponse.ok) {
          const data = await claudeResponse.json();
          aiResponse = data.content[0].text;
        } else {
          console.error('Claude API error:', await claudeResponse.text());
          // Fallback to helpful response
          aiResponse = generateFallbackResponse(message);
        }
      } catch (error) {
        console.error('Error calling Claude:', error);
        aiResponse = generateFallbackResponse(message);
      }
    } else {
      // No API key - use fallback
      aiResponse = generateFallbackResponse(message);
    }

    // Detect if we should create an artifact
    const shouldSave = message.toLowerCase().includes('press') ||
                       message.toLowerCase().includes('media') ||
                       message.toLowerCase().includes('announce') ||
                       message.toLowerCase().includes('strategy') ||
                       message.toLowerCase().includes('crisis') ||
                       message.toLowerCase().includes('ceo') ||
                       message.toLowerCase().includes('launch');
    
    let artifact = null;
    if (shouldSave) {
      const artifactTypes = {
        'press': 'press-release',
        'media': 'media-list',
        'announce': 'announcement',
        'strategy': 'strategic-plan',
        'crisis': 'crisis-response',
        'ceo': 'executive-announcement',
        'launch': 'launch-plan'
      };
      
      let artifactType = 'strategic-content';
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
      artifactCreated: shouldSave,
      hasClaudeResponse: !!CLAUDE_API_KEY
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Niv orchestrator error:', error);
    
    // Fallback response
    return res.status(200).json({
      response: generateFallbackResponse(req.body.message || ''),
      message: 'Ready to help with your PR needs.',
      chatMessage: 'How can I assist with your PR strategy today?',
      shouldSave: false,
      error: error.message,
    });
  }
}

// Helper function for fallback responses
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('press release')) {
    return `For your press release, here's a strategic framework:

**HEADLINE**: [Your announcement in 10 words or less]

**SUBHEADLINE**: [Supporting detail that expands the main news]

**[CITY, State] – [Date]** – [Lead paragraph answering Who, What, When, Where, Why in 30 words or less]

**Body Paragraph 1**: Expand on the significance and impact of your announcement. Include specific details about what makes this newsworthy.

**Body Paragraph 2**: "Include a powerful quote from leadership that adds human perspective and authority to the announcement," said [Name], [Title] at [Company].

**Body Paragraph 3**: Provide context and background. Explain how this fits into your company's broader mission and strategy.

**Body Paragraph 4**: Discuss future implications and next steps. What does this mean for stakeholders?

**About [Company]**: [100-word boilerplate describing your company, mission, and key achievements]

**Media Contact**:
[Name]
[Title]
[Email]
[Phone]`;
  }
  
  if (lowerMessage.includes('media') && lowerMessage.includes('list')) {
    return `Here's your targeted media list structure:

**Tier 1 - National Media**
• Tech/Business outlets relevant to your industry
• Beat reporters who cover your sector
• Include: Name, Outlet, Email, Recent relevant coverage

**Tier 2 - Trade Publications**
• Industry-specific publications
• Specialist journalists in your field
• Include: Publication focus, submission guidelines

**Tier 3 - Regional/Local**
• Local business journals
• Regional newspapers
• Community publications

**Approach Strategy**:
1. Exclusive offers to Tier 1 contacts
2. Embargoed pitches to Tier 2
3. Wide release to Tier 3

**Personalization Tips**:
- Reference their recent work
- Explain why this matters to their audience
- Provide unique angles for each tier`;
  }
  
  if (lowerMessage.includes('ceo') || lowerMessage.includes('executive')) {
    return `For your CEO/executive announcement:

**Strategic Messaging Framework**:

**Primary Message**: [New leader] brings [specific expertise] to drive [company goal]

**Key Proof Points**:
• Previous achievement that demonstrates capability
• Relevant industry experience
• Vision alignment with company direction

**Stakeholder-Specific Messages**:
• **Employees**: Leadership continuity and exciting vision
• **Customers**: Enhanced value and innovation
• **Investors**: Strategic expertise and growth potential
• **Media**: Newsworthy background and industry perspective

**Distribution Strategy**:
1. Internal announcement first (maintain morale)
2. Key stakeholder notifications
3. Media outreach with exclusive interviews
4. Broad public announcement
5. Social media amplification

**Timeline**: 
- T-24hrs: Employee notification
- T-2hrs: Key customer/partner calls
- T-0: Press release and media outreach
- T+1hr: Social media posts
- T+1day: Follow-up with trade media`;
  }
  
  return `I understand you need help with: "${message}". As Niv, your AI PR strategist, I can assist with:
    
• Press releases and announcements
• Media strategies and journalist outreach  
• Crisis management and damage control
• Strategic PR planning and campaigns
• Executive positioning and thought leadership

What specific aspect would you like me to help you develop?`;
}