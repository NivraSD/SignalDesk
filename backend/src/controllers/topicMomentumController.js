const pool = require('../config/db');
const { TopicMomentumCoordinator } = require('../agents/topicMomentumAgents');

/**
 * Get topic momentum analysis using dedicated agent network
 */
exports.getTopicMomentum = async (req, res) => {
  try {
    const { organizationId } = req.params;
    console.log(`[TopicMomentumController] Starting analysis for organization: ${organizationId}`);
    
    // Get organization's topics from database
    const topicsQuery = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND type = $2 AND active = true',
      [organizationId, 'topic']
    );
    
    const topics = topicsQuery.rows;
    console.log(`[TopicMomentumController] Found ${topics.length} topics to analyze`);
    
    if (topics.length === 0) {
      return res.json({
        success: true,
        version: 'v5-agent-network',
        organizationId,
        topics: [],
        message: 'No active topics found for this organization',
        generatedAt: new Date().toISOString()
      });
    }
    
    // Get all competitors for competitive analysis
    const competitorsQuery = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND type = $2 AND active = true',
      [organizationId, 'competitor']
    );
    
    const competitors = competitorsQuery.rows;
    console.log(`[TopicMomentumController] Found ${competitors.length} competitors for analysis`);
    
    // Initialize the agent coordinator
    const coordinator = new TopicMomentumCoordinator();
    
    // Execute comprehensive analysis using agent network
    console.log('[TopicMomentumController] Deploying agent network for comprehensive analysis...');
    const startTime = Date.now();
    
    const topicAnalyses = await coordinator.analyzeTopicMomentum(
      organizationId,
      topics,
      competitors
    );
    
    const analysisTime = Date.now() - startTime;
    console.log(`[TopicMomentumController] Analysis completed in ${analysisTime}ms`);
    
    // Log quality metrics
    topicAnalyses.forEach(analysis => {
      console.log(`[TopicMomentumController] ${analysis.name}:`, {
        nvs: analysis.opportunityScore,
        momentum: analysis.momentum,
        dataQuality: analysis.analysisMetadata?.dataQuality,
        confidence: analysis.analysisMetadata?.confidence
      });
    });
    
    res.json({
      success: true,
      version: 'v5-agent-network',
      organizationId,
      topics: topicAnalyses,
      competitorCount: competitors.length,
      analysisMetadata: {
        executionTime: `${analysisTime}ms`,
        agentNetwork: 'TopicMomentumCoordinator',
        agents: [
          'CompetitivePositioningAgent',
          'TrendAnalysisAgent', 
          'MarketDynamicsAgent',
          'MediaMonitoringAgent',
          'SynthesisAgent'
        ]
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TopicMomentumController] Error analyzing topic momentum:', error);
    
    // Determine if it's a timeout or other error
    const isTimeout = error.message?.includes('timeout') || error.code === 'ETIMEDOUT';
    
    res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: isTimeout ? 'Analysis timeout - try fewer topics' : 'Failed to analyze topic momentum',
      details: error.message,
      suggestion: isTimeout ? 
        'Consider analyzing fewer topics at once or increasing timeout limits' :
        'Please check the logs for more details'
    });
  }
};