const claudeService = require('../../config/claude');

exports.analyzeOrganization = async (req, res) => {
  try {
    const { company, url, requestType } = req.body;
    
    console.log('=== ANALYZE ORGANIZATION ===');
    console.log('Company:', company);
    console.log('URL:', url);
    console.log('Request Type:', requestType);
    
    // Create a comprehensive prompt for Claude to analyze the organization
    const prompt = `Analyze the following organization and provide intelligence monitoring recommendations:

Company Name: ${company}
${url ? `Website: ${url}` : ''}

Based on this organization, provide a comprehensive analysis in JSON format with:
1. The correct industry classification
2. Their actual competitors (not generic tech companies)
3. Relevant topics specific to their business
4. Key stakeholders they should monitor

For an event marketing company, competitors would be other event companies like Cvent, Eventbrite, Bizzabo, etc.
For a restaurant chain, competitors would be other restaurant chains in their category.
For a B2B SaaS company, competitors would be other companies in their specific niche.

Be specific and accurate to their actual business, not generic.

Return ONLY a JSON object with this structure:
{
  "industry": "Specific Industry Name",
  "competitors": [
    {
      "id": "comp-1",
      "name": "Actual Competitor Name",
      "priority": "high|medium|low",
      "marketCap": "Market cap or Private",
      "similarity": 0.85,
      "reason": "Why they are a competitor"
    }
  ],
  "topics": [
    {
      "id": "topic-1", 
      "name": "Specific Relevant Topic",
      "priority": "high|medium|low",
      "trending": true|false,
      "reason": "Why this topic matters to them"
    }
  ],
  "stakeholders": {
    "regulators": ["Relevant regulatory bodies"],
    "investors": ["Key investor types"],
    "customers": ["Customer segments"],
    "media": ["Relevant media outlets"]
  }
}`;

    let analysisData;
    
    try {
      const response = await claudeService.sendMessage(prompt);
      console.log('Claude response received, length:', response?.length);
      
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed Claude response');
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (aiError) {
      console.log('Claude API error or parsing failed:', aiError.message);
      console.log('Using intelligent defaults for:', company);
      
      // Create intelligent defaults based on company name and URL
      analysisData = generateIntelligentDefaults(company, url);
    }
    
    // Ensure all required fields exist
    analysisData.competitors = analysisData.competitors || [];
    analysisData.topics = analysisData.topics || [];
    analysisData.stakeholders = analysisData.stakeholders || {};
    
    // Add IDs if missing
    analysisData.competitors = analysisData.competitors.map((c, idx) => ({
      ...c,
      id: c.id || `comp-${idx + 1}`,
      priority: c.priority || 'medium',
      similarity: c.similarity || 0.7
    }));
    
    analysisData.topics = analysisData.topics.map((t, idx) => ({
      ...t,
      id: t.id || `topic-${idx + 1}`,
      priority: t.priority || 'medium',
      trending: t.trending !== undefined ? t.trending : false
    }));
    
    console.log('Analysis complete:', {
      industry: analysisData.industry,
      competitorCount: analysisData.competitors.length,
      topicCount: analysisData.topics.length
    });
    
    res.json(analysisData);
    
  } catch (error) {
    console.error('Error analyzing organization:', error);
    
    // Return intelligent fallback data
    const fallbackData = generateIntelligentDefaults(req.body.company, req.body.url);
    res.json(fallbackData);
  }
};

function generateIntelligentDefaults(company, url) {
  // Detect industry from company name and URL patterns
  const companyLower = company.toLowerCase();
  const urlLower = (url || '').toLowerCase();
  
  console.log('Generating intelligent defaults for:', company, 'URL:', url);
  
  let industry = 'Business Services';
  let competitors = [];
  let topics = [];
  
  // Event Marketing detection
  if (companyLower.includes('event') || urlLower.includes('event')) {
    console.log('Detected as Event Marketing company');
    industry = 'Event Marketing & Management';
    competitors = [
      { id: 'comp-1', name: 'Eventbrite', priority: 'high', marketCap: '$1.8B', similarity: 0.85 },
      { id: 'comp-2', name: 'Cvent', priority: 'high', marketCap: 'Private ($5B)', similarity: 0.88 },
      { id: 'comp-3', name: 'Bizzabo', priority: 'medium', marketCap: 'Private', similarity: 0.75 },
      { id: 'comp-4', name: 'Hopin', priority: 'medium', marketCap: 'Private', similarity: 0.72 },
      { id: 'comp-5', name: 'Whova', priority: 'low', marketCap: 'Private', similarity: 0.65 }
    ];
    topics = [
      { id: 'topic-1', name: 'Hybrid & Virtual Events', priority: 'high', trending: true },
      { id: 'topic-2', name: 'Event ROI & Analytics', priority: 'high', trending: true },
      { id: 'topic-3', name: 'Attendee Engagement Technology', priority: 'high', trending: false },
      { id: 'topic-4', name: 'Event Sustainability', priority: 'medium', trending: true },
      { id: 'topic-5', name: 'AI in Event Planning', priority: 'medium', trending: true },
      { id: 'topic-6', name: 'Event Safety & Health Protocols', priority: 'medium', trending: false }
    ];
  }
  // Marketing/Advertising detection
  else if (companyLower.includes('marketing') || companyLower.includes('advertising')) {
    industry = 'Marketing & Advertising';
    competitors = [
      { id: 'comp-1', name: 'HubSpot', priority: 'high', marketCap: '$25B', similarity: 0.75 },
      { id: 'comp-2', name: 'Mailchimp', priority: 'high', marketCap: 'Private', similarity: 0.78 },
      { id: 'comp-3', name: 'Constant Contact', priority: 'medium', marketCap: 'Private', similarity: 0.72 },
      { id: 'comp-4', name: 'Marketo', priority: 'medium', marketCap: 'Adobe Division', similarity: 0.70 },
      { id: 'comp-5', name: 'ActiveCampaign', priority: 'low', marketCap: 'Private', similarity: 0.65 }
    ];
    topics = [
      { id: 'topic-1', name: 'Marketing Automation & AI', priority: 'high', trending: true },
      { id: 'topic-2', name: 'Privacy & Data Regulations', priority: 'high', trending: true },
      { id: 'topic-3', name: 'Content Marketing Trends', priority: 'medium', trending: true },
      { id: 'topic-4', name: 'Social Media Algorithm Changes', priority: 'high', trending: true },
      { id: 'topic-5', name: 'Customer Data Platforms', priority: 'medium', trending: false },
      { id: 'topic-6', name: 'Marketing Attribution', priority: 'medium', trending: false }
    ];
  }
  // Consulting detection
  else if (companyLower.includes('consulting') || companyLower.includes('advisory')) {
    industry = 'Consulting & Professional Services';
    competitors = [
      { id: 'comp-1', name: 'McKinsey & Company', priority: 'high', marketCap: 'Private', similarity: 0.70 },
      { id: 'comp-2', name: 'Boston Consulting Group', priority: 'high', marketCap: 'Private', similarity: 0.72 },
      { id: 'comp-3', name: 'Bain & Company', priority: 'medium', marketCap: 'Private', similarity: 0.68 },
      { id: 'comp-4', name: 'Deloitte Consulting', priority: 'medium', marketCap: 'Private', similarity: 0.75 },
      { id: 'comp-5', name: 'Accenture', priority: 'medium', marketCap: '$200B', similarity: 0.65 }
    ];
    topics = [
      { id: 'topic-1', name: 'Digital Transformation Consulting', priority: 'high', trending: true },
      { id: 'topic-2', name: 'ESG & Sustainability Advisory', priority: 'high', trending: true },
      { id: 'topic-3', name: 'Remote Consulting Models', priority: 'medium', trending: false },
      { id: 'topic-4', name: 'AI in Consulting', priority: 'high', trending: true },
      { id: 'topic-5', name: 'Industry Consolidation', priority: 'medium', trending: false }
    ];
  }
  // Software/SaaS detection
  else if (companyLower.includes('software') || companyLower.includes('saas') || companyLower.includes('app')) {
    console.log('Detected as Software/SaaS company');
    industry = 'Software & SaaS';
    competitors = [
      { id: 'comp-1', name: 'Salesforce', priority: 'high', marketCap: '$200B', similarity: 0.7 },
      { id: 'comp-2', name: 'Microsoft 365', priority: 'high', marketCap: 'Part of MSFT', similarity: 0.75 },
      { id: 'comp-3', name: 'Google Workspace', priority: 'medium', marketCap: 'Part of GOOGL', similarity: 0.7 },
      { id: 'comp-4', name: 'Slack', priority: 'medium', marketCap: 'Salesforce', similarity: 0.65 },
      { id: 'comp-5', name: 'Notion', priority: 'low', marketCap: 'Private ($10B)', similarity: 0.6 }
    ];
    topics = [
      { id: 'topic-1', name: 'AI Integration', priority: 'high', trending: true },
      { id: 'topic-2', name: 'Data Security & Privacy', priority: 'high', trending: true },
      { id: 'topic-3', name: 'Remote Work Tools', priority: 'medium', trending: false },
      { id: 'topic-4', name: 'API Economy', priority: 'medium', trending: true },
      { id: 'topic-5', name: 'Low-Code/No-Code', priority: 'medium', trending: true }
    ];
  }
  // Fintech detection
  else if (companyLower.includes('pay') || companyLower.includes('finance') || companyLower.includes('fintech') || 
           companyLower.includes('bank') || companyLower.includes('invest')) {
    console.log('Detected as Fintech company');
    industry = 'Financial Technology';
    competitors = [
      { id: 'comp-1', name: 'Stripe', priority: 'high', marketCap: 'Private ($95B)', similarity: 0.8 },
      { id: 'comp-2', name: 'Square/Block', priority: 'high', marketCap: '$40B', similarity: 0.75 },
      { id: 'comp-3', name: 'PayPal', priority: 'medium', marketCap: '$60B', similarity: 0.7 },
      { id: 'comp-4', name: 'Plaid', priority: 'medium', marketCap: 'Private ($13B)', similarity: 0.65 },
      { id: 'comp-5', name: 'Wise', priority: 'low', marketCap: '$7B', similarity: 0.6 }
    ];
    topics = [
      { id: 'topic-1', name: 'Open Banking', priority: 'high', trending: true },
      { id: 'topic-2', name: 'Cryptocurrency Integration', priority: 'high', trending: true },
      { id: 'topic-3', name: 'Regulatory Compliance', priority: 'high', trending: false },
      { id: 'topic-4', name: 'Embedded Finance', priority: 'medium', trending: true },
      { id: 'topic-5', name: 'Financial Inclusion', priority: 'medium', trending: true }
    ];
  }
  // E-commerce detection
  else if (companyLower.includes('shop') || companyLower.includes('store') || companyLower.includes('commerce') ||
           companyLower.includes('retail')) {
    console.log('Detected as E-commerce company');
    industry = 'E-commerce & Retail';
    competitors = [
      { id: 'comp-1', name: 'Amazon', priority: 'high', marketCap: '$1.5T', similarity: 0.7 },
      { id: 'comp-2', name: 'Shopify', priority: 'high', marketCap: '$90B', similarity: 0.8 },
      { id: 'comp-3', name: 'eBay', priority: 'medium', marketCap: '$25B', similarity: 0.65 },
      { id: 'comp-4', name: 'Etsy', priority: 'medium', marketCap: '$8B', similarity: 0.6 },
      { id: 'comp-5', name: 'Walmart.com', priority: 'medium', marketCap: 'Part of WMT', similarity: 0.7 }
    ];
    topics = [
      { id: 'topic-1', name: 'Social Commerce', priority: 'high', trending: true },
      { id: 'topic-2', name: 'Supply Chain Innovation', priority: 'high', trending: true },
      { id: 'topic-3', name: 'Sustainable Shopping', priority: 'medium', trending: true },
      { id: 'topic-4', name: 'AI Personalization', priority: 'high', trending: true },
      { id: 'topic-5', name: 'Mobile Commerce', priority: 'medium', trending: false }
    ];
  }
  // Default to Technology for all others
  else {
    console.log('Using default Technology industry profile');
    industry = 'Technology & Innovation';
    competitors = [
      { id: 'comp-1', name: 'Microsoft', priority: 'high', marketCap: '$2.8T', similarity: 0.65 },
      { id: 'comp-2', name: 'Google', priority: 'high', marketCap: '$1.7T', similarity: 0.65 },
      { id: 'comp-3', name: 'Meta', priority: 'medium', marketCap: '$900B', similarity: 0.6 },
      { id: 'comp-4', name: 'Apple', priority: 'medium', marketCap: '$2.9T', similarity: 0.55 },
      { id: 'comp-5', name: 'Amazon Web Services', priority: 'low', marketCap: 'Part of AMZN', similarity: 0.6 }
    ];
    topics = [
      { id: 'topic-1', name: 'Artificial Intelligence', priority: 'high', trending: true },
      { id: 'topic-2', name: 'Cloud Computing', priority: 'high', trending: false },
      { id: 'topic-3', name: 'Cybersecurity', priority: 'high', trending: true },
      { id: 'topic-4', name: 'Digital Transformation', priority: 'medium', trending: true },
      { id: 'topic-5', name: 'Sustainability Tech', priority: 'medium', trending: true }
    ];
  }
  
  return {
    industry,
    competitors,
    topics,
    stakeholders: {
      regulators: ['FTC', 'State Business Regulators'],
      investors: ['Venture Capital', 'Private Equity', 'Angel Investors'],
      customers: ['Enterprise Clients', 'SMB Market', 'Individual Users'],
      media: ['TechCrunch', 'Business Insider', 'Industry Publications']
    }
  };
}