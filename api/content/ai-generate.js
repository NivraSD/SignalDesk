// AI Content Generation endpoint with Claude integration

export default async function handler(req, res) {
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
  
  const { type, prompt, tone, formData } = req.body;
  
  // Validate input
  if (!type || !prompt) {
    return res.status(400).json({
      success: false,
      error: 'Type and prompt are required'
    });
  }
  
  try {
    // Debug: Log if API key exists
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    console.log('ANTHROPIC_API_KEY exists:', hasApiKey);
    
    // Check if Claude API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Attempting to use Claude AI...');
      
      // Use dynamic import for the SDK
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      // Build the Claude prompt
      const systemPrompt = getSystemPrompt(type, tone);
      const userPrompt = buildUserPrompt(type, prompt, formData, tone);
      
      console.log('Calling Claude API with model: claude-3-haiku-20240307');
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: tone === 'bold' ? 0.8 : tone === 'conversational' ? 0.7 : 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const generatedContent = message.content[0].text;
      console.log('Claude AI generation successful');
      
      return res.status(200).json({
        success: true,
        content: generatedContent,
        type,
        tone,
        metadata: {
          generated_at: new Date().toISOString(),
          word_count: generatedContent.split(' ').length,
          character_count: generatedContent.length,
          ai_model: 'claude-3-haiku',
          powered_by: 'Claude AI'
        }
      });
    } else {
      console.log('No ANTHROPIC_API_KEY found in environment');
    }
  } catch (error) {
    console.error('Claude API error:', error.message);
    console.error('Error stack:', error.stack);
    // Fall through to template generation
  }
  
  // Fallback to template-based generation
  console.log('Using template generation (Claude not available)');
  const generatedContent = generateTemplateContent(type, prompt, formData, tone);
  
  return res.status(200).json({
    success: true,
    content: generatedContent,
    type,
    tone,
    metadata: {
      generated_at: new Date().toISOString(),
      word_count: generatedContent.split(' ').length,
      character_count: generatedContent.length,
      ai_model: 'template',
      powered_by: 'Template Engine'
    }
  });
}

function getSystemPrompt(type, tone) {
  const toneInstructions = {
    professional: 'Use formal, authoritative language appropriate for corporate communications.',
    bold: 'Use confident, assertive language that makes strong claims and challenges the status quo.',
    conversational: 'Use friendly, approachable language that feels personal and relatable.',
    analytical: 'Use data-driven, objective language with emphasis on facts and evidence.',
    inspirational: 'Use uplifting, visionary language that motivates and inspires action.',
    urgent: 'Use direct, time-sensitive language that compels immediate action.'
  };
  
  const typeInstructions = {
    'press-release': 'You are a PR professional writing press releases. Follow AP style, use inverted pyramid structure, include quotes, and end with boilerplate.',
    'social-post': 'You are a social media manager creating engaging posts. Be concise, use appropriate hashtags, include a call-to-action.',
    'media-pitch': 'You are a PR specialist pitching to journalists. Be newsworthy, explain why it matters now, offer exclusive access.',
    'crisis-response': 'You are a crisis communications expert. Acknowledge the situation, show empathy, outline actions, avoid legal admissions.',
    'exec-statement': 'You are writing executive communications. Be authoritative, strategic, and forward-looking.',
    'qa-doc': 'You are creating Q&A documents. Anticipate difficult questions and provide clear, comprehensive answers.',
    'thought-leadership': 'You are a thought leader sharing insights. Be innovative, provide unique perspectives, demonstrate expertise.'
  };
  
  return `You are an expert content creator for PR and communications. 
${typeInstructions[type] || 'Create professional communications content.'}
${toneInstructions[tone] || toneInstructions.professional}
Generate only the content requested without any meta-commentary or explanations.`;
}

