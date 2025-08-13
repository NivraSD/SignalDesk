const pool = require('../config/db');
const { TopicMomentumCoordinator } = require('../agents/topicMomentumAgents');

/**
 * Optimized Topic Momentum Controller with batching and caching
 */
class OptimizedTopicMomentumController {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.batchSize = 2; // Process 2 topics at a time to avoid overload
  }

  async getTopicMomentum(req, res) {
    try {
      const { organizationId } = req.params;
      const forceRefresh = req.query.refresh === 'true';
      
      console.log(`[OptimizedController] Starting analysis for organization: ${organizationId}`);
      
      // Check cache first
      const cacheKey = `momentum-${organizationId}`;
      if (!forceRefresh && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log('[OptimizedController] Returning cached results');
          return res.json({
            ...cached.data,
            fromCache: true,
            cacheAge: `${Math.round((Date.now() - cached.timestamp) / 1000)}s`
          });
        }
      }
      
      // Get topics and competitors
      const [topicsQuery, competitorsQuery] = await Promise.all([
        pool.query(
          'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND type = $2 AND active = true',
          [organizationId, 'topic']
        ),
        pool.query(
          'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND type = $2 AND active = true',
          [organizationId, 'competitor']
        )
      ]);
      
      const topics = topicsQuery.rows;
      const competitors = competitorsQuery.rows;
      
      console.log(`[OptimizedController] Found ${topics.length} topics and ${competitors.length} competitors`);
      
      if (topics.length === 0) {
        const emptyResponse = {
          success: true,
          version: 'v5-optimized',
          organizationId,
          topics: [],
          message: 'No active topics found',
          generatedAt: new Date().toISOString()
        };
        return res.json(emptyResponse);
      }
      
      // Process topics in batches to avoid overwhelming the system
      const coordinator = new TopicMomentumCoordinator();
      const allAnalyses = [];
      const startTime = Date.now();
      
      for (let i = 0; i < topics.length; i += this.batchSize) {
        const batch = topics.slice(i, i + this.batchSize);
        console.log(`[OptimizedController] Processing batch ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(topics.length/this.batchSize)}`);
        
        const batchAnalyses = await coordinator.analyzeTopicMomentum(
          organizationId,
          batch,
          competitors
        );
        
        allAnalyses.push(...batchAnalyses);
        
        // Add small delay between batches to prevent rate limiting
        if (i + this.batchSize < topics.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const analysisTime = Date.now() - startTime;
      console.log(`[OptimizedController] Completed all batches in ${analysisTime}ms`);
      
      // Prepare response
      const response = {
        success: true,
        version: 'v5-optimized',
        organizationId,
        topics: allAnalyses,
        competitorCount: competitors.length,
        analysisMetadata: {
          executionTime: `${analysisTime}ms`,
          batchSize: this.batchSize,
          totalBatches: Math.ceil(topics.length / this.batchSize),
          agentNetwork: 'TopicMomentumCoordinator',
          cacheEnabled: true
        },
        generatedAt: new Date().toISOString()
      };
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      res.json(response);
      
    } catch (error) {
      console.error('[OptimizedController] Error:', error);
      
      // Try to return partial results if available
      if (error.partialResults) {
        return res.status(206).json({
          success: false,
          partial: true,
          topics: error.partialResults,
          error: 'Partial analysis completed',
          details: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to analyze topic momentum',
        details: error.message,
        suggestion: 'Try reducing the number of topics or competitors'
      });
    }
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const controller = new OptimizedTopicMomentumController();

// Export the handler
exports.getTopicMomentum = (req, res) => controller.getTopicMomentum(req, res);