// Industry-specific competitor mapping
const industryCompetitors = {
  automotive: {
    primary: ['Tesla', 'Toyota', 'Volkswagen', 'General Motors', 'Ford', 'Stellantis', 'Mercedes-Benz', 'BMW', 'Hyundai-Kia', 'Honda', 'Nissan'],
    emerging: ['Rivian', 'Lucid Motors', 'BYD', 'NIO', 'XPeng', 'Li Auto', 'Polestar', 'Fisker'],
    keywords: ['electric vehicles', 'autonomous driving', 'hybrid technology', 'manufacturing', 'supply chain', 'sustainability', 'battery technology', 'charging infrastructure'],
    topics: ['EV adoption', 'autonomous vehicles', 'sustainability initiatives', 'supply chain resilience', 'manufacturing innovation']
  },
  
  technology: {
    primary: ['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Oracle', 'Salesforce', 'IBM', 'Intel', 'NVIDIA'],
    emerging: ['OpenAI', 'Anthropic', 'Databricks', 'Snowflake', 'Stripe', 'Canva', 'Figma'],
    keywords: ['artificial intelligence', 'cloud computing', 'cybersecurity', 'data privacy', 'digital transformation', 'API', 'SaaS'],
    topics: ['AI regulation', 'data privacy', 'cloud adoption', 'digital transformation', 'cybersecurity threats']
  },
  
  healthcare: {
    primary: ['Johnson & Johnson', 'Pfizer', 'UnitedHealth', 'CVS Health', 'Anthem', 'Abbott', 'Medtronic', 'Thermo Fisher'],
    emerging: ['Teladoc', 'Oscar Health', 'Babylon Health', 'Carbon Health', 'Ro', 'Hims & Hers'],
    keywords: ['clinical trials', 'FDA approval', 'telehealth', 'patient outcomes', 'drug discovery', 'medical devices', 'healthcare AI'],
    topics: ['telehealth adoption', 'drug pricing', 'clinical innovations', 'patient data privacy', 'healthcare accessibility']
  },
  
  finance: {
    primary: ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley', 'Citi', 'American Express', 'Visa', 'Mastercard'],
    emerging: ['Stripe', 'Square', 'Robinhood', 'Coinbase', 'Affirm', 'Klarna', 'Chime', 'SoFi'],
    keywords: ['fintech', 'digital banking', 'cryptocurrency', 'blockchain', 'regulatory compliance', 'interest rates', 'mobile payments'],
    topics: ['digital transformation', 'cryptocurrency regulation', 'open banking', 'financial inclusion', 'cybersecurity']
  },
  
  retail: {
    primary: ['Amazon', 'Walmart', 'Target', 'Costco', 'Home Depot', 'CVS', 'Kroger', 'Walgreens'],
    emerging: ['Shopify', 'Instacart', 'DoorDash', 'Gopuff', 'Faire', 'StockX'],
    keywords: ['e-commerce', 'omnichannel', 'supply chain', 'customer experience', 'inventory management', 'last-mile delivery'],
    topics: ['e-commerce growth', 'supply chain optimization', 'sustainability', 'customer personalization', 'social commerce']
  },
  
  media: {
    primary: ['Disney', 'Netflix', 'Warner Bros Discovery', 'Comcast', 'Paramount', 'Sony', 'Fox Corporation'],
    emerging: ['Spotify', 'TikTok', 'YouTube', 'Twitch', 'Substack', 'Discord', 'Clubhouse'],
    keywords: ['streaming', 'content creation', 'subscription model', 'advertising', 'user engagement', 'original content'],
    topics: ['streaming wars', 'content monetization', 'creator economy', 'advertising technology', 'user privacy']
  },
  
  energy: {
    primary: ['ExxonMobil', 'Chevron', 'Shell', 'BP', 'TotalEnergies', 'ConocoPhillips', 'NextEra Energy'],
    emerging: ['Tesla Energy', 'Enphase', 'First Solar', 'ChargePoint', 'Bloom Energy', 'Plug Power'],
    keywords: ['renewable energy', 'carbon emissions', 'sustainability', 'energy transition', 'electric grid', 'hydrogen fuel'],
    topics: ['energy transition', 'carbon neutrality', 'renewable adoption', 'grid modernization', 'energy storage']
  },
  
  manufacturing: {
    primary: ['General Electric', '3M', 'Honeywell', 'Caterpillar', 'Boeing', 'Lockheed Martin', 'Siemens', 'ABB'],
    emerging: ['Desktop Metal', 'Markforged', 'Carbon', 'Relativity Space', 'Protolabs'],
    keywords: ['automation', 'Industry 4.0', 'supply chain', 'quality control', 'lean manufacturing', 'robotics', '3D printing'],
    topics: ['automation adoption', 'supply chain resilience', 'sustainability', 'workforce transformation', 'smart manufacturing']
  },
  
  education: {
    primary: ['Pearson', 'McGraw Hill', 'Cengage', 'Blackboard', 'Canvas', 'Chegg', '2U'],
    emerging: ['Coursera', 'Udemy', 'Duolingo', 'MasterClass', 'Khan Academy', 'Outschool', 'Guild Education'],
    keywords: ['online learning', 'edtech', 'student engagement', 'learning outcomes', 'accessibility', 'personalized learning'],
    topics: ['online education', 'skill development', 'education accessibility', 'AI in education', 'micro-credentials']
  },
  
  hospitality: {
    primary: ['Marriott', 'Hilton', 'Hyatt', 'InterContinental', 'Accor', 'Wyndham', 'Choice Hotels'],
    emerging: ['Airbnb', 'Vrbo', 'Booking.com', 'Sonder', 'Selina', 'OYO'],
    keywords: ['guest experience', 'occupancy rates', 'revenue management', 'loyalty programs', 'sustainability', 'contactless technology'],
    topics: ['travel recovery', 'sustainability initiatives', 'digital transformation', 'alternative accommodations', 'guest personalization']
  }
};

