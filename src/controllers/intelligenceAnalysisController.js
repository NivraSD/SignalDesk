/**
 * Intelligence Analysis Controller
 * Provides AI-powered analysis of competitors and topics
 */

const pool = require('../config/db');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');
const axios = require('axios');

/**
 * Analyze competitor activities over the past 7 days
 */
exports.analyzeCompetitor = async (req, res) => {
  try {
    const { competitorName, organizationId, organizationName, targetId, topics } = req.body;
    
    console.log(`Analyzing competitor ${competitorName} for ${organizationName}`);
    
    // Fetch recent news and data about the competitor
    const parser = new Parser();
    const recentData = [];
    
    // Get custom sources for this target if targetId is provided
    let sources = [];
    if (targetId) {
      const sourcesResult = await pool.query(
        "SELECT * FROM target_sources WHERE target_id = $1 AND is_active = true AND source_type IN ('rss', 'news')",
        [targetId]
      );
      sources = sourcesResult.rows;
    }
    
    // If no custom sources, use defaults
    if (sources.length === 0) {
      sources = [
        { source_type: 'rss', source_url: 'https://techcrunch.com/feed/', source_name: 'TechCrunch' },
        { source_type: 'rss', source_url: 'https://www.theverge.com/rss/index.xml', source_name: 'The Verge' },
        { source_type: 'rss', source_url: 'https://feeds.feedburner.com/venturebeat/SZYF', source_name: 'VentureBeat' }
      ];
    }
    
    // Gather recent mentions from feeds
    for (const source of sources) {
      if (source.source_type === 'rss') {
        try {
          const feed = await parser.parseURL(source.source_url);
          const relevantItems = feed.items
            .filter(item => {
              const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
              return content.includes(competitorName.toLowerCase());
            })
            .slice(0, 5) // Get top 5 mentions per feed
            .map(item => ({
              title: item.title,
              content: item.contentSnippet,
              date: item.pubDate,
              source: source.source_name || feed.title
            }));
          
          recentData.push(...relevantItems);
        } catch (err) {
          console.error(`Failed to fetch ${source.source_url}:`, err.message);
        }
      }
    }
    
    // Topics to analyze (if provided)
    const topicList = topics || ['AI/ML', 'Cloud', 'Security', 'Product', 'Market'];
    
    // Use Claude for comprehensive competitor health analysis
    const analysisPrompt = `Analyze ${competitorName}'s company health and strategic position.

${recentData.length > 0 ? `Recent ${competitorName} news:
${recentData.map(item => `- ${item.title} (${item.source}, ${new Date(item.date).toLocaleDateString()})`).join('\n')}` : `No recent news found about ${competitorName} in the past week.`}

Provide a strategic health assessment:

**HEALTH_SCORE**: [0-100] - Overall company health based on signals

**FINANCIAL_SIGNALS**: Any funding, revenue, layoffs, or hiring news?

**LEADERSHIP_CHANGES**: Executive moves, board changes, key departures?

**PRODUCT_MOMENTUM**: New launches, updates, deprecations, or pivots?

**PARTNERSHIPS**: New deals, integrations, or lost partnerships?

**MARKET_SENTIMENT**: [Positive/Neutral/Negative] - How is coverage trending?

**TOPIC_POSITIONING**: For each of these topics, assess their strength [Strong/Moderate/Weak/None]:
${topicList.map(topic => `- ${topic}: [strength] - Brief observation`).join('\n')}

**KEY_VULNERABILITIES**: What gaps or weaknesses are apparent?

**STRATEGIC_THREATS**: What moves pose risks to competitors?

**OPPORTUNITIES**: Where are they not competing effectively?

Focus on actionable intelligence about their strategic position and health.`;

    const analysis = await claudeService.sendMessage(analysisPrompt);
    
    res.json({
      success: true,
      competitor: competitorName,
      analysis: analysis,
      dataPoints: recentData.length,
      topics: topicList,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing competitor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze competitor'
    });
  }
};

/**
 * Analyze topic trends over the past 7 days
 */
