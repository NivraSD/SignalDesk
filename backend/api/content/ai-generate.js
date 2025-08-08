// AI Content Generation endpoint
export default function handler(req, res) {
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
  
  // Generate content based on type
  let generatedContent = '';
  
  switch (type) {
    case 'press-release':
      generatedContent = generatePressRelease(prompt, formData, tone);
      break;
    case 'social-post':
      generatedContent = generateSocialPost(prompt, tone);
      break;
    case 'media-pitch':
      generatedContent = generateMediaPitch(prompt, formData, tone);
      break;
    case 'crisis-response':
      generatedContent = generateCrisisResponse(prompt, formData, tone);
      break;
    default:
      generatedContent = generateGenericContent(prompt, type, tone);
  }
  
  return res.status(200).json({
    success: true,
    content: generatedContent,
    type,
    tone,
    metadata: {
      generated_at: new Date().toISOString(),
      word_count: generatedContent.split(' ').length,
      character_count: generatedContent.length
    }
  });
}

function generatePressRelease(prompt, formData, tone) {
  const headline = formData?.headline || prompt;
  const location = formData?.location || 'NEW YORK';
  const announcement = formData?.announcement || prompt;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `FOR IMMEDIATE RELEASE

${headline.toUpperCase()}

${location} – ${date} – ${announcement}

[Your company] today announced ${prompt.toLowerCase()}. This ${tone === 'bold' ? 'groundbreaking' : 'significant'} development represents a major step forward in [industry/market].

"We are ${tone === 'professional' ? 'pleased' : 'thrilled'} to announce this ${tone === 'bold' ? 'revolutionary' : 'important'} development," said [Executive Name], [Title] at [Company]. "This ${prompt.toLowerCase()} will ${tone === 'bold' ? 'transform' : 'enhance'} how [target audience] [benefit]."

Key highlights include:
• [Feature/benefit 1]
• [Feature/benefit 2]
• [Feature/benefit 3]

The ${prompt.toLowerCase()} is expected to [impact/result]. [Additional context about market need or problem being solved].

"[Additional quote providing more context or enthusiasm]," added [Second Executive or Partner], [Title]. "[Forward-looking statement about future impact]."

About [Company]
[Company] is a leading [industry] company focused on [mission]. Founded in [year], the company has [achievements]. For more information, visit [website].

Contact:
[Name]
[Title]
[Email]
[Phone]

###`;
}

function generateSocialPost(prompt, tone) {
  const excitement = tone === 'bold' ? '🚀' : tone === 'conversational' ? '👋' : '📢';
  const hashtags = ['#Innovation', '#TechNews', '#FutureIsNow', '#DigitalTransformation'];
  
  return `${excitement} ${prompt}

${tone === 'conversational' ? "Here's what this means for you:" : 'Key highlights:'}

✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

${tone === 'bold' ? '💡 This changes everything.' : tone === 'conversational' ? "We'd love to hear your thoughts!" : 'Learn more at [link]'}

${hashtags.join(' ')}`;
}

function generateMediaPitch(prompt, formData, tone) {
  return `Subject: ${tone === 'urgent' ? 'EXCLUSIVE: ' : ''}${prompt}

Dear [Journalist Name],

I hope this message finds you well. Given your recent coverage of [relevant topic], I wanted to share an exclusive story that I believe would resonate with your readers.

${prompt}

Why this matters now:
• [Timely angle 1]
• [Unique data point or exclusive information]
• [Broader trend connection]

${tone === 'urgent' ? 'This story is breaking now and we can offer:' : 'We can provide:'}
- Exclusive interview with [Executive]
- Access to [data/research/demo]
- High-resolution images and video content

${tone === 'conversational' ? "I'd love to discuss how this fits with your editorial calendar." : 'This story aligns perfectly with your recent pieces on [topic].'}

Available for a quick call this week?

Best regards,
[Your name]
[Title]
[Company]
[Phone]`;
}

function generateCrisisResponse(prompt, formData, tone) {
  return `[Company] Statement on ${prompt}

We are aware of ${prompt} and are taking this matter extremely seriously.

${tone === 'urgent' ? 'Immediate actions taken:' : 'Our response:'}

First, we want to ${tone === 'conversational' ? 'sincerely apologize to' : 'express our concern for'} all those affected by this situation. The safety and trust of our [customers/users/community] is our highest priority.

We have immediately:
• [Action 1 taken]
• [Action 2 taken]
• [Action 3 taken]

Moving forward, we are committed to:
• [Future commitment 1]
• [Future commitment 2]
• [Future commitment 3]

We will provide regular updates as we work to resolve this situation. For immediate concerns, please contact [contact information].

[Executive Name]
[Title]
[Company]`;
}

function generateGenericContent(prompt, type, tone) {
  return `Generated ${type} Content

${prompt}

[This is AI-generated content based on your input. Please customize and edit as needed.]

Key points to cover:
• [Point 1]
• [Point 2]
• [Point 3]

${tone === 'professional' ? 'Professional tone maintained throughout.' : tone === 'bold' ? 'Bold and assertive messaging included.' : 'Conversational and approachable style applied.'}

[Remember to fact-check all claims and add specific details relevant to your organization.]`;
}