const claudeService = require('../../config/claude');
const Parser = require('rss-parser');

// Multi-source intelligence gathering
exports.gatherIntelligence = async (req, res) => {
  try {
    const { stakeholders, sources, depth = 'standard' } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== INTELLIGENCE GATHERING REQUEST ===');
    console.log('Stakeholders:', stakeholders?.length);
    console.log('Sources:', sources?.length);
    console.log('Depth:', depth);
    
    const allIntelligence = [];
    
    for (const stakeholder of stakeholders) {
      console.log(`Gathering intelligence for: ${stakeholder.name}`);
      
      // 1. RSS Feeds (existing capability)
      const rssIntel = await gatherRSSIntelligence(stakeholder);
      allIntelligence.push(...rssIntel);
      
      // 2. Web Search Intelligence
      if (sources.includes('web')) {
        const webIntel = await gatherWebIntelligence(stakeholder);
        allIntelligence.push(...webIntel);
      }
      
      // 3. Social Media Intelligence (mock for now)
      if (sources.includes('social')) {
        const socialIntel = await gatherSocialIntelligence(stakeholder);
        allIntelligence.push(...socialIntel);
      }
      
      // 4. Regulatory Intelligence
      if (sources.includes('regulatory')) {
        const regIntel = await gatherRegulatoryIntelligence(stakeholder);
        allIntelligence.push(...regIntel);
      }
      
      // 5. Media Intelligence
      if (sources.includes('media')) {
        const mediaIntel = await gatherMediaIntelligence(stakeholder);
        allIntelligence.push(...mediaIntel);
      }
    }
    
    // Process and analyze all intelligence
    const processedIntelligence = await processIntelligence(allIntelligence, stakeholders);
    
    res.json({
      success: true,
      intelligence: processedIntelligence,
      totalFound: allIntelligence.length,
      sources: {
        rss: allIntelligence.filter(i => i.source === 'rss').length,
        web: allIntelligence.filter(i => i.source === 'web').length,
        social: allIntelligence.filter(i => i.source === 'social').length,
        regulatory: allIntelligence.filter(i => i.source === 'regulatory').length,
        media: allIntelligence.filter(i => i.source === 'media').length
      }
    });
    
  } catch (error) {
    console.error('Intelligence gathering error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to gather intelligence'
    });
  }
};

// RSS Intelligence (enhanced from existing)
async function gatherRSSIntelligence(stakeholder) {
  const parser = new Parser();
  const intelligence = [];
  
  const feeds = [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.feedburner.com/venturebeat/SZYF',
    'https://www.prnewswire.com/rss/news-releases-list.rss'
  ];
  
  for (const feedUrl of feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      feed.items.forEach(item => {
        const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
        const keywords = stakeholder.keywords || [stakeholder.name];
        
        if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
          intelligence.push({
            id: `rss-${Date.now()}-${Math.random()}`,
            type: 'article',
            source: 'rss',
            sourceName: feed.title,
            title: item.title,
            content: item.contentSnippet || item.content,
            url: item.link,
            publishDate: new Date(item.pubDate || Date.now()),
            stakeholder: stakeholder.name,
            relevance: calculateRelevance(content, keywords)
          });
        }
      });
    } catch (err) {
      console.error(`RSS feed error for ${feedUrl}:`, err.message);
    }
  }
  
  return intelligence;
}

// Web Search Intelligence (mock implementation)
async function gatherWebIntelligence(stakeholder) {
  // In production, this would use actual web scraping or search APIs
  const mockResults = [
    {
      id: `web-${Date.now()}-${Math.random()}`,
      type: 'web_page',
      source: 'web',
      sourceName: 'Industry News Site',
      title: `${stakeholder.name} Announces Strategic Partnership`,
      content: 'Recent developments show strategic moves in the market...',
      url: 'https://example.com/article',
      publishDate: new Date(),
      stakeholder: stakeholder.name,
      relevance: 0.85
    }
  ];
  
  return mockResults;
}

