/**
 * Industry Keyword Database
 * Simple database of keywords and competitors for different industries
 */

const industryDatabase = {
  technology: {
    keywords: [
      'artificial intelligence', 'AI', 'machine learning', 'cloud computing',
      'cybersecurity', 'data breach', 'SaaS', 'API', 'blockchain', 
      'quantum computing', 'edge computing', '5G', 'IoT', 'automation',
      'digital transformation', 'tech layoffs', 'IPO', 'acquisition',
      'product launch', 'earnings report', 'partnership', 'innovation'
    ],
    majorPlayers: [
      'Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'OpenAI',
      'Tesla', 'NVIDIA', 'Intel', 'IBM', 'Oracle', 'Salesforce',
      'Adobe', 'Zoom', 'Slack', 'Dropbox', 'Spotify', 'Netflix'
    ],
    trendingTopics: [
      'generative AI', 'ChatGPT', 'large language models', 'AI regulation',
      'return to office', 'remote work', 'tech regulation', 'antitrust'
    ]
  },
  
  finance: {
    keywords: [
      'interest rates', 'Fed', 'inflation', 'recession', 'banking crisis',
      'cryptocurrency', 'Bitcoin', 'fintech', 'digital banking', 'payments',
      'lending', 'investment', 'IPO', 'merger', 'acquisition', 'earnings',
      'stock market', 'trading', 'regulation', 'compliance'
    ],
    majorPlayers: [
      'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Goldman Sachs',
      'Morgan Stanley', 'Citigroup', 'BlackRock', 'Vanguard', 'Fidelity',
      'PayPal', 'Square', 'Stripe', 'Visa', 'Mastercard', 'American Express'
    ],
    trendingTopics: [
      'regional banking', 'SVB collapse', 'interest rate hikes', 'crypto regulation',
      'CBDC', 'digital dollar', 'ESG investing', 'retail trading'
    ]
  },
  
  healthcare: {
    keywords: [
      'FDA approval', 'clinical trial', 'drug development', 'biotech',
      'telemedicine', 'digital health', 'AI in healthcare', 'genomics',
      'vaccine', 'pandemic', 'medical device', 'pharma', 'healthcare costs',
      'insurance', 'Medicare', 'patient care', 'breakthrough therapy'
    ],
    majorPlayers: [
      'Johnson & Johnson', 'Pfizer', 'Moderna', 'AstraZeneca', 'Merck',
      'Abbott', 'Medtronic', 'UnitedHealth', 'Anthem', 'CVS Health',
      'Walgreens', 'Teladoc', 'GoodRx', 'Roche', 'Novartis'
    ],
    trendingTopics: [
      'Ozempic', 'weight loss drugs', 'AI diagnosis', 'personalized medicine',
      'mental health', 'healthcare access', 'drug pricing', 'telehealth adoption'
    ]
  },
  
  retail: {
    keywords: [
      'e-commerce', 'online shopping', 'supply chain', 'inventory',
      'consumer spending', 'holiday sales', 'Black Friday', 'Prime Day',
      'store closures', 'bankruptcy', 'omnichannel', 'direct to consumer',
      'subscription', 'loyalty program', 'customer experience', 'returns'
    ],
    majorPlayers: [
      'Amazon', 'Walmart', 'Target', 'Costco', 'Home Depot', 'Lowes',
      'Best Buy', 'Kroger', 'CVS', 'Walgreens', 'Nike', 'Starbucks',
      'McDonalds', 'Chipotle', 'Shopify', 'eBay', 'Etsy'
    ],
    trendingTopics: [
      'retail theft', 'self-checkout', 'same-day delivery', 'social commerce',
      'sustainability', 'resale market', 'inflation impact', 'AI shopping'
    ]
  },
  
  energy: {
    keywords: [
      'renewable energy', 'solar', 'wind power', 'oil prices', 'natural gas',
      'electric vehicles', 'EV charging', 'battery technology', 'grid',
      'climate change', 'carbon neutral', 'net zero', 'ESG', 'sustainability',
      'energy crisis', 'power outage', 'nuclear energy', 'hydrogen'
    ],
    majorPlayers: [
      'ExxonMobil', 'Chevron', 'Shell', 'BP', 'Tesla', 'Rivian',
      'ChargePoint', 'NextEra Energy', 'Duke Energy', 'Southern Company',
      'Enphase', 'First Solar', 'Plug Power', 'Bloom Energy'
    ],
    trendingTopics: [
      'EV adoption', 'charging infrastructure', 'energy independence',
      'green hydrogen', 'carbon capture', 'renewable transition', 'oil demand'
    ]
  },
  
  media: {
    keywords: [
      'streaming', 'content', 'advertising', 'social media', 'journalism',
      'fake news', 'misinformation', 'platform', 'creator economy',
      'podcast', 'newsletter', 'subscription', 'viewership', 'ratings',
      'merger', 'acquisition', 'layoffs', 'revenue'
    ],
    majorPlayers: [
      'Disney', 'Netflix', 'Warner Bros Discovery', 'Paramount', 'NBC Universal',
      'Meta', 'Google', 'TikTok', 'X (Twitter)', 'LinkedIn', 'Snapchat',
      'New York Times', 'CNN', 'Fox', 'Spotify', 'YouTube'
    ],
    trendingTopics: [
      'streaming wars', 'cord cutting', 'AI content', 'creator monetization',
      'platform moderation', 'news credibility', 'sports rights', 'bundling'
    ]
  }
};