// Function to get competitors for a specific industry
export function getIndustryCompetitors(industry) {
  const normalizedIndustry = industry?.toLowerCase().trim();
  
  // Check for direct match
  if (industryCompetitors[normalizedIndustry]) {
    return industryCompetitors[normalizedIndustry];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(industryCompetitors)) {
    if (normalizedIndustry?.includes(key) || key.includes(normalizedIndustry)) {
      return value;
    }
  }
  
  // Default to technology if no match
  return industryCompetitors.technology;
}

// Function to detect industry from organization name
export function detectIndustryFromOrganization(orgName) {
  const name = orgName?.toLowerCase();
  
  // Automotive companies
  if (['toyota', 'ford', 'gm', 'general motors', 'tesla', 'volkswagen', 'bmw', 'mercedes', 'honda', 'nissan', 'hyundai', 'kia', 'stellantis', 'chrysler', 'rivian', 'lucid'].some(auto => name?.includes(auto))) {
    return 'automotive';
  }
  
  // Healthcare companies
  if (['hospital', 'health', 'medical', 'pharma', 'pfizer', 'johnson', 'cvs', 'unitedhealth', 'anthem', 'clinic', 'therapeutics', 'bio'].some(health => name?.includes(health))) {
    return 'healthcare';
  }
  
  // Finance companies
  if (['bank', 'capital', 'financial', 'jpmorgan', 'chase', 'wells fargo', 'goldman', 'morgan stanley', 'visa', 'mastercard', 'american express', 'citi'].some(fin => name?.includes(fin))) {
    return 'finance';
  }
  
  // Retail companies
  if (['walmart', 'target', 'amazon', 'costco', 'kroger', 'walgreens', 'cvs', 'store', 'retail', 'shop'].some(retail => name?.includes(retail))) {
    return 'retail';
  }
  
  // Media companies
  if (['disney', 'netflix', 'warner', 'paramount', 'comcast', 'news', 'media', 'entertainment', 'broadcast'].some(media => name?.includes(media))) {
    return 'media';
  }
  
  // Energy companies
  if (['exxon', 'chevron', 'shell', 'bp', 'energy', 'oil', 'gas', 'solar', 'wind', 'power'].some(energy => name?.includes(energy))) {
    return 'energy';
  }
  
  // Default to technology for tech-sounding names
  return 'technology';
}

// Function to enhance organization data with industry context
export function enhanceOrganizationWithIndustry(organization, industry) {
  const industryData = getIndustryCompetitors(industry);
  
  return {
    ...organization,
    industry: industry,
    suggestedCompetitors: industryData.primary.slice(0, 5),
    emergingCompetitors: industryData.emerging.slice(0, 3),
    industryKeywords: industryData.keywords,
    industryTopics: industryData.topics
  };
}

export default industryCompetitors;