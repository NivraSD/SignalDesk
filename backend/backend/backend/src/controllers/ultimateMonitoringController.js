/**
 * Ultimate Monitoring Controller
 * Endpoints for the world's most advanced monitoring system
 */

const UltimateMonitoringAgent = require('../agents/monitoring/UltimateMonitoringAgent');
const pool = require('../config/db');

// Initialize the ultimate monitoring agent
const ultimateAgent = new UltimateMonitoringAgent();

/**
 * Start comprehensive monitoring for an organization
 */
exports.startUltimateMonitoring = async (req, res) => {
  try {
    const { organizationId, config, options } = req.body;
    
    console.log('🚀 INITIATING ULTIMATE MONITORING SYSTEM');
    console.log('Organization:', organizationId);
    console.log('Config:', JSON.stringify(config, null, 2));
    
    // Get organization configuration from database
    let monitoringConfig = config;
    
    if (!monitoringConfig && organizationId) {
      // Fetch from database
      const orgResult = await pool.query(
        'SELECT * FROM organizations WHERE id = $1',
        [organizationId]
      );
      
      // Try to get targets using organization_id as UUID first, fall back to name search
      let competitorsResult, topicsResult;
      
      // Check if organizationId is a valid UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId);
      
      if (isUUID) {
        competitorsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE organization_id = $1 AND type = 'competitor' AND active = true`,
          [organizationId]
        );
        
        topicsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE organization_id = $1 AND type = 'topic' AND active = true`,
          [organizationId]
        );
      } else {
        // For non-UUID org IDs, find by the first created targets
        competitorsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE type = 'competitor' AND active = true
           ORDER BY created_at DESC LIMIT 10`
        );
        
        topicsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE type = 'topic' AND active = true
           ORDER BY created_at DESC LIMIT 10`
        );
      }
      
      monitoringConfig = {
        organization: orgResult.rows[0] || { id: organizationId, name: organizationId },
        competitors: competitorsResult.rows,
        topics: topicsResult.rows,
        stakeholders: [], // Could be fetched similarly
        customQueries: config?.customQueries || []
      };
    }
    
    // Start continuous monitoring
    const monitoringId = await ultimateAgent.startContinuousMonitoring(
      monitoringConfig,
      options || {
        interval: 15 * 60 * 1000, // 15 minutes
        priority: 'high',
        alertThreshold: 'medium'
      }
    );
    
    // Store monitoring session in database
    await pool.query(
      `INSERT INTO monitoring_sessions 
       (id, organization_id, config, status, started_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [monitoringId, organizationId, JSON.stringify(monitoringConfig), 'active', new Date()]
    );
    
    res.json({
      success: true,
      monitoringId: monitoringId,
      message: 'Ultimate monitoring system activated',
      config: monitoringConfig,
      status: 'active'
    });
    
  } catch (error) {
    console.error('Error starting ultimate monitoring:', error);
    res.status(500).json({ 
      error: 'Failed to start monitoring',
      details: error.message 
    });
  }
};

/**
 * Run a single comprehensive analysis
 */
exports.runComprehensiveAnalysis = async (req, res) => {
  try {
    const { organizationId, config } = req.body;
    
    console.log('🔬 RUNNING COMPREHENSIVE ANALYSIS');
    
    // Get configuration
    let analysisConfig = config;
    if (!analysisConfig && organizationId) {
      // Fetch configuration from database
      const orgResult = await pool.query(
        'SELECT * FROM organizations WHERE id = $1',
        [organizationId]
      );
      
      // Try to get targets using organization_id as UUID first, fall back to name search
      let competitorsResult, topicsResult;
      
      // Check if organizationId is a valid UUID format
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId);
      
      if (isUUID) {
        competitorsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE organization_id = $1 AND type = 'competitor' AND active = true`,
          [organizationId]
        );
        
        topicsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE organization_id = $1 AND type = 'topic' AND active = true`,
          [organizationId]
        );
      } else {
        // For non-UUID org IDs, find by the first created targets
        competitorsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE type = 'competitor' AND active = true
           ORDER BY created_at DESC LIMIT 10`
        );
        
        topicsResult = await pool.query(
          `SELECT * FROM intelligence_targets 
           WHERE type = 'topic' AND active = true
           ORDER BY created_at DESC LIMIT 10`
        );
      }
      
      analysisConfig = {
        organization: orgResult.rows[0] || { id: organizationId, name: organizationId },
        competitors: competitorsResult.rows,
        topics: topicsResult.rows,
        stakeholders: [],
        customQueries: config?.customQueries || []
      };
    }
    
    // Run the complete pipeline once
    const results = await ultimateAgent.runCompletePipeline(analysisConfig);
    
    // Store results in database
    await pool.query(
      `INSERT INTO analysis_results 
       (organization_id, results, created_at) 
       VALUES ($1, $2, $3)`,
      [organizationId, JSON.stringify(results), new Date()]
    );
    
    res.json({
      success: true,
      results: results,
      summary: {
        sources: results.sources.length,
        dataPoints: results.metadata.dataPointsCollected,
        confidence: results.metadata.confidence,
        duration: results.metadata.duration,
        criticalAlerts: results.intelligence.criticalAlerts?.length || 0,
        opportunities: results.intelligence.opportunities?.length || 0,
        risks: results.intelligence.risks?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Error running comprehensive analysis:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
};

/**
 * Get monitoring status
 */
exports.getMonitoringStatus = async (req, res) => {
  try {
    const { monitoringId } = req.params;
    
    // Get status from agent
    const status = ultimateAgent.getMonitoringStatus(monitoringId);
    
    // Get latest results
    const latestResults = ultimateAgent.getLatestResults(monitoringId);
    
    res.json({
      success: true,
      monitoring: status,
      latestResults: latestResults
    });
    
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      details: error.message 
    });
  }
};