function buildUserPrompt(type, prompt, formData, tone) {
  let fullPrompt = `Create a ${type.replace('-', ' ')} with a ${tone} tone.\n\n`;
  
  if (type === 'press-release' && formData) {
    fullPrompt += `Details:\n`;
    if (formData.headline) fullPrompt += `Headline: ${formData.headline}\n`;
    if (formData.location) fullPrompt += `Location: ${formData.location}\n`;
    if (formData.announcement) fullPrompt += `Main announcement: ${formData.announcement}\n`;
    if (formData.quotes) fullPrompt += `Include these quotes: ${formData.quotes}\n`;
    if (formData.metrics) fullPrompt += `Key metrics: ${formData.metrics}\n`;
    fullPrompt += `\nAdditional context: ${prompt}\n`;
  } else {
    fullPrompt += `Topic/Request: ${prompt}\n`;
    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        if (value) fullPrompt += `${key}: ${value}\n`;
      });
    }
  }
  
  fullPrompt += `\nGenerate the complete ${type.replace('-', ' ')} now.`;
  
  return fullPrompt;
}

function generateTemplateContent(type, prompt, formData, tone) {
  const headline = formData?.headline || prompt;
  const location = formData?.location || 'NEW YORK';
  const announcement = formData?.announcement || prompt;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  switch (type) {
    case 'press-release':
      return `FOR IMMEDIATE RELEASE

${headline.toUpperCase()}

${location} – ${date} – ${announcement}

[Your company] today announced ${prompt.toLowerCase()}. This ${tone === 'bold' ? 'groundbreaking' : 'significant'} development represents a major step forward in the industry.

"We are ${tone === 'professional' ? 'pleased' : 'thrilled'} to announce this ${tone === 'bold' ? 'revolutionary' : 'important'} development," said [Executive Name], [Title] at [Company]. "This will ${tone === 'bold' ? 'transform' : 'enhance'} how our customers experience our products and services."

Key highlights include:
• Enhanced capabilities and features
• Improved user experience
• Greater value for customers

The ${prompt.toLowerCase()} is expected to drive significant growth and innovation in the market.

About [Company]
[Company] is a leading provider of innovative solutions. For more information, visit [website].

Contact:
[Name]
[Email]
[Phone]

###`;

    case 'social-post':
      const excitement = tone === 'bold' ? '🚀' : tone === 'conversational' ? '👋' : '📢';
      return `${excitement} ${prompt}

${tone === 'conversational' ? "Here's what this means for you:" : 'Key highlights:'}

✅ Innovation at its finest
✅ Designed with you in mind
✅ Available now

${tone === 'bold' ? '💡 This changes everything.' : tone === 'conversational' ? "We'd love to hear your thoughts!" : 'Learn more at [link]'}

#Innovation #TechNews #FutureIsNow`;

    case 'media-pitch':
      return `Subject: ${tone === 'urgent' ? 'EXCLUSIVE: ' : ''}${prompt}

Dear [Journalist Name],

I hope this message finds you well. Given your recent coverage of industry trends, I wanted to share an exclusive story opportunity.

${prompt}

Why this matters now:
• Timely and relevant to current market trends
• Exclusive access and insights
• Compelling narrative with broad appeal

We can provide:
- Executive interviews
- Exclusive data and research
- Visual assets

Would you be interested in discussing this further?

Best regards,
[Your name]`;

    case 'crisis-response':
      return `Statement on ${prompt}

We are aware of ${prompt} and are taking this matter seriously.

Our immediate response:
• We are investigating the situation thoroughly
• We are committed to transparency
• We are taking corrective actions

We understand the concerns this raises and are working diligently to address them. We will provide updates as more information becomes available.

For questions, please contact [contact information].

[Company Leadership]`;

    default:
      return `${type.toUpperCase()}: ${prompt}

This content addresses ${prompt} with a ${tone} tone.

Key points:
• Point 1 related to ${prompt}
• Point 2 supporting the message
• Point 3 reinforcing the value

[Customize this template with your specific details]

Contact: [Your contact information]`;
  }
}