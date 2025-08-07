const claudeService = require('../../config/claude');
const pool = require('../config/db');
const OpportunityCreativeAgent = require('../agents/opportunityCreativeAgent');
const { TopicMomentumCoordinator } = require('../agents/topicMomentumAgents');

const analyzePosition = async (req, res) => {
  try {
    const { organizationId, organizationName, competitors, topics, useCreativeAgent } = req.body;
    
    console.log(`[OpportunityController] Analyzing position for ${organizationName}`);
    
    // Step 1: Get topic momentum data
    const topicCoordinator = new TopicMomentumCoordinator();
    const topicMomentum = await topicCoordinator.analyzeTopicMomentum(
      organizationId,
      topics,
      competitors
    );
    
    // Step 2: Analyze strengths using standard prompt
    const strengthsPrompt = `Analyze ${organizationName}'s strategic strengths for PR opportunities.

Competitors: ${competitors.map(c => c.name).join(', ')}
Topics: ${topics.map(t => t.name).join(', ')}
Topic Momentum Data: ${JSON.stringify(topicMomentum.slice(0, 3).map(t => ({
  name: t.name,
  momentum: t.momentum,
  competitorWeakness: t.competitorActivity.weaknessRatio
})))}

Identify 3-5 specific strengths that ${organizationName} can leverage for thought leadership. Focus on:
- Unique capabilities vs competitors
- Market position advantages
- Credibility areas
- Resource advantages

Be specific and actionable.`;

    const strengthsResponse = await claudeService.sendMessage(strengthsPrompt);
    const strengths = parseStrengths(strengthsResponse);
    
    // Step 3: Generate creative opportunities
    let opportunities = [];
    
    if (useCreativeAgent) {
      const creativeAgent = new OpportunityCreativeAgent();
      const context = {
        organizationName,
        strengths,
        competitorGaps: topicMomentum
          .filter(t => t.competitorActivity.weaknessRatio > 0.5)
          .map(t => t.name),
        topicMomentum: topicMomentum.slice(0, 5),
        industryContext: topics[0]?.industry || 'technology'
      };
      
      opportunities = await creativeAgent.generateCreativeOpportunities(context);
    } else {
      // Fallback to standard opportunity generation
      opportunities = generateStandardOpportunities(organizationName, strengths, topicMomentum);
    }
    
    // Step 4: Calculate internal scores (not shown to user)
    const crsScore = calculateCRS(strengths, competitors);
    
    const analysis = {
      strengths,
      opportunities: opportunities.slice(0, 3), // Top 3 opportunities
      readiness: {
        successFactors: [
          'Strong executive commitment to thought leadership',
          'Established content creation capabilities',
          'Clear differentiation from competitors'
        ],
        challenges: [
          'Need for consistent content production',
          'Competitive response management',
          'Resource allocation for campaigns'
        ]
      },
      crsScore, // Internal use only
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      analysis,
      topicMomentum: topicMomentum.slice(0, 3) // Include for reference
    });
    
  } catch (error) {
    console.error('[OpportunityController] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze opportunity position',
      error: error.message
    });
  }
};

const generateExecutionPlan = async (req, res) => {
  try {
    const { concept, organizationName } = req.body;
    
    const executionPrompt = `Create a detailed execution plan for this PR opportunity.

Organization: ${organizationName}
Campaign: ${concept.name}
Type: ${concept.type}
Key Message: ${concept.keyMessage || concept.angle}

Create a comprehensive execution plan including:

1. CONTENT STRATEGY
- Primary content pieces with descriptions
- Content calendar (first 30 days)
- Key messages and proof points
- Executive positioning

2. MEDIA STRATEGY  
- Target media tiers and specific outlets
- Journalist personas and pitch angles
- Exclusive opportunities
- Speaking opportunities

3. CAMPAIGN TIMELINE
Week 1-2: Foundation and preparation
Week 3-4: Launch and amplification
Month 2: Sustain and expand
Month 3: Measure and optimize

4. SUCCESS METRICS
- Media coverage targets
- Engagement metrics
- Business impact indicators
- Competitive share of voice

5. RISK MITIGATION
- Potential challenges
- Contingency plans
- Crisis scenarios
- Response protocols

Be specific and actionable. This should be ready to execute.`;

    const planResponse = await claudeService.sendMessage(executionPrompt);
    
    res.json({
      success: true,
      plan: planResponse,
      concept
    });
    
  } catch (error) {
    console.error('[OpportunityController] Execution plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate execution plan',
      error: error.message
    });
  }
};