/**
 * Stop monitoring
 */
exports.stopMonitoring = async (req, res) => {
  try {
    const { monitoringId } = req.params;
    
    // Stop the monitoring
    ultimateAgent.stopMonitoring(monitoringId);
    
    // Update database
    await pool.query(
      `UPDATE monitoring_sessions 
       SET status = 'stopped', stopped_at = $1 
       WHERE id = $2`,
      [new Date(), monitoringId]
    );
    
    res.json({
      success: true,
      message: 'Monitoring stopped',
      monitoringId: monitoringId
    });
    
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({ 
      error: 'Failed to stop monitoring',
      details: error.message 
    });
  }
};

/**
 * Get analysis history
 */
exports.getAnalysisHistory = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 10 } = req.query;
    
    const result = await pool.query(
      `SELECT id, created_at, 
              results->>'metadata' as metadata,
              results->'summary' as summary
       FROM analysis_results 
       WHERE organization_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [organizationId, limit]
    );
    
    res.json({
      success: true,
      history: result.rows
    });
    
  } catch (error) {
    console.error('Error getting analysis history:', error);
    res.status(500).json({ 
      error: 'Failed to get history',
      details: error.message 
    });
  }
};

/**
 * Test specific agent capabilities
 */
exports.testAgentCapability = async (req, res) => {
  try {
    const { capability, testData } = req.body;
    
    console.log(`🧪 TESTING CAPABILITY: ${capability}`);
    
    let result;
    
    switch (capability) {
      case 'query_clarification':
        result = await ultimateAgent.clarifyMonitoringObjectives(testData);
        break;
        
      case 'source_discovery':
        result = await ultimateAgent.discoverComprehensiveSources(
          testData.objectives || {},
          testData.config || {}
        );
        break;
        
      case 'data_collection':
        result = await ultimateAgent.collectDataFromAllSources(
          testData.sources || [],
          testData.objectives || {}
        );
        break;
        
      case 'research_orchestration':
        result = await ultimateAgent.orchestrateResearchAnalysis(
          testData.data || {},
          testData.objectives || {},
          testData.config || {}
        );
        break;
        
      case 'deep_analysis':
        result = await ultimateAgent.performDeepDataAnalysis(
          testData.data || {},
          testData.researchPlan || {}
        );
        break;
        
      case 'intelligence_synthesis':
        result = await ultimateAgent.synthesizeIntelligence(
          testData.data || {},
          testData.analysis || {},
          testData.objectives || {},
          testData.config || {}
        );
        break;
        
      case 'report_generation':
        result = await ultimateAgent.generateComprehensiveReport(
          testData.intelligence || {},
          testData.analysis || {},
          testData.data || {},
          testData.config || {}
        );
        break;
        
      default:
        return res.status(400).json({ 
          error: 'Unknown capability',
          available: [
            'query_clarification',
            'source_discovery',
            'data_collection',
            'research_orchestration',
            'deep_analysis',
            'intelligence_synthesis',
            'report_generation'
          ]
        });
    }
    
    res.json({
      success: true,
      capability: capability,
      result: result
    });
    
  } catch (error) {
    console.error(`Error testing capability ${req.body.capability}:`, error);
    res.status(500).json({ 
      error: 'Test failed',
      details: error.message 
    });
  }
};

/**
 * Helper: Get organization configuration
 */
async function getOrganizationConfig(organizationId) {
  const orgResult = await pool.query(
    'SELECT * FROM organizations WHERE id = $1',
    [organizationId]
  );
  
  const competitorsResult = await pool.query(
    `SELECT * FROM intelligence_targets 
     WHERE organization_id = $1 AND type = 'competitor' AND active = true`,
    [organizationId]
  );
  
  const topicsResult = await pool.query(
    `SELECT * FROM intelligence_targets 
     WHERE organization_id = $1 AND type = 'topic' AND active = true`,
    [organizationId]
  );
  
  return {
    organization: orgResult.rows[0] || { id: organizationId, name: organizationId },
    competitors: competitorsResult.rows,
    topics: topicsResult.rows,
    stakeholders: [],
    customQueries: []
  };
}

// Cleanup on process exit
process.on('SIGINT', async () => {
  console.log('Cleaning up ultimate monitoring agent...');
  await ultimateAgent.cleanup();
  process.exit(0);
});