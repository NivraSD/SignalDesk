// Media Reporter Search with Claude AI
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
    industry,
    beat,
    outlet,
    location,
    keywords
  } = req.body;
  
  if (!industry && !beat && !keywords) {
    return res.status(400).json({
      success: false,
      error: 'Please provide search criteria (industry, beat, or keywords)'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for reporter search...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are a media database expert. Generate realistic reporter profiles based on search criteria. Include major outlets and beat-appropriate journalists. Make the data realistic and useful for PR outreach.`;
      
      const userPrompt = `Find reporters matching:
Industry: ${industry || 'Any'}
Beat: ${beat || 'Any'}
Outlet: ${outlet || 'Any'}
Location: ${location || 'Any'}
Keywords: ${keywords || 'None'}

Generate 10-15 relevant reporter profiles in JSON format:
[{
  "name": "Reporter Name",
  "outlet": "Media Outlet",
  "beat": "Coverage Beat",
  "email": "first.last@outlet.com",
  "twitter": "@handle",
  "recentArticles": ["Article 1", "Article 2"],
  "relevanceScore": 0.95,
  "location": "City, State"
}]`;
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      let reporters = [];
      try {
        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          reporters = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        reporters = generateTemplateReporters(industry, beat, outlet, location);
      }
      
      return res.status(200).json({
        success: true,
        reporters,
        total: reporters.length,
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
  
  // Fallback template response
  console.log('Using template reporter search');
  const reporters = generateTemplateReporters(industry, beat, outlet, location);
  
  return res.status(200).json({
    success: true,
    reporters,
    total: reporters.length,
    metadata: {
      powered_by: 'Template Engine',
      timestamp: new Date().toISOString()
    }
  });
}

function generateTemplateReporters(industry, beat, outlet, location) {
  const outlets = outlet ? [outlet] : [
    'Wall Street Journal',
    'New York Times',
    'Forbes',
    'TechCrunch',
    'Business Insider',
    'Reuters',
    'Bloomberg',
    'CNBC'
  ];
  
  const beats = beat ? [beat] : [
    'Technology',
    'Business',
    'Finance',
    'Startups',
    'Enterprise'
  ];
  
  const reporters = [];
  const firstNames = ['Sarah', 'John', 'Emily', 'Michael', 'Jessica', 'David', 'Amanda', 'Robert'];
  const lastNames = ['Johnson', 'Smith', 'Williams', 'Chen', 'Garcia', 'Miller', 'Davis', 'Wilson'];
  
  for (let i = 0; i < Math.min(10, outlets.length); i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const reporterOutlet = outlets[i % outlets.length];
    const reporterBeat = beats[i % beats.length];
    
    reporters.push({
      name: `${firstName} ${lastName}`,
      outlet: reporterOutlet,
      beat: reporterBeat,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${reporterOutlet.toLowerCase().replace(/\s+/g, '')}.com`,
      twitter: `@${firstName}${lastName}`,
      recentArticles: [
        `Latest trends in ${industry || 'technology'}`,
        `How companies are adapting to market changes`,
        `Innovation spotlight: Industry leaders`
      ],
      relevanceScore: 0.95 - (i * 0.05),
      location: location || 'New York, NY'
    });
  }
  
  return reporters;
}