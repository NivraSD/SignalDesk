const pool = require('../config/db');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');

/**
 * Get comprehensive topic momentum analysis with accurate competitive positioning
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
      console.log(`\nAnalyzing topic: ${topic.name}`);
      
      // 1. Gather recent news data for context
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
              source: source.name,
              url: item.link
            }));
          
          recentNews.push(...topicItems);
        } catch (err) {
          console.error(`Error parsing ${source.url}:`, err.message);
        }
      }
      
      // 2. Comprehensive competitive positioning analysis
      const competitorPositioning = [];
      const batchAnalysisPrompt = `
Analyze each competitor's actual position on "${topic.name}". For each competitor, determine:
1. Strength level: Strong/Moderate/Weak/None
2. Evidence of activity (products, announcements, investments)
3. Market leadership indicators

Competitors to analyze:
${competitors.map(c => `- ${c.name}`).join('\n')}

Recent news context:
${recentNews.slice(0, 3).map(n => `- ${n.title} (${n.source})`).join('\n')}

For each competitor, respond with:
COMPETITOR: [name]
STRENGTH: [Strong/Moderate/Weak/None]
EVIDENCE: [specific evidence or "No public activity found"]
---`;

      try {
        const batchAnalysis = await claudeService.sendMessage(batchAnalysisPrompt);
        
        // Parse the batch analysis
        const competitorBlocks = batchAnalysis.split('---').filter(block => block.trim());
        
        for (const block of competitorBlocks) {
          const lines = block.trim().split('\n');
          const competitorName = lines.find(l => l.startsWith('COMPETITOR:'))?.split(':')[1]?.trim();
          const strength = lines.find(l => l.startsWith('STRENGTH:'))?.split(':')[1]?.trim().toLowerCase();
          const evidence = lines.find(l => l.startsWith('EVIDENCE:'))?.split(':')[1]?.trim();
          
          if (competitorName) {
            competitorPositioning.push({
              name: competitorName,
              strength: strength || 'none',
              evidence: evidence || 'No specific evidence found',
              analysis: block
            });
          }
        }
        
        // Fill in any missing competitors
        for (const competitor of competitors) {
          if (!competitorPositioning.find(cp => cp.name === competitor.name)) {
            competitorPositioning.push({
              name: competitor.name,
              strength: 'none',
              evidence: 'Not analyzed',
              analysis: 'No data available'
            });
          }
        }
        
      } catch (err) {
        console.error('Error in batch competitor analysis:', err);
        // Fallback to individual analysis if batch fails
        for (const competitor of competitors) {
          competitorPositioning.push({
            name: competitor.name,
            strength: 'none',
            evidence: 'Analysis unavailable',
            analysis: 'Error in analysis'
          });
        }
      }
      
      // 3. Calculate accurate NVS based on actual competitive weakness
      const strengthCounts = {
        strong: competitorPositioning.filter(c => c.strength === 'strong').length,
        moderate: competitorPositioning.filter(c => c.strength === 'moderate').length,
        weak: competitorPositioning.filter(c => c.strength === 'weak').length,
        none: competitorPositioning.filter(c => c.strength === 'none').length
      };
      
      const totalCompetitors = competitors.length || 1;
      const weaknessRatio = (strengthCounts.weak + strengthCounts.none) / totalCompetitors;
      
      // NVS formula: base on weakness ratio, penalize for strong competitors
      const nvs = Math.round(
        Math.max(0, Math.min(100, 
          (weaknessRatio * 100) - (strengthCounts.strong * 15) + (strengthCounts.none * 5)
        ))
      );
      
      console.log(`Topic ${topic.name} - Competitive Analysis:`, strengthCounts);
      console.log(`NVS Score: ${nvs} (Weakness Ratio: ${weaknessRatio.toFixed(2)})`);
      
      // 4. Determine media trend based on actual news volume
      const mediaTrend = recentNews.length > 10 ? 'increasing' : 
                        recentNews.length > 5 ? 'stable' : 
                        recentNews.length > 0 ? 'emerging' : 'quiet';
      
      // 5. Generate insights based on actual data
      const insightsPrompt = `
Based on this competitive landscape for "${topic.name}":
- ${strengthCounts.strong} strong competitors
- ${strengthCounts.moderate} moderate competitors  
- ${strengthCounts.weak} weak competitors
- ${strengthCounts.none} with no presence
- Recent news items: ${recentNews.length}
- NVS Score: ${nvs}/100

Provide:
1. MOMENTUM: Hot/Growing/Stable/Emerging/Declining
2. KEY_DRIVERS: Top 3 factors driving this topic (be specific)
3. BARRIERS: Main challenges or risks
4. TIME_WINDOW: Immediate/3months/6months/12months`;

      const insights = await claudeService.sendMessage(insightsPrompt);
      const parsedInsights = parseInsights(insights);
      
      topicMomentumData.push({
        id: topic.id,
        name: topic.name,
        keywords: topic.keywords || [],
        momentum: parsedInsights.momentum || 'stable',
        opportunityScore: nvs,
        mediaTrend: mediaTrend,
        keyDrivers: parsedInsights.keyDrivers || [`Market opportunity in ${topic.name}`],
        barriers: parsedInsights.barriers || ['Market competition'],
        timeWindow: parsedInsights.timeWindow || '6months',
        competitorActivity: {
          strong: strengthCounts.strong,
          moderate: strengthCounts.moderate,
          weak: strengthCounts.weak,
          none: strengthCounts.none,
          details: competitorPositioning,
          weaknessRatio: weaknessRatio
        },
        recentNews: recentNews.slice(0, 5),
        lastUpdated: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      version: 'v3-accurate-positioning',
      organizationId,
      topics: topicMomentumData,
      competitorCount: competitors.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error analyzing topic momentum:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze topic momentum',
      details: error.message
    });
  }
};

/**
 * Parse insights from AI response
 */
function parseInsights(analysis) {
  const result = {
    momentum: 'stable',
    keyDrivers: [],
    barriers: [],
    timeWindow: '6months'
  };
  
  try {
    const lines = analysis.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('MOMENTUM:')) {
        result.momentum = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('TIME_WINDOW:')) {
        result.timeWindow = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('KEY_DRIVERS:')) {
        currentSection = 'drivers';
      } else if (trimmed.startsWith('BARRIERS:')) {
        currentSection = 'barriers';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
        const item = trimmed.replace(/^[-•\d+\.]\s*/, '').trim();
        if (item && currentSection === 'drivers') {
          result.keyDrivers.push(item);
        } else if (item && currentSection === 'barriers') {
          result.barriers.push(item);
        }
      }
    });
  } catch (err) {
    console.error('Error parsing insights:', err);
  }
  
  return result;
}