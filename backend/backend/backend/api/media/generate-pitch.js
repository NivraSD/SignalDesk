// Pitch Generation with Claude AI
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const { reporter, story, angle, projectInfo } = req.body;
  
  if (!reporter || !story) {
    return res.status(400).json({
      success: false,
      error: 'Reporter and story information are required'
    });
  }
  
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = 'You are an expert PR professional. Write compelling, personalized media pitches that get responses. Be concise, newsworthy, and relevant.';
      
      const userPrompt = `Write a media pitch for:
Reporter: ${reporter.name} at ${reporter.outlet}
Beat: ${reporter.beat}
Story: ${story}
Angle: ${angle || 'Newsworthy development'}
Project: ${projectInfo?.name || 'Our company'}

Create a compelling email pitch that:
1. Has an attention-grabbing subject line
2. Shows you know their work
3. Clearly states the news value
4. Offers exclusive access or insights
5. Includes a clear call to action`;
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      return res.status(200).json({
        success: true,
        pitch: message.content[0].text,
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
  
  // Fallback template
  const templatePitch = `Subject: Exclusive: ${story}

Hi ${reporter.name},

I've been following your coverage of ${reporter.beat} at ${reporter.outlet}, particularly your recent piece on [relevant article].

I wanted to reach out with an exclusive story opportunity that aligns perfectly with your beat:

${story}

Why this matters now:
• ${angle || 'Timely and newsworthy development'}
• Exclusive access to data and executives
• Industry-first announcement

I can provide:
- Executive interviews
- Exclusive data and research
- Visual assets and demos

Would you be interested in learning more? I'm happy to schedule a brief call or send additional information.

Best regards,
[Your name]`;
  
  return res.status(200).json({
    success: true,
    pitch: templatePitch,
    metadata: {
      powered_by: 'Template Engine',
      timestamp: new Date().toISOString()
    }
  });
}