// Social Media Intelligence
async function gatherSocialIntelligence(stakeholder) {
  // Mock social media mentions
  const socialPlatforms = ['Twitter', 'LinkedIn', 'Reddit'];
  const intelligence = [];
  
  socialPlatforms.forEach(platform => {
    intelligence.push({
      id: `social-${Date.now()}-${Math.random()}`,
      type: 'social_mention',
      source: 'social',
      sourceName: platform,
      author: `@industry_expert`,
      content: `Interesting developments at ${stakeholder.name}. Their new strategy seems promising.`,
      engagement: {
        likes: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50)
      },
      publishDate: new Date(),
      stakeholder: stakeholder.name,
      relevance: 0.75
    });
  });
  
  return intelligence;
}

// Regulatory Intelligence
async function gatherRegulatoryIntelligence(stakeholder) {
  // Mock regulatory filings
  return [{
    id: `reg-${Date.now()}-${Math.random()}`,
    type: 'filing',
    source: 'regulatory',
    sourceName: 'SEC EDGAR',
    title: 'Form 10-Q Quarterly Report',
    content: 'Quarterly financial results and material events...',
    filingType: '10-Q',
    publishDate: new Date(),
    stakeholder: stakeholder.name,
    importance: 'high',
    relevance: 0.95
  }];
}

// Media Intelligence
async function gatherMediaIntelligence(stakeholder) {
  // Mock media mentions (podcasts, videos, etc.)
  return [{
    id: `media-${Date.now()}-${Math.random()}`,
    type: 'transcript',
    source: 'media',
    sourceName: 'Industry Podcast',
    title: `CEO Interview: ${stakeholder.name}'s Future Strategy`,
    content: 'In this episode, we discuss the company\'s vision for the next decade...',
    mediaType: 'podcast',
    duration: '45:23',
    publishDate: new Date(),
    stakeholder: stakeholder.name,
    keyPoints: [
      'Expansion into new markets',
      'Technology investments',
      'Sustainability initiatives'
    ],
    relevance: 0.88
  }];
}

// Process and enhance intelligence with AI
async function processIntelligence(rawIntelligence, stakeholders) {
  const processed = [];
  
  for (const intel of rawIntelligence) {
    try {
      // Enhance with AI analysis
      const enhancedIntel = await enhanceWithAI(intel, stakeholders);
      processed.push(enhancedIntel);
    } catch (error) {
      console.error('Error processing intelligence:', error);
      processed.push(intel); // Include unprocessed if enhancement fails
    }
  }
  
  // Sort by relevance and date
  return processed.sort((a, b) => {
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    return new Date(b.publishDate) - new Date(a.publishDate);
  });
}

// AI Enhancement
async function enhanceWithAI(intelligence, stakeholders) {
  const prompt = `Analyze this intelligence for strategic insights:

Source: ${intelligence.sourceName}
Type: ${intelligence.type}
Content: ${intelligence.title}
${intelligence.content}

Stakeholder Context: ${intelligence.stakeholder}

Provide:
1. Sentiment analysis (positive/negative/neutral)
2. Strategic importance (high/medium/low)
3. Key insights (2-3 bullet points)
4. Recommended actions
5. Related stakeholders affected

Format as JSON.`;

  try {
    const response = await claudeService.sendMessage(prompt);
    const analysis = parseAIResponse(response);
    
    return {
      ...intelligence,
      sentiment: analysis.sentiment || 'neutral',
      importance: analysis.importance || 'medium',
      insights: analysis.insights || [],
      recommendedActions: analysis.actions || [],
      relatedStakeholders: analysis.relatedStakeholders || [],
      aiEnhanced: true
    };
  } catch (error) {
    console.error('AI enhancement error:', error);
    return {
      ...intelligence,
      aiEnhanced: false
    };
  }
}

function parseAIResponse(response) {
  try {
    return JSON.parse(response);
  } catch (e) {
    // Extract JSON if wrapped in text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        return {};
      }
    }
    return {};
  }
}

