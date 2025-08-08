// AI Content Generation endpoint with Claude integration

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
      
      // Use require for the SDK
      const { Anthropic } = require('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      // Build the Claude prompt
      const systemPrompt = getSystemPrompt(type, tone);
      const userPrompt = buildUserPrompt(type, prompt, formData, tone);
      
      console.log('Calling Claude API with model: claude-3-haiku-20240307');
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });
      
      console.log('Claude API response received');
      
      // Return the Claude response
      return res.status(200).json({
        success: true,
        content: message.content[0].text,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
    // Fall through to template generation if Claude fails
  }
  
  // Fallback to template generation if Claude is not available or fails
  console.log('Falling back to template generation');
  const content = generateTemplateContent(type, prompt, tone, formData);
  
  return res.status(200).json({
    success: true,
    content,
    metadata: {
      powered_by: 'Template Engine',
      timestamp: new Date().toISOString()
    }
  });
};

// Helper function to get system prompt based on content type
function getSystemPrompt(type, tone) {
  const toneInstructions = tone ? `Write in a ${tone} tone.` : '';
  
  const prompts = {
    press_release: `You are an expert PR professional. Write compelling press releases that grab attention and communicate news clearly. ${toneInstructions}`,
    social_media: `You are a social media expert. Create engaging social media content that drives engagement. ${toneInstructions}`,
    blog_post: `You are a content marketing expert. Write informative and engaging blog posts. ${toneInstructions}`,
    email_campaign: `You are an email marketing specialist. Craft compelling email campaigns that drive action. ${toneInstructions}`,
    thought_leadership: `You are a thought leadership expert. Write insightful content that positions the author as an industry leader. ${toneInstructions}`,
    crisis_statement: `You are a crisis communication expert. Write clear, empathetic crisis statements that address concerns. ${toneInstructions}`,
    video_script: `You are a video production expert. Write engaging video scripts that capture attention. ${toneInstructions}`,
    executive_bio: `You are an executive communications expert. Write compelling executive biographies. ${toneInstructions}`,
    media_pitch: `You are a media relations expert. Write persuasive media pitches that get coverage. ${toneInstructions}`,
    research_summary: `You are a research communication expert. Summarize complex research clearly and accurately. ${toneInstructions}`
  };
  
  return prompts[type] || `You are a professional content writer. ${toneInstructions}`;
}

// Helper function to build user prompt
function buildUserPrompt(type, prompt, formData, tone) {
  let userPrompt = `Create ${type.replace('_', ' ')} content based on the following:\n\n`;
  userPrompt += `Topic/Brief: ${prompt}\n\n`;
  
  if (formData) {
    if (formData.headline) userPrompt += `Headline: ${formData.headline}\n`;
    if (formData.subheadline) userPrompt += `Subheadline: ${formData.subheadline}\n`;
    if (formData.location) userPrompt += `Location: ${formData.location}\n`;
    if (formData.quotes) userPrompt += `Quotes to include: ${formData.quotes}\n`;
    if (formData.keyPoints) userPrompt += `Key points: ${formData.keyPoints}\n`;
    if (formData.targetAudience) userPrompt += `Target audience: ${formData.targetAudience}\n`;
    if (formData.callToAction) userPrompt += `Call to action: ${formData.callToAction}\n`;
  }
  
  if (tone) {
    userPrompt += `\nTone: ${tone}\n`;
  }
  
  return userPrompt;
}

// Template generation function (fallback)
function generateTemplateContent(type, prompt, tone, formData) {
  const templates = {
    press_release: `FOR IMMEDIATE RELEASE

${formData?.headline || 'Major Announcement'}: ${prompt}

${formData?.location || 'City, State'} - ${new Date().toLocaleDateString()} - ${prompt}

[Opening paragraph introducing the news and its significance]

[Body paragraph with details and supporting information]

${formData?.quotes ? `"${formData.quotes}"` : '"This represents a significant milestone for our organization," said [Executive Name].'}

[Additional context and background information]

About [Company Name]:
[Company boilerplate]

Contact:
[Contact Information]

###`,
    
    social_media: `🚀 ${prompt}

${formData?.keyPoints || 'Key highlights:'}
✅ Point 1
✅ Point 2
✅ Point 3

${formData?.callToAction || 'Learn more at [link]'}

#Innovation #Success #Growth`,
    
    blog_post: `# ${formData?.headline || prompt}

## Introduction
${prompt}

## Key Points
${formData?.keyPoints || '- Important point 1\n- Important point 2\n- Important point 3'}

## Deep Dive
[Detailed exploration of the topic]

## Conclusion
[Summary and call to action]

${formData?.callToAction || 'Contact us to learn more.'}`,
    
    email_campaign: `Subject: ${formData?.headline || prompt}

Dear ${formData?.targetAudience || 'Valued Customer'},

${prompt}

${formData?.keyPoints || 'Here\'s what you need to know:'}

${formData?.callToAction || 'Click here to learn more'}

Best regards,
[Your Team]`,
    
    crisis_statement: `Statement Regarding ${prompt}

We are aware of ${prompt} and are taking this matter seriously.

${formData?.keyPoints || 'We are actively investigating and taking the following steps:'}

We understand the concern this may cause and are committed to transparency throughout this process.

${formData?.quotes || 'We will provide updates as more information becomes available.'}

Contact: [Contact Information]`
  };
  
  return templates[type] || `Content about: ${prompt}\n\n${formData?.keyPoints || 'Key information to be developed.'}`;
}