// Crisis Command Center with Claude AI
export default async function handler(req, res) {
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
    scenario, 
    severity = 'medium',
    type = 'general',
    additionalContext = ''
  } = req.body;
  
  if (!scenario) {
    return res.status(400).json({
      success: false,
      error: 'Crisis scenario is required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for crisis response...');
      
      const { Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are an expert crisis management consultant. Generate comprehensive crisis response plans with immediate actions, communication strategies, stakeholder management, and recovery steps. Be specific, actionable, and consider legal and reputational implications.`;
      
      const userPrompt = `Crisis Scenario: ${scenario}
Severity: ${severity}
Type: ${type}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate a complete crisis response plan including:
1. Immediate Actions (first 24 hours)
2. Stakeholder Communication Strategy
3. Media Response Plan
4. Internal Team Mobilization
5. Legal and Compliance Considerations
6. Recovery and Follow-up Actions
7. Key Messages and Talking Points`;
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const response = message.content[0].text;
      
      return res.status(200).json({
        success: true,
        scenario,
        severity,
        type,
        response,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback response
  console.log('Using template crisis response');
  const templateResponse = generateTemplateCrisisResponse(scenario, severity, type);
  
  return res.status(200).json({
    success: true,
    scenario,
    severity,
    type,
    response: templateResponse,
    metadata: {
      powered_by: 'Template Engine',
      timestamp: new Date().toISOString()
    }
  });
}

function generateTemplateCrisisResponse(scenario, severity, type) {
  const severityActions = {
    high: 'IMMEDIATE ACTION REQUIRED - Activate full crisis team',
    medium: 'URGENT - Mobilize core response team',
    low: 'MONITOR - Prepare response if escalation occurs'
  };
  
  return `CRISIS RESPONSE PLAN

Scenario: ${scenario}
Severity: ${severity.toUpperCase()}
Status: ${severityActions[severity]}

IMMEDIATE ACTIONS (0-24 HOURS):
1. Activate crisis response team
2. Assess full scope and impact
3. Secure affected systems/areas
4. Document all actions and decisions
5. Prepare initial stakeholder notifications

STAKEHOLDER COMMUNICATION:
• Employees: Internal memo within 2 hours
• Customers: Direct notification within 24 hours
• Media: Prepared statement ready within 4 hours
• Regulators: Notify as required by law
• Board/Leadership: Immediate briefing

MEDIA RESPONSE STRATEGY:
• Designate single spokesperson
• Prepare holding statement
• Monitor social media sentiment
• Schedule regular updates
• Maintain transparency while protecting legal position

KEY MESSAGES:
• We take this matter seriously
• We are investigating thoroughly
• Customer/stakeholder safety is our priority
• We will provide regular updates
• We are taking steps to prevent recurrence

RECOVERY ACTIONS:
1. Root cause analysis
2. Implement corrective measures
3. Review and update policies
4. Conduct post-incident review
5. Strengthen preventive controls

LEGAL CONSIDERATIONS:
• Engage legal counsel immediately
• Preserve all relevant documentation
• Avoid admissions of liability
• Ensure regulatory compliance
• Prepare for potential litigation`;
}