exports.analyzeTopic = async (req, res) => {
  try {
    const { topicName, organizationId, organizationName, targetId } = req.body;
    
    console.log(`Analyzing topic ${topicName} for ${organizationName}`);
    
    // Fetch recent news and data about the topic
    const parser = new Parser();
    const recentData = [];
    
    // Get custom sources for this target if targetId is provided
    let sources = [];
    if (targetId) {
      const sourcesResult = await pool.query(
        "SELECT * FROM target_sources WHERE target_id = $1 AND is_active = true AND source_type IN ('rss', 'news')",
        [targetId]
      );
      sources = sourcesResult.rows;
    }
    
    // If no custom sources, use defaults
    if (sources.length === 0) {
      sources = [
        { source_type: 'rss', source_url: 'https://techcrunch.com/feed/', source_name: 'TechCrunch' },
        { source_type: 'rss', source_url: 'https://www.theverge.com/rss/index.xml', source_name: 'The Verge' },
        { source_type: 'rss', source_url: 'https://feeds.feedburner.com/venturebeat/SZYF', source_name: 'VentureBeat' }
      ];
    }
    
    // Gather recent mentions from feeds
    for (const source of sources) {
      if (source.source_type === 'rss') {
        try {
          const feed = await parser.parseURL(source.source_url);
          const relevantItems = feed.items
            .filter(item => {
              const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
              // Check if content relates to the topic
              const topicKeywords = topicName.toLowerCase().split(' ');
              return topicKeywords.some(keyword => content.includes(keyword));
            })
            .slice(0, 3) // Get top 3 mentions per feed
            .map(item => ({
              title: item.title,
              content: item.contentSnippet,
              date: item.pubDate,
              source: source.source_name || feed.title
            }));
          
          recentData.push(...relevantItems);
        } catch (err) {
          console.error(`Failed to fetch ${source.source_url}:`, err.message);
        }
      }
    }
    
    // Use Claude for simple topic monitoring
    const analysisPrompt = `Monitor the current state of the topic "${topicName}".

${recentData.length > 0 ? `Recent ${topicName} coverage:
${recentData.map(item => `- ${item.title} (${item.source}, ${new Date(item.date).toLocaleDateString()})`).join('\n')}` : `No specific recent news found about ${topicName} in the past week.`}

Provide a brief topic monitoring summary:

**STATUS**: [🔥 Hot/📈 Rising/📊 Steady/📉 Declining] - Current media activity

**MAIN THEMES**: What are the 2-3 key themes in ${topicName} coverage right now?

**KEY PLAYERS**: Which companies/people are most visible in this topic?

**RECENT DEVELOPMENTS**: Any major news or shifts in the last week?

**SENTIMENT**: Is coverage generally positive, negative, or mixed?

Keep it factual and brief - just describe what's happening in the topic area.`;

    const analysis = await claudeService.sendMessage(analysisPrompt);
    
    res.json({
      success: true,
      topic: topicName,
      analysis: analysis,
      dataPoints: recentData.length,
      trending: recentData.length > 2,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing topic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze topic'
    });
  }
};

/**
 * Get comprehensive overview analysis
 */