class IndustryKeywordService {
  /**
   * Get keywords for a specific industry
   */
  getIndustryKeywords(industry) {
    const normalizedIndustry = this.normalizeIndustry(industry);
    return industryDatabase[normalizedIndustry] || industryDatabase.technology;
  }
  
  /**
   * Identify competitors based on company name and industry
   */
  identifyCompetitors(companyName, industry) {
    const industryData = this.getIndustryKeywords(industry);
    
    // Filter out the company itself from competitors
    const competitors = industryData.majorPlayers.filter(
      player => !player.toLowerCase().includes(companyName.toLowerCase()) &&
                !companyName.toLowerCase().includes(player.toLowerCase())
    );
    
    // Return top 5 competitors
    return competitors.slice(0, 5);
  }
  
  /**
   * Generate search queries for trending topics
   */
  generateTrendingSearchQueries(companyName, industry) {
    const industryData = this.getIndustryKeywords(industry);
    const queries = [];
    
    // Company-specific queries
    queries.push(`${companyName} news`);
    queries.push(`${companyName} announcement`);
    
    // Industry trending topics
    industryData.trendingTopics.slice(0, 3).forEach(topic => {
      queries.push(`${topic} ${industry}`);
    });
    
    // Competitor queries
    const competitors = this.identifyCompetitors(companyName, industry);
    competitors.slice(0, 2).forEach(competitor => {
      queries.push(`${competitor} latest`);
    });
    
    return queries;
  }
  
  /**
   * Get monitoring topics based on company and industry
   */
  getMonitoringTopics(companyName, industry, objectives) {
    const industryData = this.getIndustryKeywords(industry);
    const topics = {
      company: [
        `${companyName} announcement`,
        `${companyName} product launch`,
        `${companyName} partnership`,
        `${companyName} executive`,
        `${companyName} earnings`
      ],
      industry: industryData.trendingTopics.slice(0, 5),
      competitors: this.identifyCompetitors(companyName, industry).map(
        comp => `${comp} news`
      ),
      keywords: industryData.keywords.slice(0, 10)
    };
    
    // Add objective-specific topics
    if (objectives) {
      const objLower = objectives.toLowerCase();
      if (objLower.includes('launch')) {
        topics.company.push(`${companyName} product release`);
      }
      if (objLower.includes('crisis')) {
        topics.company.push(`${companyName} controversy`);
        topics.company.push(`${companyName} scandal`);
      }
      if (objLower.includes('ipo')) {
        topics.company.push(`${companyName} IPO`);
        topics.company.push(`${companyName} public offering`);
      }
    }
    
    return topics;
  }
  
  /**
   * Normalize industry name to match database keys
   */
  normalizeIndustry(industry) {
    if (!industry) return 'technology';
    
    const industryLower = industry.toLowerCase();
    
    // Map common variations to database keys
    if (industryLower.includes('tech') || industryLower.includes('software')) {
      return 'technology';
    }
    if (industryLower.includes('financ') || industryLower.includes('bank')) {
      return 'finance';
    }
    if (industryLower.includes('health') || industryLower.includes('medical') || 
        industryLower.includes('pharma') || industryLower.includes('bio')) {
      return 'healthcare';
    }
    if (industryLower.includes('retail') || industryLower.includes('commerce') ||
        industryLower.includes('shop')) {
      return 'retail';
    }
    if (industryLower.includes('energy') || industryLower.includes('oil') ||
        industryLower.includes('electric') || industryLower.includes('power')) {
      return 'energy';
    }
    if (industryLower.includes('media') || industryLower.includes('entertainment') ||
        industryLower.includes('news') || industryLower.includes('social')) {
      return 'media';
    }
    
    // Default to technology if no match
    return 'technology';
  }
  
  /**
   * Get suggested monitoring strategy
   */
  getSuggestedStrategy(companyName, industry) {
    const competitors = this.identifyCompetitors(companyName, industry);
    const topics = this.getMonitoringTopics(companyName, industry);
    
    return {
      focus: `Monitor ${companyName} mentions and ${competitors.length} key competitors`,
      competitors: competitors,
      topicsToTrack: [
        ...topics.company.slice(0, 3),
        ...topics.industry.slice(0, 3)
      ],
      searchQueries: this.generateTrendingSearchQueries(companyName, industry),
      updateFrequency: 'Every 30 minutes for trending topics',
      alerts: [
        `${companyName} mentioned with negative sentiment`,
        'Competitor makes major announcement',
        'Industry trending topic spike'
      ]
    };
  }
}

export default new IndustryKeywordService();