function calculateRelevance(content, keywords) {
  const lowerContent = content.toLowerCase();
  let score = 0;
  
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    const occurrences = (lowerContent.match(new RegExp(lowerKeyword, 'g')) || []).length;
    score += occurrences * 0.1;
  });
  
  return Math.min(score, 1);
}

// Source discovery endpoint
exports.discoverSources = async (req, res) => {
  try {
    const { stakeholder } = req.body;
    
    const prompt = `Given this stakeholder profile:
- Name: ${stakeholder.name}
- Industry: ${stakeholder.industry || 'Unknown'}
- Type: ${stakeholder.type || 'Unknown'}
- Keywords: ${stakeholder.keywords?.join(', ') || 'None'}

Suggest 10 specific online sources where I can find intelligence about them. Include:
- Industry publications
- Relevant forums or communities  
- News sources
- Social media accounts
- Regulatory databases
- Trade associations

Format as JSON array with: name, url, type, and why it's relevant.`;

    const response = await claudeService.sendMessage(prompt);
    const sources = parseAIResponse(response);
    
    res.json({
      success: true,
      sources: Array.isArray(sources) ? sources : [],
      stakeholder: stakeholder.name
    });
    
  } catch (error) {
    console.error('Source discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover sources'
    });
  }
};

// Discover competitors using Claude AI research
exports.discoverCompetitors = async (req, res) => {
  try {
    const { company, industry } = req.body;
    console.log('=== DISCOVER COMPETITORS ===');
    console.log('Company:', company);
    console.log('Industry:', industry);
    
    // Use Claude AI to research competitors intelligently
    const prompt = `You are a business intelligence expert. Research and identify the main competitors of ${company}${industry ? ` in the ${industry} industry` : ''}.

For context:
- ${company === 'uber' ? 'Uber is a ride-sharing and delivery platform company' : `${company} operates in ${industry || 'their market'}`}

Please identify:
1. Direct competitors (companies offering the same services)
2. Indirect competitors (companies that could substitute their services)
3. Emerging competitors (new entrants threatening their market)

For each competitor, assess:
- Market share comparison
- Competitive advantages
- Geographic overlap
- Strategic positioning

Return ONLY a JSON array of the TOP 5 most important competitors (maximum 5) in this format:
[
  {
    "name": "Company Name",
    "type": "direct|indirect|emerging",
    "confidence": 0.9,
    "reason": "Brief reason why they compete"
  }
]

Focus on real, currently operating companies. Limit to 10 most relevant competitors.`;

    let competitors = [];
    
    try {
      const response = await claudeService.sendMessage(prompt);
      console.log('Claude response for competitors:', response.substring(0, 200));
      
      // Parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        competitors = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('Error getting AI competitor analysis:', err);
      
      // Fallback to known competitors for specific companies
      const knownCompetitors = {
        'uber': [
          { name: 'Lyft', type: 'direct', confidence: 0.95, reason: 'Direct ride-sharing competitor in North America' },
          { name: 'DoorDash', type: 'direct', confidence: 0.9, reason: 'Competes in food delivery services' },
          { name: 'Grubhub', type: 'direct', confidence: 0.85, reason: 'Food delivery competitor' },
          { name: 'DiDi', type: 'direct', confidence: 0.8, reason: 'Global ride-sharing competitor' },
          { name: 'Grab', type: 'direct', confidence: 0.8, reason: 'Southeast Asian super-app competitor' }
        ],
        'default': [
          { name: 'Industry Leader 1', type: 'direct', confidence: 0.8, reason: 'Market leader' },
          { name: 'Industry Leader 2', type: 'direct', confidence: 0.75, reason: 'Major competitor' }
        ]
      };
      
      competitors = knownCompetitors[company.toLowerCase()] || knownCompetitors['default'];
    }
    
    // Ensure we only return maximum 5 competitors
    const limitedCompetitors = competitors.slice(0, 5);
    
    res.json({
      success: true,
      competitors: limitedCompetitors,
      message: `Identified ${limitedCompetitors.length} top competitors through research`
    });
    
  } catch (error) {
    console.error('Discover competitors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover competitors'
    });
  }
};

