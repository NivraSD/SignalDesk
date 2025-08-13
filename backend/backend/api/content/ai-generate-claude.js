import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured');
    // Fall back to mock generation if no API key
    return generateMockContent(res, type, prompt, tone, formData);
  }
  
  try {
    // Build the Claude prompt based on content type
    const systemPrompt = getSystemPrompt(type, tone);
    const userPrompt = buildUserPrompt(type, prompt, formData, tone);
    
    console.log('Calling Claude API with type:', type, 'tone:', tone);
    
    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Using Haiku for faster, cost-effective generation
      max_tokens: 1500,
      temperature: tone === 'bold' ? 0.8 : tone === 'conversational' ? 0.7 : 0.5,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });
    
    const generatedContent = message.content[0].text;
    
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
    
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Fall back to mock generation on error
    return generateMockContent(res, type, prompt, tone, formData);
  }
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

// Fallback mock generation if Claude is not available
function generateMockContent(res, type, prompt, tone, formData) {
  const mockContent = `[AI-Generated ${type.replace('-', ' ').toUpperCase()}]

${prompt}

This is a mock response because Claude AI is not configured.
To enable real AI generation:
1. Add ANTHROPIC_API_KEY to your Vercel environment variables
2. Redeploy the application

Content would be generated here with:
- Type: ${type}
- Tone: ${tone}
- Your specific requirements

[End of mock content]`;
  
  return res.status(200).json({
    success: true,
    content: mockContent,
    type,
    tone,
    metadata: {
      generated_at: new Date().toISOString(),
      word_count: mockContent.split(' ').length,
      character_count: mockContent.length,
      ai_model: 'mock',
      powered_by: 'Template (Claude not configured)'
    }
  });
}