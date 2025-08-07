/**
 * OPPORTUNITY ORCHESTRATOR CONTROLLER
 * Integrates the research-optimizer agent with the Opportunity Engine frontend
 */

const OpportunityEngineOrchestrator = require('../agents/OpportunityEngineOrchestration');
const pool = require('../config/db');
const claudeService = require('../../config/claude');

class OpportunityOrchestratorController {
  constructor() {
    this.orchestrator = new OpportunityEngineOrchestrator();
    this.initialized = false;
  }

  /**
   * Initialize the orchestrator on first use
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.orchestrator.initialize();
      this.initialized = true;
    }
  }

  /**
   * Main endpoint for opportunity discovery with optimized research
   */
  async discoverOpportunitiesOptimized(req, res) {
    try {
      await this.ensureInitialized();
      
      const { organizationId, intelligenceData } = req.body;
      
      if (!organizationId || !intelligenceData) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID and intelligence data required'
        });
      }
      
      console.log('\n🚀 OPTIMIZED OPPORTUNITY DISCOVERY');
      console.log('Organization:', organizationId);
      console.log('Data Volume:', JSON.stringify(intelligenceData).length, 'bytes');
      
      // Get organization context
      const orgContext = await this.getOrganizationContext(organizationId);
      
      // Enhance intelligence data with context
      const enhancedData = {
        ...intelligenceData,
        organization: orgContext.organization,
        competitors: orgContext.competitors,
        topics: orgContext.topics,
        historicalOpportunities: orgContext.historicalOpportunities
      };
      
      // Run optimized opportunity discovery
      const startTime = Date.now();
      const opportunities = await this.orchestrator.discoverOpportunities(enhancedData);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Discovered ${opportunities.opportunities.length} opportunities in ${processingTime}ms`);
      
      // Store successful opportunities for learning
      await this.storeOpportunities(organizationId, opportunities.opportunities);
      
      // Return results
      res.json({
        success: true,
        opportunities: opportunities.opportunities,
        metadata: {
          ...opportunities.metadata,
          processingTime,
          organizationId,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Opportunity discovery error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to discover opportunities',
        details: error.message
      });
    }
  }

  /**
   * Analyze and optimize current agent configuration
   */
  async analyzeAgentPerformance(req, res) {
    try {
      await this.ensureInitialized();
      
      const { organizationId } = req.params;
      
      // Get recent agent performance metrics
      const metrics = await this.getAgentMetrics(organizationId);
      
      // Deploy optimizer to analyze performance
      const analysis = await this.orchestrator.deployOptimizer({
        task: 'analyze_agent_performance',
        context: {
          metrics,
          recentRuns: metrics.recentRuns,
          successRate: metrics.successRate,
          averageProcessingTime: metrics.avgTime,
          agentUtilization: metrics.agentUsage
        }
      });
      
      res.json({
        success: true,
        analysis,
        recommendations: this.generateRecommendations(analysis),
        currentMetrics: metrics
      });
      
    } catch (error) {
      console.error('Performance analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze agent performance',
        details: error.message
      });
    }
  }

  /**
   * Optimize workflow for specific opportunity type
   */
  async optimizeWorkflow(req, res) {
    try {
      await this.ensureInitialized();
      
      const { opportunityType, constraints } = req.body;
      
      const optimization = await this.orchestrator.deployOptimizer({
        task: 'optimize_workflow',
        context: {
          opportunityType,
          constraints: constraints || {
            timeLimit: '3 minutes',
            qualityThreshold: 'high',
            resourceLimit: 'standard'
          },
          availableAgents: Object.keys(this.orchestrator.agents)
        }
      });
      
      res.json({
        success: true,
        workflow: optimization,
        estimatedTime: optimization.estimatedTime,
        expectedQuality: optimization.expectedQuality
      });
      
    } catch (error) {
      console.error('Workflow optimization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize workflow',
        details: error.message
      });
    }
  }

  /**
   * Test optimized workflow with sample data
   */
  async testWorkflow(req, res) {
    try {
      await this.ensureInitialized();
      
      const { testData, workflowType } = req.body;
      
      console.log('🧪 Testing optimized workflow:', workflowType);
      
      // Run test with sample data
      const testResults = await this.orchestrator.executeOptimizedWorkflow(
        { agentDeployment: this.getTestDeployment(workflowType) },
        testData || this.generateTestData()
      );
      
      // Evaluate test results
      const evaluation = await this.orchestrator.deployOptimizer({
        task: 'evaluate_test_results',
        context: {
          workflowType,
          results: Object.keys(testResults),
          dataCompleteness: this.assessTestCompleteness(testResults)
        }
      });
      
      res.json({
        success: true,
        testResults,
        evaluation,
        recommendations: evaluation.improvements || []
      });
      
    } catch (error) {
      console.error('Workflow test error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test workflow',
        details: error.message
      });
    }
  }

  /**
   * Get real-time optimization suggestions
   */
  async getOptimizationSuggestions(req, res) {
    try {
      await this.ensureInitialized();
      
      const { currentState, objective } = req.body;
      
      const suggestions = await this.orchestrator.deployOptimizer({
        task: 'provide_realtime_suggestions',
        context: {
          currentState,
          objective,
          availableActions: [
            'deploy_additional_agent',
            'modify_agent_prompt',
            'change_processing_sequence',
            'adjust_quality_threshold',
            'implement_caching'
          ]
        }
      });
      
      res.json({
        success: true,
        suggestions: suggestions.recommendations || [],
        priority: suggestions.priority || 'medium',
        expectedImprovement: suggestions.expectedImprovement || 'moderate'
      });
      
    } catch (error) {
      console.error('Suggestion generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate optimization suggestions',
        details: error.message
      });
    }
  }

  /**
   * Helper Functions
   */

  async getOrganizationContext(organizationId) {
    try {
      // Get organization details
      const orgResult = await pool.query(
        'SELECT * FROM organizations WHERE id = $1 OR name = $1',
        [organizationId]
      );
      
      // Get competitors
      const competitorResult = await pool.query(
        `SELECT * FROM intelligence_targets 
         WHERE organization_id = $1 AND type = 'competitor' AND active = true`,
        [organizationId]
      );
      
      // Get topics
      const topicResult = await pool.query(
        `SELECT * FROM intelligence_targets 
         WHERE organization_id = $1 AND type = 'topic' AND active = true`,
        [organizationId]
      );
      
      // Get historical opportunities for learning
      const historyResult = await pool.query(
        `SELECT * FROM opportunity_history 
         WHERE organization_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [organizationId]
      );
      
      return {
        organization: orgResult.rows[0] || { id: organizationId },
        competitors: competitorResult.rows,
        topics: topicResult.rows,
        historicalOpportunities: historyResult.rows
      };
    } catch (error) {
      console.error('Error getting organization context:', error);
      return {
        organization: { id: organizationId },
        competitors: [],
        topics: [],
        historicalOpportunities: []
      };
    }
  }

  async storeOpportunities(organizationId, opportunities) {
    try {
      for (const opportunity of opportunities) {
        await pool.query(
          `INSERT INTO opportunity_history 
           (organization_id, title, type, score, execution_plan, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            organizationId,
            opportunity.title,
            opportunity.type,
            opportunity.totalScore || 0,
            JSON.stringify(opportunity.executionPlan)
          ]
        );
      }
    } catch (error) {
      console.error('Error storing opportunities:', error);
    }
  }

  async getAgentMetrics(organizationId) {
    try {
      // Get performance metrics from database
      const result = await pool.query(
        `SELECT 
           COUNT(*) as total_runs,
           AVG(processing_time) as avg_time,
           SUM(CASE WHEN success = true THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
         FROM agent_performance_logs
         WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [organizationId]
      );
      
      const agentUsage = await pool.query(
        `SELECT agent_type, COUNT(*) as usage_count
         FROM agent_performance_logs
         WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days'
         GROUP BY agent_type`,
        [organizationId]
      );
      
      return {
        recentRuns: result.rows[0]?.total_runs || 0,
        avgTime: result.rows[0]?.avg_time || 0,
        successRate: result.rows[0]?.success_rate || 0,
        agentUsage: agentUsage.rows
      };
    } catch (error) {
      console.error('Error getting agent metrics:', error);
      return {
        recentRuns: 0,
        avgTime: 0,
        successRate: 0,
        agentUsage: []
      };
    }
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.bottlenecks) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        action: `Address bottleneck in ${analysis.bottlenecks[0]}`,
        expectedImprovement: '20-30% faster processing'
      });
    }
    
    if (analysis.underutilizedAgents) {
      recommendations.push({
        type: 'utilization',
        priority: 'medium',
        action: `Consider using ${analysis.underutilizedAgents.join(', ')} more frequently`,
        expectedImprovement: 'Better research coverage'
      });
    }
    
    if (analysis.qualityIssues) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        action: 'Implement additional validation steps',
        expectedImprovement: 'Higher confidence scores'
      });
    }
    
    return recommendations;
  }

  getTestDeployment(workflowType) {
    const deployments = {
      simple: {
        parallel: [
          { agent: 'data-analyst', task: 'Basic analysis' }
        ],
        sequential: []
      },
      comprehensive: {
        parallel: [
          { agent: 'data-analyst', task: 'Deep analysis' },
          { agent: 'search-specialist', task: 'Market research' }
        ],
        sequential: [
          { agent: 'task-decomposition-expert', task: 'Plan creation', dependencies: ['data-analyst'] }
        ]
      },
      quick: {
        parallel: [
          { agent: 'query-clarifier', task: 'Quick assessment' }
        ],
        sequential: []
      }
    };
    
    return deployments[workflowType] || deployments.simple;
  }

  generateTestData() {
    return {
      articles: [
        {
          title: 'Test Article 1',
          content: 'Sample content about industry trends',
          source: 'Test Source',
          date: new Date().toISOString()
        }
      ],
      competitors: [
        { name: 'Test Competitor', recent_activity: 'Product launch' }
      ],
      topics: [
        { name: 'Test Topic', momentum: 0.8 }
      ]
    };
  }

  assessTestCompleteness(results) {
    const expectedKeys = ['data-analyst', 'search-specialist', 'query-clarifier'];
    const presentKeys = Object.keys(results);
    
    const completeness = presentKeys.filter(key => expectedKeys.includes(key)).length / expectedKeys.length;
    
    return {
      score: completeness,
      missing: expectedKeys.filter(key => !presentKeys.includes(key)),
      extra: presentKeys.filter(key => !expectedKeys.includes(key))
    };
  }
}

// Create singleton instance
const orchestratorController = new OpportunityOrchestratorController();

// Export controller methods
module.exports = {
  discoverOpportunitiesOptimized: (req, res) => 
    orchestratorController.discoverOpportunitiesOptimized(req, res),
  
  analyzeAgentPerformance: (req, res) => 
    orchestratorController.analyzeAgentPerformance(req, res),
  
  optimizeWorkflow: (req, res) => 
    orchestratorController.optimizeWorkflow(req, res),
  
  testWorkflow: (req, res) => 
    orchestratorController.testWorkflow(req, res),
  
  getOptimizationSuggestions: (req, res) => 
    orchestratorController.getOptimizationSuggestions(req, res)
};