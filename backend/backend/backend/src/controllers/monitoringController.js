const pool = require('../../config/database');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');
const Anthropic = require('@anthropic-ai/sdk');
const sentimentService = require('../../config/sentiment-service');
const sentimentEngine = require('../services/sentimentEngine');

// Simple test endpoint
exports.testSimple = async (req, res) => {
  try {
    console.log('Simple test endpoint called');
    res.json({ 
      success: true, 
      message: 'Backend is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({ error: 'Simple test failed' });
  }
};

// Test sentiment service
exports.testSentimentService = async (req, res) => {
  try {
    console.log('=== TEST SENTIMENT SERVICE ===');
    const { text = "Test text", context = null } = req.body;
    
    const result = await sentimentService.analyzeSentiment(text, context);
    
    res.json({ 
      success: true, 
      result,
      text,
      context
    });
  } catch (error) {
    console.error('Sentiment service test error:', error);
    res.status(500).json({ 
      error: 'Sentiment service failed', 
      message: error.message 
    });
  }
};

// Test direct analysis bypassing all complexity
exports.testDirectAnalysis = async (req, res) => {
  try {
    console.log('=== TEST DIRECT ANALYSIS ===');
    const { text = "Test text" } = req.body;
    
    // Use fallback analysis directly
    const analysis = fallbackAnalysis(text, null);
    
    res.json({ 
      success: true, 
      analysis,
      message: 'Using fallback analysis for testing'
    });
  } catch (error) {
    console.error('Direct analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Simplified analysis test
exports.testAnalysisSimple = async (req, res) => {
  try {
    console.log('=== TEST ANALYSIS SIMPLE ===');
    const { text = "Test text" } = req.body;
    console.log('Text:', text);
    
    // Very simple prompt
    const simplePrompt = `Analyze sentiment: "${text}"\n\nReturn JSON: {"sentiment": "positive" or "negative" or "neutral", "score": -100 to 100}`;
    
    console.log('Simple prompt:', simplePrompt);
    
    try {
      const response = await claudeService.sendMessage(simplePrompt);
      console.log('Claude response:', response);
      
      // Try to parse JSON
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          parsed = { sentiment: "neutral", score: 0, error: "Could not parse response" };
        }
      }
      
      res.json({ 
        success: true, 
        prompt: simplePrompt,
        response: response,
        parsed: parsed
      });
    } catch (claudeError) {
      console.error('Claude error in simple test:', claudeError);
      res.status(500).json({ 
        error: 'Claude error', 
        message: claudeError.message,
        type: claudeError.constructor.name
      });
    }
  } catch (error) {
    console.error('Test analysis simple error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Test Claude connection
exports.testClaude = async (req, res) => {
  try {
    console.log('Testing Claude connection...');
    console.log('Claude API Key exists:', !!process.env.CLAUDE_API_KEY);
    console.log('Anthropic API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    
    const testPrompt = 'Return this exact JSON: {"test": "success", "value": 123}';
    const response = await claudeService.sendMessage(testPrompt);
    
    console.log('Claude test response:', response);
    
    res.json({ 
      success: true, 
      response,
      keyExists: !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY
    });
  } catch (error) {
    console.error('Claude test error:', error);
    res.status(500).json({ 
      error: 'Claude test failed', 
      details: error.message,
      keyExists: !!process.env.CLAUDE_API_KEY || !!process.env.ANTHROPIC_API_KEY
    });
  }
};

// Direct sentiment test
exports.testSentiment = async (req, res) => {
  try {
    const testText = "Our customer support team received praise for quickly resolving a data security concern.";
    
    const prompt = `Analyze this text for sentiment:
    
Context: 
- Negative indicators: "data security concerns", "security vulnerabilities"
- Positive indicators: "praise", "quickly resolving", "customer support"

Text: "${testText}"

This text contains both positive elements (praise, quickly resolving) and negative elements (data security concern).
Given that data security is a critical issue, this should be considered NEGATIVE overall.

Return JSON with these fields:
{
  "sentiment": "negative",
  "sentiment_score": -60,
  "rationale": "explanation here"
}`;

    console.log('Test sentiment prompt:', prompt);
    const response = await claudeService.sendMessage(prompt);
    console.log('Test sentiment response:', response);
    
    res.json({ 
      success: true, 
      prompt,
      response,
      parsed: JSON.parse(response)
    });
  } catch (error) {
    console.error('Sentiment test error:', error);
    res.status(500).json({ 
      error: 'Sentiment test failed', 
      details: error.message
    });
  }
};

// Test sentiment with actual context
exports.testSentimentWithContext = async (req, res) => {
  try {
    const { text = "Our customer support team received praise for quickly resolving a data security concern." } = req.body;
    
    // Get the user's saved config
    const userId = req.user?.id || req.user?.userId;
    const configResult = await pool.query(
      'SELECT config_data FROM monitoring_configs WHERE user_id = $1',
      [userId]
    );
    
    let sentimentContext = null;
    if (configResult.rows.length > 0 && configResult.rows[0].config_data?.claude?.sentimentContext) {
      sentimentContext = configResult.rows[0].config_data.claude.sentimentContext;
    }
    
    console.log('Testing with saved sentiment context:', sentimentContext);
    
    const prompt = `Analyze this text for sentiment:

${sentimentContext ? `
POSITIVE INDICATORS for this brand:
${sentimentContext.positiveScenarios || 'None specified'}

NEGATIVE INDICATORS for this brand:
${sentimentContext.negativeScenarios || 'None specified'}

CRITICAL INDICATORS for this brand:
${sentimentContext.criticalConcerns || 'None specified'}
` : 'No context configured'}

Text: "${text}"

Based on the indicators above, determine the sentiment.

Return JSON:
{
  "sentiment": "positive" or "negative" or "neutral" or "mixed",
  "sentiment_score": -100 to 100,
  "rationale": "explain based on the indicators"
}`;

    console.log('Full test prompt:', prompt);
    const response = await claudeService.sendMessage(prompt);
    console.log('Test response:', response);
    
    res.json({ 
      success: true,
      sentimentContext,
      prompt,
      response,
      parsed: JSON.parse(response)
    });
  } catch (error) {
    console.error('Context sentiment test error:', error);
    res.status(500).json({ 
      error: 'Context sentiment test failed', 
      details: error.message,
      stack: error.stack
    });
  }
};

// Save monitoring configuration
exports.saveConfig = async (req, res) => {
  try {
    const { dataSource, claude, alerts } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    console.log('=== BACKEND: SAVE CONFIG REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Claude config received:', claude);
    console.log('Saving monitoring config:', {
      hasClaudeConfig: !!claude,
      hasSentimentContext: !!claude?.sentimentContext,
      sentimentContextKeys: claude?.sentimentContext ? Object.keys(claude.sentimentContext) : [],
      positiveLength: claude?.sentimentContext?.positiveScenarios?.length || 0,
      negativeLength: claude?.sentimentContext?.negativeScenarios?.length || 0
    });
    
    await pool.query(
      `INSERT INTO monitoring_configs (user_id, config_type, config_data, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET config_data = $3, updated_at = NOW()`,
      [userId, 'monitoring', JSON.stringify({ dataSource, claude, alerts })]
    );
    
    res.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
};

// Get monitoring configuration
exports.getConfig = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    const result = await pool.query(
      'SELECT config_data FROM monitoring_configs WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length > 0) {
      res.json(result.rows[0].config_data);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
};

// Analyze sentiment for a single mention
exports.analyzeSentiment = async (req, res) => {
  console.log('=== BACKEND: analyzeSentiment CALLED ===');
  console.log('Request headers:', req.headers);
  console.log('User object:', req.user);
  console.log('User ID from req.user.id:', req.user?.id);
  console.log('User ID from req.user.userId:', req.user?.userId);
  
  try {
    const { text, source, brandContext, sentimentContext, customInstructions } = req.body;
    // Try both possible user ID locations
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) {
      console.error('No user ID found in request');
      console.error('Full user object:', req.user);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!text) {
      console.error('No text provided for analysis');
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log('=== BACKEND: ANALYZE SENTIMENT REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Sentiment context received:', sentimentContext);
    console.log('Received sentiment analysis request with context:', {
      hasSentimentContext: !!sentimentContext,
      hasPositive: !!sentimentContext?.positiveScenarios,
      hasNegative: !!sentimentContext?.negativeScenarios,
      hasCritical: !!sentimentContext?.criticalConcerns,
      hasBrandContext: !!brandContext?.customContext
    });
    
    // Log the actual content
    if (sentimentContext) {
      console.log('Positive scenarios:', sentimentContext.positiveScenarios?.substring(0, 100));
      console.log('Negative scenarios:', sentimentContext.negativeScenarios?.substring(0, 100));
      console.log('Critical concerns:', sentimentContext.criticalConcerns?.substring(0, 100));
    }
    
    console.log('Text to analyze:', text);
    
    // Use the new sentiment engine instead of Claude
    console.log('Using rule-based sentiment engine for analysis...');
    let analysis = sentimentEngine.analyze(text, sentimentContext);
    
    console.log('Sentiment engine result:', {
      sentiment: analysis.sentiment,
      score: analysis.sentiment_score,
      confidence: analysis.confidence,
      matched: {
        positive: analysis.matched_indicators.positive.length,
        negative: analysis.matched_indicators.negative.length,
        critical: analysis.matched_indicators.critical.length
      }
    });
    
    // Log the analysis result
    console.log('Analysis result:', analysis);
    
    // Don't throw error if analysis exists, just validate it has basic fields
    if (!analysis) {
      console.error('No analysis result returned');
      analysis = fallbackAnalysis(text, sentimentContext);
    }
    
    // Ensure analysis has required fields
    if (!analysis.sentiment) {
      console.warn('Analysis missing sentiment field, using fallback');
      analysis = fallbackAnalysis(text, sentimentContext);
    }
    
    // Make database save optional - don't let it block the analysis
    if (false) { // Temporarily disable database save
      try {
        await pool.query(
          `INSERT INTO monitoring_analyses (user_id, text, source, analysis, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [userId, text, source, JSON.stringify(analysis)]
        );
        console.log('Analysis saved to database successfully');
      } catch (dbError) {
        console.error('Database error:', dbError);
        console.error('Analysis that failed to save:', analysis);
      }
    }
    
    console.log('Returning analysis response');
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('=== ERROR IN ANALYZE SENTIMENT ===');
    console.error('Error analyzing sentiment:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to analyze sentiment',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Analyze batch of mentions
exports.analyzeBatch = async (req, res) => {
  try {
    const { mentions, sentimentContext, brandContext, customInstructions } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    const results = [];
    
    // Build context section once for all mentions
    let contextSection = '';
    
    if (sentimentContext) {
      contextSection = `
    
    CONTEXT FOR SENTIMENT ANALYSIS:
    
    ${sentimentContext.positiveScenarios ? `POSITIVE INDICATORS:
    ${sentimentContext.positiveScenarios}
    ` : ''}
    
    ${sentimentContext.negativeScenarios ? `NEGATIVE INDICATORS:
    ${sentimentContext.negativeScenarios}
    ` : ''}
    
    ${sentimentContext.criticalConcerns ? `CRITICAL INDICATORS:
    ${sentimentContext.criticalConcerns}
    ` : ''}
    
    ${brandContext?.customContext ? `BRAND CONTEXT:
    ${brandContext.customContext}
    ` : ''}`;
    }
    
    for (const mention of mentions) {
      try {
        // Use sentiment engine for batch analysis
        const analysis = sentimentEngine.analyze(mention.content, sentimentContext);
        
        results.push({
          ...mention,
          analysis
        });
      } catch (error) {
        console.error('Batch analysis error for mention:', error);
        results.push({
          ...mention,
          analysis: fallbackAnalysis(mention.content, sentimentContext)
        });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({ error: 'Failed to analyze batch' });
  }
};

// Fetch RSS feeds
exports.fetchRSSFeeds = async (req, res) => {
  console.log('=== RSS Endpoint Hit ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  try {
    const { keywords } = req.body;
    const parser = new Parser();
    
        const feeds = [
      // Technology News
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'Technology News' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'Technology News' },
      { name: 'Wired', url: 'https://www.wired.com/feed/rss', type: 'Technology News' },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'Technology News' },
      { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', type: 'Technology News' },
      
      // Business & Finance
      { name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', type: 'Business News' },
      { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', type: 'Business News' },
      { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', type: 'Financial News' },
      { name: 'Financial Times', url: 'https://www.ft.com/rss/home', type: 'Financial News' },
      { name: 'WSJ Business', url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', type: 'Business News' },
      
      // Press Releases & PR
      { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/news-releases-list.rss', type: 'Press Releases' },
      { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtQWA==', type: 'Press Releases' },
      { name: 'PR Web', url: 'https://www.prweb.com/rss2/daily.xml', type: 'Press Releases' },
      { name: 'GlobeNewswire', url: 'https://www.globenewswire.com/RssFeed/subjectcode/15-Technology/feedTitle/GlobeNewswire%20-%20Technology', type: 'Press Releases' },
      
      // Marketing & Advertising
      { name: 'Marketing Week', url: 'https://www.marketingweek.com/feed/', type: 'Marketing News' },
      { name: 'AdWeek', url: 'https://www.adweek.com/feed/', type: 'Advertising News' },
      { name: 'Marketing Land', url: 'https://feeds.feedburner.com/mktingland', type: 'Marketing News' },
      
      // General News
      { name: 'CNN Business', url: 'http://rss.cnn.com/rss/money_latest.rss', type: 'General News' },
      { name: 'The Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', type: 'General News' },
      { name: 'NYT Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', type: 'General News' },
      
      // Industry Specific
      { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/rss.xml', type: 'Healthcare' },
      { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', type: 'Retail' },
      { name: 'EdTech Magazine', url: 'https://fedtechmagazine.com/rss.xml', type: 'Education' },
      
      // Social Media & Forums
      { name: 'Reddit Technology', url: 'https://www.reddit.com/r/technology/.rss', type: 'Forum' },
      { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'Forum' },
      { name: 'Product Hunt', url: 'https://www.producthunt.com/feed', type: 'Product Launches' }
    ];
    
    const allMentions = [];
    
    for (const feed of feeds) {
      try {
        console.log(`Fetching ${feed.name}...`);
        // Add timeout to prevent hanging on slow feeds
        const parsedFeed = await Promise.race([
          parser.parseURL(feed.url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Feed timeout')), 10000)
          )
        ]);
        
        parsedFeed.items.forEach(item => {
          // Check if item content matches keywords
          const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
          const keywordArray = Array.isArray(keywords) ? keywords : (keywords ? keywords.split(' ') : []);
          
          if (!keywords || keywordArray.some(keyword => content.includes(keyword.toLowerCase()))) {
            allMentions.push({
              id: `rss-${feed.name}-${Date.now()}-${Math.random()}`,
              content: item.contentSnippet || item.content || item.title,
              title: item.title,
              source: feed.name,
              sourceType: feed.type,
              sentiment: 'unanalyzed',
              author: item.creator || 'Unknown',
              publishDate: new Date(item.pubDate || Date.now()),
              url: item.link,
              reach: Math.floor(Math.random() * 10000) + 1000
            });
          }
        });
        
        console.log(`Successfully fetched ${feed.name}: ${parsedFeed.items.length} items`);
      } catch (err) {
        console.error(`Failed to fetch ${feed.name}:`, err.message);
        // Add a timeout wrapper for slow feeds
        if (err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
          console.log(`Skipping ${feed.name} due to network issues`);
        }
        // Continue to next feed
      }
    }
    
    console.log(`Total mentions found: ${allMentions.length}`);
    res.json({ success: true, mentions: allMentions.slice(0, 50) }); // Limit to 50 mentions
  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
};

// Save mentions
exports.saveMentions = async (req, res) => {
  try {
    const { mentions } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    for (const mention of mentions) {
      await pool.query(
        `INSERT INTO monitoring_mentions 
         (user_id, mention_id, content, source, source_type, author, publish_date, url, reach, sentiment, analysis)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (user_id, mention_id) 
         DO UPDATE SET 
           sentiment = $10,
           analysis = $11,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          mention.id,
          mention.content,
          mention.source,
          mention.sourceType,
          mention.author,
          mention.publishDate,
          mention.url,
          mention.reach,
          mention.sentiment,
          JSON.stringify(mention.analysis)
        ]
      );
    }
    
    res.json({ success: true, message: 'Mentions saved' });
  } catch (error) {
    console.error('Error saving mentions:', error);
    res.status(500).json({ error: 'Failed to save mentions' });
  }
};

// Get saved mentions
exports.getMentions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { limit = 100 } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM monitoring_mentions 
       WHERE user_id = $1 
       ORDER BY publish_date DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    res.json({ success: true, mentions: result.rows });
  } catch (error) {
    console.error('Error getting mentions:', error);
    res.status(500).json({ error: 'Failed to get mentions' });
  }
};

// Export data
exports.exportData = async (req, res) => {
  try {
    const { format, mentions } = req.body;
    
    if (format === 'csv') {
      const csv = convertToCSV(mentions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=mentions.csv');
      res.send(csv);
    } else {
      res.json({ mentions });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

// Helper function for fallback analysis with context support
function fallbackAnalysis(text, sentimentContext = null) {
  const lowerText = text.toLowerCase();
  
  // Default keywords
  let positiveKeywords = ['excellent', 'amazing', 'love', 'great', 'fantastic', 'success', 'innovation', 'growth'];
  let negativeKeywords = ['terrible', 'awful', 'hate', 'disappointed', 'issue', 'problem', 'concern', 'fail'];
  let criticalKeywords = ['breach', 'lawsuit', 'fraud', 'outage', 'crisis', 'scandal', 'investigation'];
  
  // Extract keywords from sentiment context if provided
  if (sentimentContext) {
    if (sentimentContext.positiveScenarios) {
      const contextPositive = sentimentContext.positiveScenarios.toLowerCase()
        .split(/[,.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      positiveKeywords = [...positiveKeywords, ...contextPositive];
    }
    if (sentimentContext.negativeScenarios) {
      const contextNegative = sentimentContext.negativeScenarios.toLowerCase()
        .split(/[,.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      negativeKeywords = [...negativeKeywords, ...contextNegative];
    }
    if (sentimentContext.criticalConcerns) {
      const contextCritical = sentimentContext.criticalConcerns.toLowerCase()
        .split(/[,.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      criticalKeywords = [...criticalKeywords, ...contextCritical];
    }
  }
  
  let positiveCount = 0;
  let negativeCount = 0;
  let criticalCount = 0;
  let matchedKeywords = [];
  
  positiveKeywords.forEach(keyword => {
    if (keyword && lowerText.includes(keyword)) {
      positiveCount++;
      matchedKeywords.push(`+${keyword}`);
    }
  });
  
  negativeKeywords.forEach(keyword => {
    if (keyword && lowerText.includes(keyword)) {
      negativeCount++;
      matchedKeywords.push(`-${keyword}`);
    }
  });
  
  criticalKeywords.forEach(keyword => {
    if (keyword && lowerText.includes(keyword)) {
      criticalCount++;
      matchedKeywords.push(`!${keyword}`);
    }
  });
  
  let sentiment = 'neutral';
  let sentimentScore = 0;
  let rationale = '';
  
  if (criticalCount > 0) {
    sentiment = 'negative';
    sentimentScore = -80;
    rationale = `Critical concerns detected: ${matchedKeywords.filter(k => k.startsWith('!')).join(', ')}`;
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
    sentimentScore = Math.min(positiveCount * 20, 80);
    rationale = `Positive indicators found: ${matchedKeywords.filter(k => k.startsWith('+')).join(', ')}`;
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    sentimentScore = Math.max(negativeCount * -20, -80);
    rationale = `Negative indicators found: ${matchedKeywords.filter(k => k.startsWith('-')).join(', ')}`;
  } else {
    rationale = matchedKeywords.length > 0 
      ? `Mixed indicators: ${matchedKeywords.join(', ')}` 
      : 'No clear sentiment indicators found in text';
  }
  
  return {
    sentiment,
    sentiment_score: sentimentScore,
    confidence: 0.6,
    summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} sentiment detected.`,
    rationale: rationale,
    key_topics: matchedKeywords.map(k => k.substring(1)),
    urgency_level: criticalCount > 0 ? 'high' : (negativeCount > 2 ? 'medium' : 'low'),
    actionable_insights: null,
    recommended_action: null,
    is_fallback: true
  };
}

// Helper function to convert to CSV
function convertToCSV(mentions) {
  const headers = ['Date', 'Source', 'Author', 'Content', 'Sentiment', 'Score', 'Reach'];
  const rows = mentions.map(m => [
    new Date(m.publishDate).toLocaleString(),
    m.source,
    m.author,
    `"${m.content.replace(/"/g, '""')}"`,
    m.sentiment || 'N/A',
    m.analysis?.sentiment_score || 'N/A',
    m.reach
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Make sure all functions are properly exported
module.exports = exports;
