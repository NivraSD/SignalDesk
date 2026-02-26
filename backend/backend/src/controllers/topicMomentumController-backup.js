// Backup of original controller
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
    
    // For now, return mock data with the correct structure
    const topicMomentumData = topics.map((topic, index) => {
      // Mock NVS calculation based on index
      const mockWeakCompetitors = Math.floor(Math.random() * competitors.length);
      const mockStrongCompetitors = Math.floor(Math.random() * 2);
      const nvs = Math.max(0, Math.min(100, 
        Math.round((mockWeakCompetitors / competitors.length) * 100) - (mockStrongCompetitors * 10)
      ));
      
      return {
        id: topic.id,
        name: topic.name,
        keywords: topic.keywords || [],
        momentum: ['hot', 'growing', 'stable', 'emerging'][index % 4],
        opportunityScore: nvs,
        mediaTrend: ['increasing', 'stable', 'decreasing'][index % 3],
        keyDrivers: [
          `Growing market demand for ${topic.name}`,
          'Limited competitor presence in this space',
          'Regulatory environment becoming favorable'
        ],
        barriers: [
          'Technical complexity',
          'Market education needed'
        ],
        timeWindow: ['immediate', '3months', '6months'][index % 3],
        recommendation: nvs > 70 
          ? `High opportunity - Launch thought leadership campaign on ${topic.name} immediately`
          : `Monitor closely - Build expertise in ${topic.name} for future opportunities`,
        thoughtLeadershipIdeas: nvs > 70 ? [
          `White paper: "The Future of ${topic.name} in E-commerce"`,
          `Webinar series on implementing ${topic.name} strategies`,
          `Case study showcase of innovative ${topic.name} applications`
        ] : [],
        competitorActivity: {
          strong: mockStrongCompetitors,
          moderate: Math.floor(Math.random() * 2),
          weak: mockWeakCompetitors,
          none: competitors.length - mockStrongCompetitors - mockWeakCompetitors,
          details: competitors.map(c => ({
            name: c.name,
            analysis: 'Mock analysis',
            strength: ['strong', 'moderate', 'weak', 'none'][Math.floor(Math.random() * 4)]
          })),
          weaknessRatio: mockWeakCompetitors / competitors.length
        },
        recentNews: [],
        lastUpdated: new Date().toISOString()
      };
    });
    
    res.json({
      success: true,
      version: 'v2-nvs-based-on-weakness',
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