// Discover topics using Claude AI research
exports.discoverTopics = async (req, res) => {
  try {
    const { company, industry } = req.body;
    console.log('=== DISCOVER TOPICS ===');
    console.log('Company:', company);
    console.log('Industry:', industry);
    
    // Use Claude AI to identify relevant topics to monitor
    const prompt = `You are a strategic intelligence expert. Identify the most important topics and trends that ${company}${industry ? ` in the ${industry} industry` : ''} should monitor.

Consider:
1. Industry-specific trends and disruptions
2. Regulatory and compliance topics
3. Technology trends affecting their business
4. Consumer behavior changes
5. Economic factors
6. Competitive dynamics
7. Stakeholder concerns (investors, customers, employees, regulators)

For ${company === 'uber' ? 'Uber specifically, consider ride-sharing regulations, gig economy debates, autonomous vehicles, and delivery market trends' : `${company}, consider their specific market context`}.

Return ONLY a JSON array of the TOP 5 most critical topics (maximum 5) in this format:
[
  {
    "topic": "Topic Name",
    "category": "regulation|technology|market|social|economic",
    "relevance": 0.9,
    "trending": true,
    "reason": "Why this topic matters for them"
  }
]

Focus on actionable intelligence topics. Limit to 12 most critical topics.`;

    let topics = [];
    
    try {
      const response = await claudeService.sendMessage(prompt);
      console.log('Claude response for topics:', response.substring(0, 200));
      
      // Parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('Error getting AI topic analysis:', err);
      
      // Fallback to known topics for specific companies
      const knownTopics = {
        'uber': [
          { topic: 'Gig Economy Regulation', category: 'regulation', relevance: 0.95, trending: true, reason: 'Critical for driver classification and labor costs' },
          { topic: 'Autonomous Vehicles', category: 'technology', relevance: 0.9, trending: true, reason: 'Future of transportation and competitive advantage' },
          { topic: 'Urban Mobility Policy', category: 'regulation', relevance: 0.85, trending: true, reason: 'City-level regulations affect operations' },
          { topic: 'Food Delivery Market', category: 'market', relevance: 0.85, trending: true, reason: 'Major revenue stream through Uber Eats' },
          { topic: 'Driver Supply and Retention', category: 'social', relevance: 0.8, trending: true, reason: 'Core operational challenge' },
          { topic: 'ESG and Sustainability', category: 'social', relevance: 0.75, trending: true, reason: 'Investor and regulatory pressure' },
          { topic: 'Data Privacy Laws', category: 'regulation', relevance: 0.8, trending: true, reason: 'User data protection requirements' },
          { topic: 'Inflation and Fuel Costs', category: 'economic', relevance: 0.85, trending: true, reason: 'Direct impact on driver economics' },
          { topic: 'Public Transportation Integration', category: 'market', relevance: 0.7, trending: false, reason: 'Partnership opportunities' },
          { topic: 'AI and Route Optimization', category: 'technology', relevance: 0.75, trending: true, reason: 'Operational efficiency' }
        ],
        'default': [
          { topic: 'Digital Transformation', category: 'technology', relevance: 0.8, trending: true, reason: 'Industry-wide trend' },
          { topic: 'Regulatory Compliance', category: 'regulation', relevance: 0.85, trending: true, reason: 'Critical for operations' },
          { topic: 'Market Competition', category: 'market', relevance: 0.9, trending: true, reason: 'Competitive dynamics' },
          { topic: 'Customer Experience', category: 'social', relevance: 0.8, trending: true, reason: 'Key differentiator' }
        ]
      };
      
      topics = knownTopics[company.toLowerCase()] || knownTopics['default'];
    }
    
    // Ensure we only return maximum 5 topics
    const limitedTopics = topics.slice(0, 5);
    
    res.json({
      success: true,
      topics: limitedTopics,
      message: `Identified ${limitedTopics.length} critical topics through research`
    });
    
  } catch (error) {
    console.error('Discover topics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover topics'
    });
  }
};

module.exports = exports;