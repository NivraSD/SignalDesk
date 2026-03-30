const pool = require('../../config/database');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');
const sentimentEngine = require('../services/sentimentEngine');

// Save monitoring strategy generated from brand profile
exports.saveStrategy = async (req, res) => {
  try {
    const { brandProfile, strategy, setupComplete } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== SAVING AI MONITORING STRATEGY ===');
    console.log('Brand:', brandProfile.name);
    console.log('Keywords:', strategy.primaryKeywords);
    
    // Save to database
    await pool.query(
      `INSERT INTO ai_monitoring_strategies (user_id, brand_profile, strategy, setup_complete, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET 
         brand_profile = $2,
         strategy = $3,
         setup_complete = $4,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, JSON.stringify(brandProfile), JSON.stringify(strategy), setupComplete]
    );
    
    res.json({ success: true, message: 'Strategy saved successfully' });
  } catch (error) {
    console.error('Error saving strategy:', error);
    res.status(500).json({ error: 'Failed to save strategy' });
  }
};

// Fetch enhanced mentions with opportunity detection
exports.fetchEnhanced = async (req, res) => {
  try {
    const { strategy, includeOpportunities, includeCascadeAnalysis } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== FETCHING ENHANCED MENTIONS ===');
    console.log('Include opportunities:', includeOpportunities);
    console.log('Include cascade analysis:', includeCascadeAnalysis);
    
    // Fetch mentions from various sources
    const mentions = await fetchFromMultipleSources(strategy);
    
    // Enhance each mention with AI analysis
    const enhancedMentions = await Promise.all(
      mentions.slice(0, 20).map(async (mention) => {
        try {
          const enhanced = await enhanceMention(mention, strategy, {
            includeOpportunities,
            includeCascadeAnalysis
          });
          return enhanced;
        } catch (error) {
          console.error('Error enhancing mention:', error);
          return {
            ...mention,
            aiAnalysis: {
              summary: 'Analysis failed',
              sentiment: 'neutral',
              sentimentScore: 0
            }
          };
        }
      })
    );
    
    res.json({ 
      success: true, 
      mentions: enhancedMentions,
      totalFound: mentions.length,
      analyzed: enhancedMentions.length
    });
    
  } catch (error) {
    console.error('Error fetching enhanced mentions:', error);
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
};

// Get current monitoring metrics
exports.getMetrics = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    // Get recent mentions and calculate metrics
    const result = await pool.query(
      `SELECT * FROM monitoring_mentions 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC`,
      [userId]
    );
    
    const mentions = result.rows;
    
    // Calculate various metrics
    const metrics = {
      brandHealth: calculateBrandHealth(mentions),
      competitivePosition: calculateCompetitivePosition(mentions),
      opportunityCount: mentions.filter(m => m.opportunity_score > 70).length,
      riskCount: mentions.filter(m => m.sentiment === 'negative' && m.urgency === 'high').length,
      trends: identifyTrends(mentions),
      patterns: detectPatterns(mentions)
    };
    
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
};

// Helper functions
async function fetchFromMultipleSources(strategy) {
  const allMentions = [];
  const parser = new Parser();
  
  // Define RSS feeds based on strategy
  const feeds = [
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', priority: 'high' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', priority: 'high' },
    { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', priority: 'medium' },
    { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', priority: 'medium' },
    { name: 'Wired', url: 'https://www.wired.com/feed/rss', priority: 'low' }
  ];
  
  // Filter feeds based on strategy priorities
  const relevantFeeds = feeds.filter(feed => 
    strategy.sources.rssCategoriesPriority.includes('technology') || 
    strategy.sources.rssCategoriesPriority.includes('business')
  );
  
  // Combine all keywords for filtering
  const allKeywords = [
    ...strategy.primaryKeywords,
    ...strategy.competitorKeywords,
    ...strategy.industryKeywords,
    ...strategy.opportunityKeywords
  ].map(k => k.toLowerCase());
  
  // Fetch from each feed
  for (const feed of relevantFeeds) {
    try {
      const parsedFeed = await Promise.race([
        parser.parseURL(feed.url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      
      parsedFeed.items.forEach(item => {
        const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
        
        // Check if content matches any keywords
        if (allKeywords.some(keyword => content.includes(keyword))) {
          allMentions.push({
            id: `${feed.name}-${Date.now()}-${Math.random()}`,
            title: item.title,
            content: item.contentSnippet || item.content || item.title,
            source: feed.name,
            sourcePriority: feed.priority,
            publishDate: new Date(item.pubDate || Date.now()),
            url: item.link,
            matchedKeywords: allKeywords.filter(k => content.includes(k))
          });
        }
      });
    } catch (err) {
      console.error(`Failed to fetch ${feed.name}:`, err.message);
    }
  }
  
  // Sort by relevance and recency
  return allMentions.sort((a, b) => {
    // Prioritize by number of matched keywords
    if (a.matchedKeywords.length !== b.matchedKeywords.length) {
      return b.matchedKeywords.length - a.matchedKeywords.length;
    }
    // Then by date
    return b.publishDate - a.publishDate;
  });
}

async function enhanceMention(mention, strategy, options) {
  const { includeOpportunities, includeCascadeAnalysis } = options;
  
  // Build enhanced analysis prompt
  const prompt = `You are an AI monitoring advisor analyzing content for strategic insights.

Brand Context:
- Primary keywords: ${strategy.primaryKeywords.join(', ')}
- Competitors: ${strategy.competitorKeywords.join(', ')}
- Industry: ${strategy.industryKeywords.join(', ')}

Content to analyze:
Title: ${mention.title}
Source: ${mention.source}
Content: ${mention.content}

Analyze this content and provide:
1. Sentiment (positive/negative/neutral/mixed)
2. Sentiment score (-100 to 100)
3. Brief summary (2-3 sentences)
4. Key topics/themes
5. Urgency level (low/medium/high/critical)

${includeOpportunities ? `
6. Opportunity Analysis:
   - Is this a narrative vacuum (topic competitors haven't addressed)?
   - Can this be leveraged for competitive advantage?
   - What's the opportunity score (0-100)?
   - Suggested actions if opportunity exists
` : ''}

${includeCascadeAnalysis ? `
7. Cascade Analysis:
   - What might have caused this? (upstream)
   - What could this lead to? (downstream)
   - Cascade potential score (0-100)
   - Related patterns or trends
` : ''}

Return as JSON with these exact fields:
{
  "sentiment": "positive/negative/neutral/mixed",
  "sentimentScore": -100 to 100,
  "summary": "brief summary",
  "keyTopics": ["topic1", "topic2"],
  "urgency": "low/medium/high/critical",
  "opportunityScore": 0-100,
  "isNarrativeVacuum": true/false,
  "suggestedActions": ["action1", "action2"],
  "cascadePotential": 0-100,
  "upstreamCauses": ["cause1"],
  "downstreamEffects": ["effect1"],
  "relatedPatterns": ["pattern1"]
}`;

  try {
    const response = await claudeService.sendMessage(prompt);
    let analysis;
    
    try {
      analysis = JSON.parse(response);
    } catch (parseError) {
      // Try to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON in response');
      }
    }
    
    return {
      ...mention,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      aiAnalysis: analysis,
      opportunityScore: analysis.opportunityScore || 0,
      cascadePotential: analysis.cascadePotential || 0,
      suggestedActions: analysis.suggestedActions || [],
      type: determineType(analysis, mention)
    };
    
  } catch (error) {
    console.error('Error in AI analysis:', error);
    
    // Fallback to sentiment engine
    const fallbackAnalysis = sentimentEngine.analyze(mention.content, strategy.sentimentContext);
    
    return {
      ...mention,
      sentiment: fallbackAnalysis.sentiment,
      sentimentScore: fallbackAnalysis.sentiment_score,
      aiAnalysis: {
        summary: fallbackAnalysis.summary,
        sentiment: fallbackAnalysis.sentiment,
        sentimentScore: fallbackAnalysis.sentiment_score,
        keyTopics: fallbackAnalysis.key_topics,
        urgency: fallbackAnalysis.urgency_level
      },
      opportunityScore: 0,
      cascadePotential: 0,
      suggestedActions: [],
      type: fallbackAnalysis.sentiment === 'positive' ? 'opportunities' : 
            fallbackAnalysis.sentiment === 'negative' ? 'risks' : 'trends'
    };
  }
}

function determineType(analysis, mention) {
  if (analysis.opportunityScore > 70 || analysis.isNarrativeVacuum) {
    return 'opportunities';
  }
  if (analysis.sentiment === 'negative' && analysis.urgency === 'high') {
    return 'risks';
  }
  if (mention.matchedKeywords?.some(k => mention.content.toLowerCase().includes('competitor'))) {
    return 'competitors';
  }
  return 'trends';
}

function calculateBrandHealth(mentions) {
  if (!mentions.length) return 50;
  
  const sentimentScores = mentions
    .filter(m => m.sentiment_score !== undefined)
    .map(m => m.sentiment_score);
    
  if (!sentimentScores.length) return 50;
  
  const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
  
  // Convert -100 to 100 scale to 0-100
  return Math.round(50 + (avgSentiment / 2));
}

function calculateCompetitivePosition(mentions) {
  // Analyze competitor mentions vs own brand mentions
  const competitorMentions = mentions.filter(m => 
    m.content?.toLowerCase().includes('competitor') ||
    m.matched_keywords?.some(k => k.includes('competitor'))
  );
  
  const ratio = competitorMentions.length / mentions.length;
  
  if (ratio > 0.5) return 'losing';
  if (ratio > 0.3) return 'challenged';
  return 'gaining';
}

function identifyTrends(mentions) {
  // Group mentions by topics and track frequency over time
  const topicFrequency = {};
  
  mentions.forEach(mention => {
    if (mention.key_topics) {
      mention.key_topics.forEach(topic => {
        topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
      });
    }
  });
  
  // Sort by frequency and return top trends
  return Object.entries(topicFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count, trend: 'rising' }));
}

function detectPatterns(mentions) {
  const patterns = [];
  
  // Detect cascade patterns (multiple related mentions)
  const timeGroups = {};
  mentions.forEach(mention => {
    const hourKey = new Date(mention.created_at).toISOString().slice(0, 13);
    timeGroups[hourKey] = timeGroups[hourKey] || [];
    timeGroups[hourKey].push(mention);
  });
  
  Object.entries(timeGroups).forEach(([hour, hourMentions]) => {
    if (hourMentions.length > 5) {
      patterns.push({
        type: 'cascade',
        description: `Spike in mentions (${hourMentions.length}) at ${hour}`,
        mentions: hourMentions.length
      });
    }
  });
  
  return patterns;
}

// Chat analysis with Claude for monitoring advice
exports.chatAnalyze = async (req, res) => {
  try {
    const { prompt, userInput, context, currentProfile } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== CHAT ANALYZE REQUEST ===');
    console.log('User input:', userInput);
    console.log('Has current profile:', !!currentProfile);
    
    // Send to Claude for intelligent analysis
    const response = await claudeService.sendMessage(prompt);
    
    let analysis;
    try {
      // Try to parse JSON response
      analysis = JSON.parse(response);
    } catch (parseError) {
      console.log('Failed to parse JSON, extracting...');
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
          // Fallback response
          analysis = {
            content: response,
            profile: null,
            suggestions: [],
            monitoringPlan: null
          };
        }
      } else {
        // No JSON found, treat as plain text
        analysis = {
          content: response,
          profile: null,
          suggestions: [],
          monitoringPlan: null
        };
      }
    }
    
    // Validate and ensure required fields
    if (!analysis.content) {
      analysis.content = "I'd be happy to help you set up monitoring. Could you tell me more about what you'd like to monitor?";
    }
    
    // Save conversation to database for learning
    try {
      await pool.query(
        `INSERT INTO monitoring_conversations (user_id, user_input, ai_response, profile_data, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [userId, userInput, JSON.stringify(analysis), JSON.stringify(analysis.profile)]
      );
    } catch (dbError) {
      console.error('Error saving conversation:', dbError);
      // Don't fail the request if DB save fails
    }
    
    res.json({ success: true, analysis });
    
  } catch (error) {
    console.error('Error in chat analysis:', error);
    
    // Provide fallback response
    const fallbackResponse = {
      content: "I'm here to help you set up intelligent monitoring. Could you tell me what company or topic you'd like to monitor? For example, you could say 'Amazon' or 'my SaaS startup'.",
      profile: null,
      suggestions: [
        {
          type: "keywords",
          title: "Common Keywords to Monitor",
          items: ["brand name", "competitor names", "industry terms"]
        }
      ],
      monitoringPlan: null
    };
    
    res.json({ success: true, analysis: fallbackResponse });
  }
};

module.exports = exports;