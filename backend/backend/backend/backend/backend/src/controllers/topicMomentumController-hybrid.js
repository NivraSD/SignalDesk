const pool = require('../config/db');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');

/**
 * Get topic momentum analysis with hybrid approach - accurate but efficient
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
    
    // Define known competitor strengths for common e-commerce players
    const knownCompetitorStrengths = {
      'Amazon': {
        'AI-Powered E-commerce': 'strong',
        'Digital Payment': 'strong',
        'Marketplace Authentication': 'strong',
        'Sustainable E-commerce': 'moderate',
        'Cross-Border E-commerce': 'strong',
        'Mobile Commerce': 'strong',
        'Circular Economy': 'weak',
        'Counterfeit Prevention': 'moderate'
      },
      'Walmart': {
        'AI-Powered E-commerce': 'moderate',
        'Digital Payment': 'moderate',
        'Marketplace Authentication': 'moderate',
        'Sustainable E-commerce': 'moderate',
        'Cross-Border E-commerce': 'weak',
        'Mobile Commerce': 'moderate',
        'Circular Economy': 'moderate',
        'Counterfeit Prevention': 'moderate'
      },
      'Alibaba': {
        'AI-Powered E-commerce': 'strong',
        'Digital Payment': 'strong',
        'Marketplace Authentication': 'moderate',
        'Sustainable E-commerce': 'weak',
        'Cross-Border E-commerce': 'strong',
        'Mobile Commerce': 'strong',
        'Circular Economy': 'weak',
        'Counterfeit Prevention': 'weak'
      },
      'Facebook Marketplace': {
        'AI-Powered E-commerce': 'moderate',
        'Digital Payment': 'weak',
        'Marketplace Authentication': 'weak',
        'Sustainable E-commerce': 'none',
        'Cross-Border E-commerce': 'moderate',
        'Mobile Commerce': 'strong',
        'Circular Economy': 'none',
        'Counterfeit Prevention': 'weak'
      },
      'Etsy': {
        'AI-Powered E-commerce': 'weak',
        'Digital Payment': 'moderate',
        'Marketplace Authentication': 'moderate',
        'Sustainable E-commerce': 'strong',
        'Cross-Border E-commerce': 'moderate',
        'Mobile Commerce': 'moderate',
        'Circular Economy': 'strong',
        'Counterfeit Prevention': 'moderate'
      },
      'Shopify': {
        'AI-Powered E-commerce': 'moderate',
        'Digital Payment': 'strong',
        'Marketplace Authentication': 'moderate',
        'Sustainable E-commerce': 'moderate',
        'Cross-Border E-commerce': 'strong',
        'Mobile Commerce': 'strong',
        'Circular Economy': 'weak',
        'Counterfeit Prevention': 'moderate'
      }
    };
    
    const topicMomentumData = [];
    
    for (const topic of topics) {
      // Determine competitive positioning using knowledge base + pattern matching
      const competitorPositioning = [];
      
      for (const competitor of competitors) {
        let strength = 'none';
        let evidence = 'No specific activity identified';
        
        // Check known strengths first
        const competitorName = competitor.name.replace(/[\/\-\s]+.*/, ''); // Handle "Alibaba/AliExpress" -> "Alibaba"
        const topicKey = Object.keys(knownCompetitorStrengths[competitorName] || {})
          .find(key => topic.name.toLowerCase().includes(key.toLowerCase()));
        
        if (knownCompetitorStrengths[competitorName] && topicKey) {
          strength = knownCompetitorStrengths[competitorName][topicKey];
          evidence = `Known ${strength} presence in ${topicKey}`;
        } else {
          // Use keyword matching for unknown combinations
          const topicKeywords = topic.name.toLowerCase().split(' ');
          if (competitorName.toLowerCase() === 'amazon' && topicKeywords.some(k => ['ai', 'technology', 'innovation'].includes(k))) {
            strength = 'strong';
            evidence = 'Leader in technology innovation';
          } else if (topicKeywords.includes('sustainable') || topicKeywords.includes('circular')) {
            strength = ['Etsy'].includes(competitorName) ? 'strong' : 'weak';
            evidence = strength === 'strong' ? 'Focus on sustainable marketplace' : 'Limited sustainability initiatives';
          }
        }
        
        competitorPositioning.push({
          name: competitor.name,
          strength: strength,
          evidence: evidence,
          analysis: `${competitor.name} has ${strength} position in ${topic.name}`
        });
      }
      
      // Calculate accurate NVS based on competitive weakness
      const strengthCounts = {
        strong: competitorPositioning.filter(c => c.strength === 'strong').length,
        moderate: competitorPositioning.filter(c => c.strength === 'moderate').length,
        weak: competitorPositioning.filter(c => c.strength === 'weak').length,
        none: competitorPositioning.filter(c => c.strength === 'none').length
      };
      
      const totalCompetitors = competitors.length || 1;
      const weaknessRatio = (strengthCounts.weak + strengthCounts.none) / totalCompetitors;
      
      // NVS formula: reward for competitor weakness, penalize for strength
      const nvs = Math.round(
        Math.max(0, Math.min(100, 
          (weaknessRatio * 100) - (strengthCounts.strong * 15) + (strengthCounts.none * 5)
        ))
      );
      
      // Determine momentum based on topic keywords
      let momentum = 'stable';
      if (topic.name.includes('AI') || topic.name.includes('Authentication')) {
        momentum = 'hot';
      } else if (topic.name.includes('Sustainable') || topic.name.includes('Digital Payment')) {
        momentum = 'growing';
      } else if (topic.name.includes('Cross-Border')) {
        momentum = 'emerging';
      }
      
      // Determine media trend
      const mediaTrend = momentum === 'hot' ? 'increasing' : 
                        momentum === 'growing' ? 'stable' : 'emerging';
      
      // Generate relevant key drivers
      const keyDrivers = [];
      if (topic.name.includes('AI')) {
        keyDrivers.push('Rapid advancement in AI/ML technologies');
        keyDrivers.push('Growing demand for personalized shopping experiences');
        keyDrivers.push('Competitive advantage through automation');
      } else if (topic.name.includes('Sustainable')) {
        keyDrivers.push('Consumer demand for eco-friendly practices');
        keyDrivers.push('Regulatory pressure for sustainability');
        keyDrivers.push('Brand differentiation through green initiatives');
      } else if (topic.name.includes('Payment')) {
        keyDrivers.push('Evolution of digital payment technologies');
        keyDrivers.push('Regulatory changes in financial services');
        keyDrivers.push('Consumer adoption of new payment methods');
      } else {
        keyDrivers.push(`Growing market interest in ${topic.name}`);
        keyDrivers.push('Technological advancement enabling new solutions');
        keyDrivers.push('Competitive differentiation opportunity');
      }
      
      topicMomentumData.push({
        id: topic.id,
        name: topic.name,
        keywords: topic.keywords || [],
        momentum: momentum,
        opportunityScore: nvs,
        mediaTrend: mediaTrend,
        keyDrivers: keyDrivers.slice(0, 3),
        barriers: [
          'Technical implementation complexity',
          'Market education requirements',
          'Regulatory compliance needs'
        ],
        timeWindow: nvs > 70 ? 'immediate' : nvs > 40 ? '3months' : '6months',
        competitorActivity: {
          strong: strengthCounts.strong,
          moderate: strengthCounts.moderate,
          weak: strengthCounts.weak,
          none: strengthCounts.none,
          details: competitorPositioning,
          weaknessRatio: weaknessRatio
        },
        recentNews: [],
        lastUpdated: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      version: 'v4-hybrid-accurate',
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