exports.getOverviewAnalysis = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Get organization's targets from database
    const targetsQuery = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND active = true',
      [organizationId]
    );
    
    const targets = targetsQuery.rows;
    const analyses = {
      competitors: [],
      topics: []
    };
    
    // Analyze each competitor (limit to 5)
    const competitors = targets.filter(t => t.type === 'competitor').slice(0, 5);
    for (const competitor of competitors) {
      try {
        // Quick monitoring snapshot
        const quickAnalysis = await claudeService.sendMessage(
          `For ${competitor.name}, provide a one-line status:
          Format: "[Activity: High/Medium/Low] Currently focusing on [main topic/area]"
          Example: "Activity: High - Currently focusing on AI product launches"`
        );
        
        analyses.competitors.push({
          name: competitor.name,
          analysis: quickAnalysis,
          priority: competitor.priority,
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Failed to analyze ${competitor.name}:`, err);
      }
    }
    
    // Analyze each topic (limit to 5)
    const topics = targets.filter(t => t.type === 'topic').slice(0, 5);
    for (const topic of topics) {
      try {
        // Quick monitoring snapshot
        const quickAnalysis = await claudeService.sendMessage(
          `For topic "${topic.name}", provide a one-line status:
          Format: "[🔥Hot/📈Rising/📊Steady/📉Declining] Main theme: [current focus]"
          Example: "📈 Rising - Main theme: regulatory concerns growing"`
        );
        
        analyses.topics.push({
          name: topic.name,
          analysis: quickAnalysis,
          priority: topic.priority,
          trending: true,
          lastUpdated: new Date().toISOString()
        });
      } catch (err) {
        console.error(`Failed to analyze ${topic.name}:`, err);
      }
    }
    
    res.json({
      success: true,
      organizationId,
      analyses,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating overview analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate overview analysis'
    });
  }
};

/**
 * Get unified competitor health and topic positioning analysis
 */
exports.getUnifiedIntelligence = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Get organization's targets from database
    const targetsQuery = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND active = true',
      [organizationId]
    );
    
    const targets = targetsQuery.rows;
    
    // Extract competitors and topics
    const competitors = targets.filter(t => t.type === 'competitor').slice(0, 5);
    const topics = targets.filter(t => t.type === 'topic').slice(0, 5);
    const topicNames = topics.map(t => t.name);
    
    // Parse recent news for all competitors
    const parser = new Parser();
    const competitorIntelligence = [];
    
    for (const competitor of competitors) {
      const recentData = [];
      
      // Get sources for this competitor
      let sources = [];
      const sourcesResult = await pool.query(
        "SELECT * FROM target_sources WHERE target_id = $1 AND is_active = true AND source_type IN ('rss', 'news')",
        [competitor.id]
      );
      sources = sourcesResult.rows;
      
      if (sources.length === 0) {
        sources = [
          { source_type: 'rss', source_url: 'https://techcrunch.com/feed/', source_name: 'TechCrunch' },
          { source_type: 'rss', source_url: 'https://www.theverge.com/rss/index.xml', source_name: 'The Verge' }
        ];
      }
      
      // Gather recent mentions
      for (const source of sources) {
        if (source.source_type === 'rss') {
          try {
            const feed = await parser.parseURL(source.source_url);
            const relevantItems = feed.items
              .filter(item => {
                const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
                return content.includes(competitor.name.toLowerCase());
              })
              .slice(0, 3)
              .map(item => ({
                title: item.title,
                content: item.contentSnippet,
                date: item.pubDate,
                source: source.source_name || feed.title
              }));
            
            recentData.push(...relevantItems);
          } catch (err) {
            console.error(`Failed to fetch ${source.source_url}:`, err.message);
          }
        }
      }
      
      // Analyze competitor with unified prompt
      const analysisPrompt = `Analyze ${competitor.name}'s strategic health and positioning.

${recentData.length > 0 ? `Recent news (${recentData.length} items):
${recentData.map(item => `- ${item.title}`).join('\n')}` : 'No recent news found.'}

Provide this exact structure:

HEALTH_SCORE: [0-100]
TREND: [↑/→/↓]

HEALTH_SIGNALS:
• Financial: [One line insight or "No recent signals"]
• Leadership: [One line insight or "Stable"]
• Product: [One line insight or "No major changes"]
• Partnerships: [One line insight or "No new deals"]

TOPIC_STRENGTH:
${topicNames.map(topic => `• ${topic}: [Strong/Moderate/Weak/None] - [Brief reason]`).join('\n')}

KEY_INSIGHTS:
• Strength: [Their main advantage]
• Vulnerability: [Their main weakness]
• Opportunity: [Gap we could exploit]`;

      const analysis = await claudeService.sendMessage(analysisPrompt);
      
      // Parse the structured response
      const parsed = parseHealthAnalysis(analysis);
      
      competitorIntelligence.push({
        id: competitor.id,
        name: competitor.name,
        healthScore: parsed.healthScore || 50,
        trend: parsed.trend || '→',
        healthSignals: parsed.healthSignals || {},
        topicStrength: parsed.topicStrength || {},
        keyInsights: parsed.keyInsights || {},
        dataPoints: recentData.length,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Create topic-competitor matrix
    const matrix = {
      topics: topicNames,
      competitors: competitorIntelligence.map(c => ({
        name: c.name,
        healthScore: c.healthScore,
        trend: c.trend,
        positions: topicNames.map(topic => ({
          topic: topic,
          strength: c.topicStrength[topic]?.level || 'None',
          notes: c.topicStrength[topic]?.notes || ''
        }))
      }))
    };
    
    res.json({
      success: true,
      organizationId,
      intelligence: competitorIntelligence,
      matrix: matrix,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating unified intelligence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate unified intelligence'
    });
  }
};

// Helper function to parse structured health analysis
function parseHealthAnalysis(analysis) {
  const result = {
    healthScore: 50,
    trend: '→',
    healthSignals: {},
    topicStrength: {},
    keyInsights: {}
  };
  
  try {
    const lines = analysis.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Parse health score
      if (trimmed.startsWith('HEALTH_SCORE:')) {
        const score = parseInt(trimmed.split(':')[1].trim());
        if (!isNaN(score)) result.healthScore = score;
      }
      
      // Parse trend
      if (trimmed.startsWith('TREND:')) {
        const trend = trimmed.split(':')[1].trim();
        if (['↑', '→', '↓'].includes(trend)) result.trend = trend;
      }
      
      // Track sections
      if (trimmed === 'HEALTH_SIGNALS:') {
        currentSection = 'health';
      } else if (trimmed === 'TOPIC_STRENGTH:') {
        currentSection = 'topics';
      } else if (trimmed === 'KEY_INSIGHTS:') {
        currentSection = 'insights';
      }
      
      // Parse section content
      if (trimmed.startsWith('•')) {
        const content = trimmed.substring(1).trim();
        const colonIndex = content.indexOf(':');
        
        if (colonIndex > -1) {
          const key = content.substring(0, colonIndex).trim();
          const value = content.substring(colonIndex + 1).trim();
          
          if (currentSection === 'health') {
            result.healthSignals[key] = value;
          } else if (currentSection === 'topics') {
            // Parse topic strength: "Topic: [Level] - [Notes]"
            const strengthMatch = value.match(/\[([^\]]+)\]\s*-?\s*(.*)/);
            if (strengthMatch) {
              result.topicStrength[key] = {
                level: strengthMatch[1],
                notes: strengthMatch[2] || ''
              };
            } else {
              result.topicStrength[key] = { level: value, notes: '' };
            }
          } else if (currentSection === 'insights') {
            result.keyInsights[key] = value;
          }
        }
      }
    });
  } catch (err) {
    console.error('Error parsing health analysis:', err);
  }
  
  return result;
}

// Exports are already handled above