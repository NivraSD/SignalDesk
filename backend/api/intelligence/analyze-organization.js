export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { organization, url } = req.body;
  
  // Input validation
  if (!organization || typeof organization !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'Organization name is required' 
    });
  }
  
  const orgName = organization.trim().toLowerCase();
  
  // Generate dynamic responses based on organization name
  const industries = [
    'Technology & Innovation',
    'Healthcare & Life Sciences', 
    'Financial Services',
    'Retail & E-commerce',
    'Manufacturing & Supply Chain',
    'Energy & Sustainability',
    'Media & Entertainment',
    'Transportation & Logistics'
  ];
  
  // Use organization name to generate semi-random but consistent results
  const industryIndex = orgName.charCodeAt(0) % industries.length;
  const selectedIndustry = industries[industryIndex];
  
  // Generate competitors based on org name
  const competitorTemplates = [
    { prefix: 'Global', suffix: 'Corp' },
    { prefix: 'Prime', suffix: 'Solutions' },
    { prefix: 'Next', suffix: 'Ventures' },
    { prefix: 'Future', suffix: 'Systems' },
    { prefix: 'Alpha', suffix: 'Tech' },
    { prefix: 'Meta', suffix: 'Group' },
    { prefix: 'Core', suffix: 'Partners' },
    { prefix: 'Edge', suffix: 'Networks' }
  ];
  
  const competitors = competitorTemplates.slice(0, 4).map((template, index) => ({
    name: `${template.prefix} ${orgName.charAt(0).toUpperCase()}${template.suffix}`,
    relevance: 0.95 - (index * 0.1),
    description: index === 0 ? 'Direct market competitor' : 
                 index === 1 ? 'Adjacent market player' :
                 index === 2 ? 'Emerging challenger' : 
                 'International competitor'
  }));
  
  // Generate topics based on industry
  const topicsByIndustry = {
    'Technology & Innovation': [
      'Digital Transformation', 'AI & Machine Learning', 'Cloud Infrastructure', 
      'Cybersecurity', 'Product Innovation', 'Developer Experience'
    ],
    'Healthcare & Life Sciences': [
      'Patient Outcomes', 'Clinical Research', 'Regulatory Compliance',
      'Digital Health', 'Drug Discovery', 'Healthcare Access'
    ],
    'Financial Services': [
      'Digital Banking', 'Risk Management', 'Regulatory Compliance',
      'Fintech Innovation', 'Customer Experience', 'ESG Investing'
    ],
    'default': [
      'Digital Transformation', 'Market Expansion', 'Customer Experience',
      'Sustainability', 'Innovation Strategy', 'Talent Acquisition'
    ]
  };
  
  const industryTopics = topicsByIndustry[selectedIndustry] || topicsByIndustry.default;
  const topics = industryTopics.map((topic, index) => ({
    name: topic,
    importance: index < 2 ? 'critical' : index < 4 ? 'high' : 'medium',
    category: topic.includes('Digital') || topic.includes('AI') ? 'Technology' :
              topic.includes('Customer') || topic.includes('Patient') ? 'Operations' :
              topic.includes('Regulatory') || topic.includes('Compliance') ? 'Compliance' :
              topic.includes('ESG') || topic.includes('Sustainability') ? 'ESG' :
              'Business'
  }));
  
  // Dynamic AI analysis response based on input
  return res.status(200).json({
    success: true,
    organization: organization.trim(),
    analysis: {
      industry: selectedIndustry,
      mainFocus: `${selectedIndustry.split(' ')[0].toLowerCase()} transformation and market leadership`,
      competitors,
      topics,
      suggestedKeywords: [
        organization.toLowerCase(),
        `${orgName} news`,
        selectedIndustry.toLowerCase().replace(' & ', ' '),
        'industry trends',
        'market analysis',
        competitors[0].name.toLowerCase()
      ]
    }
  });
}