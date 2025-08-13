const pool = require('../config/db');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');

/**
 * Get comprehensive topic momentum analysis using Research Agents
 */
exports.getTopicMomentum = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Get organization's topics from database
    const topicsQuery = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND type = $2 AND active = true',
      [organizationId, 'topic']
    );
    
    const topics = topicsQuery.rows;
    
    // Get all competitors for competitive analysis
    const competitorsQuery = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND type = $2 AND active = true',
      [organizationId, 'competitor']
    );
    
    const competitors = competitorsQuery.rows;
    const parser = new Parser();
    
    const topicMomentumData = [];
    
    for (const topic of topics) {
      // 1. Use Data Analyst Agent for quantitative analysis
      const dataAnalystPrompt = `
As a Data Analyst Agent, analyze the topic "${topic.name}" with quantitative focus:

Analyze these metrics:
1. Market activity level (0-100)
2. Growth rate (percentage)
3. Media mentions trend (increasing/stable/decreasing)
4. Investment activity level
5. Regulatory attention level

Provide specific numbers and percentages where possible.
Format: JSON with keys: activityLevel, growthRate, mediaTrend, investmentLevel, regulatoryLevel`;

      const quantitativeAnalysis = await claudeService.sendMessage(dataAnalystPrompt);
      
      // 2. Gather recent news data for the topic
      const recentNews = [];
      const defaultSources = [
        { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
        { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
        { url: 'https://feeds.feedburner.com/venturebeat/SZYF', name: 'VentureBeat' }
      ];
      
      for (const source of defaultSources) {
        try {
          const feed = await parser.parseURL(source.url);
          const topicItems = feed.items
            .filter(item => {
              const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
              return topic.keywords?.some(keyword => content.includes(keyword.toLowerCase())) ||
                     content.includes(topic.name.toLowerCase());
            })
            .slice(0, 5)
            .map(item => ({
              title: item.title,
              date: item.pubDate,
              source: source.name
            }));
          
          recentNews.push(...topicItems);
        } catch (err) {
          console.error(`Error parsing ${source.url}:`, err.message);
        }
      }
      
      // 3. Analyze competitor positioning on this topic
      const competitorPositioning = [];
      
      for (const competitor of competitors) {
        // Quick analysis of competitor's stance on this topic
        const positioningPrompt = `
Briefly assess ${competitor.name}'s position on "${topic.name}":
- Activity level: Strong/Moderate/Weak/None
- Recent initiatives (if any)
- Investment/focus level

Respond in 2-3 sentences max.`;
        
        const positioning = await claudeService.sendMessage(positioningPrompt);
        
        competitorPositioning.push({
          name: competitor.name,
          analysis: positioning,
          strength: extractStrength(positioning)
        });
      }
      
      // Calculate NVS based on competitor weakness
      const weakCompetitors = competitorPositioning.filter(c => c.strength === 'weak' || c.strength === 'none').length;
      const strongCompetitors = competitorPositioning.filter(c => c.strength === 'strong').length;
      const competitorWeaknessRatio = competitors.length > 0 ? weakCompetitors / competitors.length : 0;
      
      // Base NVS score on competitor weakness (higher score = more opportunity)
      const baseNVS = Math.round(competitorWeaknessRatio * 100);
      const adjustedNVS = Math.max(0, Math.min(100, baseNVS - (strongCompetitors * 10)));

      // 4. Use Research Orchestrator concept for comprehensive analysis
      const orchestratorPrompt = `
As a Research Orchestrator, synthesize the following data about "${topic.name}":

Recent News (${recentNews.length} items):
${recentNews.slice(0, 5).map(n => `- ${n.title}`).join('\n')}

Competitor Activity:
${competitorPositioning.map(c => `- ${c.name}: ${c.strength}`).join('\n')}

Weak/No Presence: ${weakCompetitors} competitors
Strong Presence: ${strongCompetitors} competitors
Narrative Vacuum Score: ${adjustedNVS}/100

Based on the high opportunity (weak competitor presence), provide:
1. MOMENTUM: Hot/Growing/Stable/Emerging/Declining
2. MEDIA_TREND: Increasing/Stable/Decreasing (based on news volume)
3. KEY_DRIVERS: Top 3 factors driving this topic
4. BARRIERS: Main challenges or risks
5. TIME_WINDOW: Immediate/3months/6months/12months
6. THOUGHT_LEADERSHIP_IDEAS: 2-3 specific content/campaign ideas to establish leadership
7. RECOMMENDATION: Strategic action focused on capitalizing on competitor weakness`;

      const orchestratedAnalysis = await claudeService.sendMessage(orchestratorPrompt);
      
      console.log(`Topic ${topic.name} - NVS: ${adjustedNVS}, Weak: ${weakCompetitors}, Strong: ${strongCompetitors}`);
      console.log('Orchestrated analysis response:', orchestratedAnalysis.substring(0, 200) + '...');
      
      // Parse the analysis
      const parsedAnalysis = parseOrchestrationAnalysis(orchestratedAnalysis);
      const parsedMetrics = parseDataAnalystResponse(quantitativeAnalysis);
      
      console.log('Parsed analysis:', { 
        keyDrivers: parsedAnalysis.keyDrivers,
        thoughtLeadershipIdeas: parsedAnalysis.thoughtLeadershipIdeas,
        mediaTrend: parsedAnalysis.mediaTrend
      });
      
      topicMomentumData.push({
        id: topic.id,
        name: topic.name,
        keywords: topic.keywords || [],
        momentum: parsedAnalysis.momentum || 'stable',
        opportunityScore: adjustedNVS, // Use calculated NVS based on competitor weakness
        mediaTrend: parsedAnalysis.mediaTrend || parsedMetrics.mediaTrend || 'stable',
        keyDrivers: parsedAnalysis.keyDrivers || [],
        barriers: parsedAnalysis.barriers || [],
        timeWindow: parsedAnalysis.timeWindow || '6months',
        recommendation: parsedAnalysis.recommendation || 'Monitor closely',
        thoughtLeadershipIdeas: parsedAnalysis.thoughtLeadershipIdeas || [],
        competitorActivity: {
          strong: competitorPositioning.filter(c => c.strength === 'strong').length,
          moderate: competitorPositioning.filter(c => c.strength === 'moderate').length,
          weak: competitorPositioning.filter(c => c.strength === 'weak').length,
          none: competitorPositioning.filter(c => c.strength === 'none').length,
          details: competitorPositioning,
          weaknessRatio: competitorWeaknessRatio
        },
        recentNews: recentNews.slice(0, 5),
        lastUpdated: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      version: 'v2-nvs-based-on-weakness', // Version identifier
      organizationId,
      topics: topicMomentumData,
      competitorCount: competitors.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing topic momentum:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze topic momentum'
    });
  }
};

/**
 * Helper function to extract strength level from positioning text
 */
function extractStrength(text) {
  const lowercased = text.toLowerCase();
  if (lowercased.includes('strong') || lowercased.includes('leader') || lowercased.includes('dominant')) {
    return 'strong';
  } else if (lowercased.includes('moderate') || lowercased.includes('active') || lowercased.includes('some')) {
    return 'moderate';
  } else if (lowercased.includes('weak') || lowercased.includes('limited') || lowercased.includes('minimal')) {
    return 'weak';
  } else if (lowercased.includes('none') || lowercased.includes('no presence') || lowercased.includes('not active')) {
    return 'none';
  }
  return 'moderate'; // default
}

/**
 * Parse orchestrated analysis response
 */
function parseOrchestrationAnalysis(analysis) {
  const result = {
    momentum: 'stable',
    mediaTrend: 'stable',
    keyDrivers: [],
    barriers: [],
    timeWindow: '6months',
    recommendation: '',
    thoughtLeadershipIdeas: []
  };
  
  try {
    const lines = analysis.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('MOMENTUM:')) {
        result.momentum = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('MEDIA_TREND:')) {
        result.mediaTrend = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('TIME_WINDOW:')) {
        result.timeWindow = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('RECOMMENDATION:')) {
        result.recommendation = trimmed.split(':').slice(1).join(':').trim();
      } else if (trimmed.startsWith('KEY_DRIVERS:')) {
        currentSection = 'drivers';
      } else if (trimmed.startsWith('BARRIERS:')) {
        currentSection = 'barriers';
      } else if (trimmed.startsWith('THOUGHT_LEADERSHIP_IDEAS:')) {
        currentSection = 'ideas';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
        // List item
        const item = trimmed.replace(/^[-•\d+\.]\s*/, '').trim();
        if (currentSection === 'drivers') {
          result.keyDrivers.push(item);
        } else if (currentSection === 'barriers') {
          result.barriers.push(item);
        } else if (currentSection === 'ideas') {
          result.thoughtLeadershipIdeas.push(item);
        }
      }
    });
  } catch (err) {
    console.error('Error parsing orchestration analysis:', err);
  }
  
  return result;
}

/**
 * Parse data analyst response
 */
function parseDataAnalystResponse(response) {
  try {
    // Try to parse as JSON first
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback to text parsing
    return {
      activityLevel: 50,
      growthRate: '0%',
      mediaTrend: 'stable',
      investmentLevel: 'moderate',
      regulatoryLevel: 'low'
    };
  }
}

module.exports = exports;