// AI Assistant Chat with Claude
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { 
    message,
    context = 'general',
    conversationHistory = [],
    projectData = null
  } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for assistant...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are SignalDesk AI, an intelligent PR and communications assistant. You help with:
- Strategic PR planning and campaign development
- Content creation and messaging
- Media relations and outreach strategies
- Crisis communication planning
- Market intelligence and competitor analysis
- Stakeholder engagement strategies

Be helpful, professional, and provide actionable insights. When relevant, reference industry best practices and current trends.`;
      
      // Build conversation context
      let conversationContext = '';
      if (conversationHistory.length > 0) {
        conversationContext = 'Previous conversation:\n';
        conversationHistory.slice(-5).forEach(msg => {
          conversationContext += `${msg.role}: ${msg.content}\n`;
        });
        conversationContext += '\n';
      }
      
      const projectContext = projectData ? `\nProject Context: ${JSON.stringify(projectData)}\n` : '';
      
      const userPrompt = `${conversationContext}${projectContext}
Current Context: ${context}
User Message: ${message}

Provide a helpful response that addresses the user's query.`;
      
      const aiMessage = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const response = aiMessage.content[0].text;
      
      // Generate suggested follow-up questions
      const suggestions = generateSuggestions(message, context);
      
      return res.status(200).json({
        success: true,
        message: response,
        suggestions,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          context,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback response
  console.log('Using template assistant response');
  const templateResponse = generateTemplateResponse(message, context);
  const suggestions = generateSuggestions(message, context);
  
  return res.status(200).json({
    success: true,
    message: templateResponse,
    suggestions,
    metadata: {
      powered_by: 'Template Engine',
      context,
      timestamp: new Date().toISOString()
    }
  });
}

function generateTemplateResponse(message, context) {
  const messageLower = message.toLowerCase();
  
  // Context-specific responses
  if (context === 'campaign' && messageLower.includes('strategy')) {
    return `For your campaign strategy, consider these key elements:

1. **Define Clear Objectives**: What specific outcomes do you want to achieve?
2. **Identify Target Audiences**: Who are your key stakeholders?
3. **Develop Key Messages**: What core points need to resonate?
4. **Select Channels**: Which platforms will reach your audience best?
5. **Set Metrics**: How will you measure success?

Would you like me to help you develop any of these specific areas?`;
  }
  
  if (messageLower.includes('media') && messageLower.includes('list')) {
    return `To build an effective media list:

1. **Identify Relevant Beats**: Focus on journalists covering your industry
2. **Research Recent Coverage**: Find reporters writing about similar topics
3. **Verify Contact Information**: Ensure emails and preferences are current
4. **Personalize Your Approach**: Understand each journalist's interests
5. **Track Engagement**: Monitor opens, responses, and coverage

I can help you identify specific journalists or refine your targeting strategy.`;
  }
  
  if (messageLower.includes('crisis')) {
    return `Crisis communication requires swift, strategic action:

1. **Assess the Situation**: Understand scope and potential impact
2. **Activate Response Team**: Mobilize your crisis management team
3. **Craft Key Messages**: Develop clear, consistent messaging
4. **Communicate Proactively**: Don't wait for the story to develop
5. **Monitor and Adapt**: Track sentiment and adjust strategy

What specific aspect of crisis management would you like to explore?`;
  }
  
  // Default response
  return `I understand you're asking about: "${message}"

In the context of ${context}, here are some considerations:

• Analyze your current situation and objectives
• Identify key stakeholders and their needs
• Develop targeted strategies and tactics
• Implement with clear metrics for success
• Monitor, measure, and optimize continuously

How can I help you develop this further?`;
}

function generateSuggestions(message, context) {
  const suggestions = {
    campaign: [
      'How do I identify the right media outlets?',
      'What makes a compelling press release?',
      'How should I measure campaign success?'
    ],
    crisis: [
      'What should be in our crisis communication plan?',
      'How do we handle social media during a crisis?',
      'When should we engage legal counsel?'
    ],
    media: [
      'How do I build relationships with journalists?',
      'What makes a good media pitch?',
      'How do I track media coverage effectively?'
    ],
    general: [
      'How can I improve our PR strategy?',
      'What are current PR best practices?',
      'How do I demonstrate PR ROI?'
    ]
  };
  
  return suggestions[context] || suggestions.general;
}