const saveAnalysis = async (req, res) => {
  try {
    const { organizationId, analysis, selectedConcept } = req.body;
    const userId = req.user.id;
    
    const query = `
      INSERT INTO opportunity_analyses 
      (organization_id, user_id, analysis_data, selected_concept, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id`;
    
    const result = await pool.query(query, [
      organizationId,
      userId,
      JSON.stringify(analysis),
      JSON.stringify(selectedConcept)
    ]);
    
    res.json({
      success: true,
      analysisId: result.rows[0].id
    });
    
  } catch (error) {
    console.error('[OpportunityController] Save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save analysis',
      error: error.message
    });
  }
};

const getAnalyses = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const query = `
      SELECT id, analysis_data, selected_concept, created_at
      FROM opportunity_analyses
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT 10`;
    
    const result = await pool.query(query, [organizationId]);
    
    res.json({
      success: true,
      analyses: result.rows
    });
    
  } catch (error) {
    console.error('[OpportunityController] Get analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analyses',
      error: error.message
    });
  }
};

// Helper functions
function parseStrengths(response) {
  const strengths = [];
  const lines = response.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    if (line.match(/^[\d\-•*]/) || line.includes('Strength')) {
      const strength = line
        .replace(/^[\d\-•*.\s]+/, '')
        .replace(/^Strength[:\s]*/i, '')
        .trim();
      
      if (strength && strength.length > 10) {
        strengths.push(strength);
      }
    }
  });
  
  // Ensure we have at least 3 strengths
  if (strengths.length < 3) {
    strengths.push(
      'Established market presence and brand recognition',
      'Strong leadership team with industry expertise',
      'Innovative approach to customer challenges'
    );
  }
  
  return strengths.slice(0, 5);
}

function calculateCRS(strengths, competitors) {
  // Simple CRS calculation based on strengths and competitive landscape
  const baseScore = 60;
  const strengthBonus = strengths.length * 5;
  const competitorPenalty = Math.min(competitors.length * 2, 15);
  
  return Math.min(100, baseScore + strengthBonus - competitorPenalty);
}

function generateStandardOpportunities(orgName, strengths, topicMomentum) {
  // Fallback standard opportunities
  const opportunities = [];
  
  // Find topics with high momentum and low competition
  const highOpportunityTopics = topicMomentum
    .filter(t => t.competitorActivity.weaknessRatio > 0.6)
    .slice(0, 3);
  
  highOpportunityTopics.forEach((topic, idx) => {
    opportunities.push({
      name: `${topic.name} Leadership Initiative`,
      type: 'thought_leadership',
      angle: `Position ${orgName} as the definitive voice on ${topic.name}`,
      contentIdeas: [
        'Executive perspective series',
        'Industry research report',
        'Media spokesperson program'
      ],
      audience: 'Industry executives and media',
      impact: 'Establish category leadership',
      timing: topic.momentum === 'hot' ? 'Immediate launch critical' : 'Strategic timing available',
      rationale: `High opportunity score with ${Math.round(topic.competitorActivity.weaknessRatio * 100)}% competitor weakness`
    });
  });
  
  return opportunities;
}

module.exports = {
  analyzePosition,
  generateExecutionPlan,
  saveAnalysis,
  getAnalyses
};