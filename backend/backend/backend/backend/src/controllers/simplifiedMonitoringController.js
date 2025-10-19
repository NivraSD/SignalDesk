/**
 * SIMPLIFIED MONITORING CONTROLLER
 * Removes executive summary and focuses on direct intelligence delivery
 */

const pool = require('../config/db');
const StrategicMonitoringCoordinator = require('../services/StrategicMonitoringCoordinator');
const MonitoringDiagnosticService = require('../services/MonitoringDiagnosticService');

class SimplifiedMonitoringController {
  constructor() {
    this.coordinator = new StrategicMonitoringCoordinator();
    this.diagnostic = new MonitoringDiagnosticService();
  }

  /**
   * Main endpoint - runs complete monitoring and returns intelligence
   * NO EXECUTIVE SUMMARY - just the actual data
   */
  async getIntelligence(req, res) {
    try {
      const { organizationId } = req.params;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID required'
        });
      }
      
      console.log('\n📊 SIMPLIFIED INTELLIGENCE GATHERING');
      console.log('=====================================');
      console.log('Organization:', organizationId);
      console.log('=====================================\n');
      
      // Run the strategic monitoring pipeline
      const results = await this.coordinator.runStrategicMonitoring(organizationId);
      
      if (!results.success) {
        throw new Error(results.error || 'Monitoring failed');
      }
      
      // Return simplified, direct intelligence
      const intelligence = {
        success: true,
        
        // Direct article data
        articles: {
          total: results.data.articles?.length || 0,
          byCategory: this.categorizeArticles(results.data.articles || []),
          recent: (results.data.articles || []).slice(0, 10)
        },
        
        // Competitive intelligence
        competitors: {
          activities: results.data.intelligence?.competitorActivity || [],
          count: results.data.intelligence?.competitorActivity?.length || 0
        },
        
        // Topic intelligence  
        topics: {
          trends: results.data.intelligence?.emergingTrends || [],
          count: results.data.intelligence?.emergingTrends?.length || 0
        },
        
        // Opportunities (the actual valuable output)
        opportunities: {
          discovered: results.data.opportunities || [],
          count: results.data.opportunities?.length || 0,
          topOpportunity: results.data.opportunities?.[0] || null
        },
        
        // Narrative gaps (actionable insights)
        narrativeGaps: results.data.intelligence?.narrativeGaps || [],
        
        // Simple metadata
        metadata: {
          timestamp: new Date().toISOString(),
          organizationId,
          sourcesUsed: results.data.sources?.length || 0,
          processingTime: results.processingTime,
          dataComplete: results.data.articles?.length > 0
        }
      };
      
      console.log('\n✅ Intelligence delivered:');
      console.log(`   Articles: ${intelligence.articles.total}`);
      console.log(`   Competitor activities: ${intelligence.competitors.count}`);
      console.log(`   Trends: ${intelligence.topics.count}`);
      console.log(`   Opportunities: ${intelligence.opportunities.count}`);
      
      res.json(intelligence);
      
    } catch (error) {
      console.error('Intelligence gathering error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to gather intelligence'
      });
    }
  }

  /**
   * Diagnostic endpoint - checks system health
   */
  async runDiagnostic(req, res) {
    try {
      const { organizationId } = req.params;
      
      console.log('🔍 Running system diagnostic...');
      const diagnostic = await this.diagnostic.runCompleteDiagnostic(organizationId);
      
      // Simplify the diagnostic output
      const health = {
        healthy: !this.hasIssues(diagnostic),
        issues: this.extractIssues(diagnostic),
        recommendations: this.generateRecommendations(diagnostic),
        systemStatus: {
          configuration: diagnostic.stages.configuration?.status || 'unknown',
          sources: diagnostic.stages.sources?.status || 'unknown',
          collection: diagnostic.stages.collection?.status || 'unknown',
          analysis: diagnostic.stages.analysis?.status || 'unknown',
          population: diagnostic.stages.population?.status || 'unknown'
        }
      };
      
      res.json({
        success: true,
        health
      });
      
    } catch (error) {
      console.error('Diagnostic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Auto-fix endpoint - attempts to fix issues automatically
   */
  async autoFix(req, res) {
    try {
      const { organizationId } = req.params;
      
      console.log('🔧 Running auto-fix...');
      
      // Run diagnostic first
      const diagnostic = await this.diagnostic.runCompleteDiagnostic(organizationId);
      
      // Attempt auto-fix
      const fixes = await this.diagnostic.autoFix(organizationId, diagnostic);
      
      res.json({
        success: true,
        fixes,
        message: `Fixed ${fixes.successful.length} issues, ${fixes.failed.length} failed`
      });
      
    } catch (error) {
      console.error('Auto-fix error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test endpoint - runs with sample data
   */
  async test(req, res) {
    try {
      const testOrgId = 'test-org-' + Date.now();
      
      console.log('🧪 Running test with sample data...');
      
      // Create test organization
      await pool.query(
        `INSERT INTO organizations (id, name, industry) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (id) DO UPDATE SET name = $2`,
        [testOrgId, 'Test Organization', 'Technology']
      );
      
      // Add test competitors
      const testCompetitors = ['Microsoft', 'Google', 'Amazon'];
      for (const comp of testCompetitors) {
        await pool.query(
          `INSERT INTO intelligence_targets (organization_id, name, type, priority, active)
           VALUES ($1, $2, 'competitor', 'high', true)
           ON CONFLICT DO NOTHING`,
          [testOrgId, comp]
        );
      }
      
      // Add test topics
      const testTopics = ['Artificial Intelligence', 'Cloud Computing'];
      for (const topic of testTopics) {
        await pool.query(
          `INSERT INTO intelligence_targets (organization_id, name, type, priority, active)
           VALUES ($1, $2, 'topic', 'high', true)
           ON CONFLICT DO NOTHING`,
          [testOrgId, topic]
        );
      }
      
      // Run monitoring
      const results = await this.coordinator.runStrategicMonitoring(testOrgId);
      
      // Clean up test data
      await pool.query('DELETE FROM news_articles WHERE organization_id = $1', [testOrgId]);
      await pool.query('DELETE FROM intelligence_targets WHERE organization_id = $1', [testOrgId]);
      await pool.query('DELETE FROM organizations WHERE id = $1', [testOrgId]);
      
      res.json({
        success: true,
        message: 'Test completed successfully',
        results: {
          articlesCollected: results.data?.articles?.length || 0,
          opportunitiesFound: results.data?.opportunities?.length || 0,
          success: results.success
        }
      });
      
    } catch (error) {
      console.error('Test error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Helper methods
   */
  
  categorizeArticles(articles) {
    const categories = {};
    
    articles.forEach(article => {
      const cat = article.category || 'uncategorized';
      if (!categories[cat]) {
        categories[cat] = {
          count: 0,
          articles: []
        };
      }
      categories[cat].count++;
      if (categories[cat].articles.length < 5) {
        categories[cat].articles.push({
          title: article.title,
          source: article.source,
          date: article.publishedDate
        });
      }
    });
    
    return categories;
  }
  
  hasIssues(diagnostic) {
    return Object.values(diagnostic.stages).some(stage => 
      stage.issues && stage.issues.length > 0
    );
  }
  
  extractIssues(diagnostic) {
    const allIssues = [];
    
    Object.entries(diagnostic.stages).forEach(([stageName, stage]) => {
      if (stage.issues) {
        stage.issues.forEach(issue => {
          allIssues.push({
            stage: stageName,
            severity: issue.severity,
            issue: issue.issue,
            fix: issue.fix
          });
        });
      }
    });
    
    return allIssues;
  }
  
  generateRecommendations(diagnostic) {
    const recommendations = [];
    
    // Check critical issues first
    const criticalIssues = this.extractIssues(diagnostic).filter(i => i.severity === 'critical');
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'immediate',
        action: 'Run auto-fix to resolve critical issues',
        endpoint: '/api/monitoring/auto-fix/:organizationId'
      });
    }
    
    // Check data collection
    if (diagnostic.stages.collection?.articlesCollected === 0) {
      recommendations.push({
        priority: 'high',
        action: 'Configure news sources and run collection',
        details: 'No articles are being collected'
      });
    }
    
    // Check opportunities
    if (diagnostic.stages.population?.tables?.opportunity_history === 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Review opportunity discovery settings',
        details: 'No opportunities have been generated'
      });
    }
    
    return recommendations;
  }
}

// Create singleton instance
const controller = new SimplifiedMonitoringController();

// Export controller methods
module.exports = {
  getIntelligence: (req, res) => controller.getIntelligence(req, res),
  runDiagnostic: (req, res) => controller.runDiagnostic(req, res),
  autoFix: (req, res) => controller.autoFix(req, res),
  test: (req, res) => controller.test(req, res)
};