// Crisis Advisor - AI-powered crisis management advice
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
  
  const { 
    message,
    context = {},
    severity = 'medium'
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
      console.log('Using Claude AI for crisis advice...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are an expert crisis management advisor. Provide immediate, actionable advice for crisis situations. Be calm, professional, and focus on practical steps. Consider legal, reputational, and operational implications.`;
      
      const contextInfo = context.scenario ? `\nContext: ${JSON.stringify(context)}` : '';
      const userPrompt = `Crisis Query: ${message}
Severity: ${severity}${contextInfo}

Provide clear, actionable crisis management advice including:
1. Immediate actions to take
2. Key stakeholders to notify
3. Communication strategy
4. Risk mitigation steps
5. Success metrics to track`;
      
      const aiMessage = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const response = aiMessage.content[0].text;
      
      return res.status(200).json({
        success: true,
        response,
        suggestions: generateSuggestions(message, severity),
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          severity,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback response
  console.log('Using template crisis advisor');
  const templateResponse = generateTemplateAdvice(message, severity, context);
  
  return res.status(200).json({
    success: true,
    response: templateResponse,
    suggestions: generateSuggestions(message, severity),
    metadata: {
      powered_by: 'Template Engine',
      severity,
      timestamp: new Date().toISOString()
    }
  });
}

function generateSuggestions(message, severity) {
  const suggestions = {
    high: [
      'Activate full crisis response team immediately',
      'Prepare holding statement for media',
      'Brief legal counsel',
      'Monitor social media sentiment'
    ],
    medium: [
      'Convene core crisis team',
      'Assess full scope of situation',
      'Draft initial response strategy',
      'Identify key stakeholders'
    ],
    low: [
      'Monitor situation development',
      'Prepare contingency plans',
      'Review crisis protocols',
      'Update team on status'
    ]
  };
  
  return suggestions[severity] || suggestions.medium;
}

function generateTemplateAdvice(message, severity, context) {
  const severityPrefix = {
    high: 'URGENT - IMMEDIATE ACTION REQUIRED',
    medium: 'IMPORTANT - PROMPT ATTENTION NEEDED',
    low: 'ADVISORY - MONITOR AND PREPARE'
  };
  
  return `${severityPrefix[severity] || severityPrefix.medium}

Query: ${message}

CRISIS MANAGEMENT ADVICE:

1. IMMEDIATE ACTIONS:
• Activate appropriate crisis response level
• Secure and assess the situation
• Document all actions and decisions
• Establish command center if needed

2. STAKEHOLDER NOTIFICATION:
• Internal: Leadership, legal, communications teams
• External: As required by situation and regulations
• Media: Prepare but do not engage without strategy

3. COMMUNICATION STRATEGY:
• Develop key messages
• Identify spokesperson
• Prepare Q&A document
• Monitor media and social channels

4. RISK MITIGATION:
• Identify potential escalation paths
• Implement containment measures
• Review legal and compliance requirements
• Prepare for various scenarios

5. SUCCESS METRICS:
• Incident contained within defined timeframe
• Stakeholder confidence maintained
• Minimal reputational impact
• Lessons learned documented

Remember: Stay calm, be transparent where appropriate, and prioritize safety and compliance.`;
}