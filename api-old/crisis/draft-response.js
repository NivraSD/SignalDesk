// Crisis Response Drafting with Claude AI
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    crisisType,
    audience,
    tone = 'professional',
    keyPoints,
    context
  } = req.body;
  
  if (!crisisType || !audience) {
    return res.status(400).json({
      success: false,
      error: 'Crisis type and audience are required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for crisis response drafting...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are an expert crisis communications specialist. Draft clear, empathetic, and strategic responses for crisis situations. Consider legal implications, stakeholder concerns, and reputational impact. Be factual, transparent where appropriate, and action-oriented.`;
      
      const userPrompt = `Draft a crisis response for:
Crisis Type: ${crisisType}
Target Audience: ${audience}
Tone: ${tone}
Key Points to Address: ${keyPoints || 'Not specified'}
Context: ${JSON.stringify(context || {})}

Create a professional response that:
1. Acknowledges the situation appropriately
2. Shows empathy and concern
3. Outlines actions being taken
4. Provides clear next steps
5. Maintains appropriate legal positioning`;
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const draftResponse = message.content[0].text;
      
      return res.status(200).json({
        success: true,
        draft: draftResponse,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          audience,
          tone,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback template response
  console.log('Using template crisis response');
  const templateDraft = generateTemplateDraft(crisisType, audience, tone, keyPoints);
  
  return res.status(200).json({
    success: true,
    draft: templateDraft,
    metadata: {
      powered_by: 'Template Engine',
      audience,
      tone,
      timestamp: new Date().toISOString()
    }
  });
}

function generateTemplateDraft(crisisType, audience, tone, keyPoints) {
  const audienceGreeting = {
    employees: 'Dear Team Members,',
    customers: 'Dear Valued Customers,',
    media: 'FOR IMMEDIATE RELEASE',
    stakeholders: 'Dear Stakeholders,',
    public: 'To Our Community,'
  };
  
  const greeting = audienceGreeting[audience] || 'Dear All,';
  
  return `${greeting}

We are writing to address the recent ${crisisType} situation that has come to our attention.

First and foremost, we want to assure you that we are taking this matter extremely seriously. The safety and well-being of our ${audience} is our highest priority.

What We Know:
We are currently investigating all aspects of this situation to understand the full scope and impact. We are committed to transparency and will share information as it becomes verified and appropriate to do so.

Actions We Are Taking:
• We have activated our crisis response team
• We are conducting a thorough investigation
• We are cooperating fully with all relevant authorities
• We have implemented immediate containment measures
• We are reviewing and strengthening our procedures

Our Commitment:
We understand the concern this situation may cause, and we are committed to:
• Providing regular updates as new information becomes available
• Taking full responsibility for our role in addressing this issue
• Implementing measures to prevent similar situations in the future
• Supporting all affected parties throughout this process

Next Steps:
${keyPoints || 'We will provide detailed next steps once our initial assessment is complete.'}

We appreciate your patience and understanding during this time. If you have immediate concerns or questions, please contact our dedicated response team at [contact information].

We will continue to update you as the situation develops and more information becomes available.

Sincerely,
[Leadership Name]
[Title]
[Organization]

Last Updated: ${new Date().toISOString()}`;
}