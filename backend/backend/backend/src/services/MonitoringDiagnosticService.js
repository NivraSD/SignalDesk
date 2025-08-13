/**
 * MONITORING DIAGNOSTIC & REPAIR SERVICE
 * Strategic solution to fix the entire monitoring pipeline
 */

const pool = require('../config/db');
const Parser = require('rss-parser');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class MonitoringDiagnosticService {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SignalDesk/1.0)'
      }
    });
    
    this.diagnosticResults = {
      timestamp: new Date().toISOString(),
      issues: [],
      fixes: [],
      dataFlow: {}
    };
  }

  /**
   * MASTER DIAGNOSTIC - Run complete system check
   */
  async runCompleteDiagnostic(organizationId) {
    console.log('\n🔍 RUNNING COMPLETE MONITORING DIAGNOSTIC');
    console.log('==========================================\n');
    
    const report = {
      organizationId,
      timestamp: new Date().toISOString(),
      stages: {}
    };
    
    // STAGE 1: Configuration Check
    report.stages.configuration = await this.diagnoseConfiguration(organizationId);
    
    // STAGE 2: Source Discovery
    report.stages.sources = await this.diagnoseSources(organizationId);
    
    // STAGE 3: Data Collection
    report.stages.collection = await this.diagnoseDataCollection(organizationId);
    
    // STAGE 4: Analysis Pipeline
    report.stages.analysis = await this.diagnoseAnalysis(organizationId);
    
    // STAGE 5: Data Population
    report.stages.population = await this.diagnosePopulation(organizationId);
    
    // Generate fix strategy
    report.fixStrategy = this.generateFixStrategy(report);
    
    // Save diagnostic report
    await this.saveDiagnosticReport(report);
    
    return report;
  }

  /**
   * STAGE 1: DIAGNOSE CONFIGURATION
   */
  async diagnoseConfiguration(organizationId) {
    console.log('📋 STAGE 1: Checking Configuration...');
    
    const results = {
      status: 'checking',
      issues: [],
      data: {}
    };
    
    try {
      // Check if organization exists
      const orgResult = await pool.query(
        'SELECT * FROM organizations WHERE id = $1 OR name = $1',
        [organizationId]
      );
      
      if (orgResult.rows.length === 0) {
        results.issues.push({
          severity: 'critical',
          issue: 'Organization not found',
          fix: 'Create organization record'
        });
        results.status = 'failed';
      } else {
        results.data.organization = orgResult.rows[0];
        
        // Check if it's using an ID as name
        if (orgResult.rows[0].name.startsWith('org-')) {
          results.issues.push({
            severity: 'high',
            issue: 'Organization using ID as name',
            fix: 'Update with real organization name'
          });
        }
      }
      
      // Check intelligence targets
      const targetsResult = await pool.query(
        'SELECT type, COUNT(*) as count FROM intelligence_targets WHERE organization_id = $1 GROUP BY type',
        [organizationId]
      );
      
      results.data.targets = targetsResult.rows;
      
      if (targetsResult.rows.length === 0) {
        results.issues.push({
          severity: 'critical',
          issue: 'No intelligence targets configured',
          fix: 'Add competitors and topics'
        });
        results.status = 'failed';
      } else {
        const hasCompetitors = targetsResult.rows.some(r => r.type === 'competitor');
        const hasTopics = targetsResult.rows.some(r => r.type === 'topic');
        
        if (!hasCompetitors) {
          results.issues.push({
            severity: 'high',
            issue: 'No competitors configured',
            fix: 'Add at least 3 competitors'
          });
        }
        
        if (!hasTopics) {
          results.issues.push({
            severity: 'high',
            issue: 'No topics configured',
            fix: 'Add at least 3 topics'
          });
        }
      }
      
      // Check source configurations
      const sourcesResult = await pool.query(
        'SELECT COUNT(*) as count FROM source_configurations WHERE organization_id = $1',
        [organizationId]
      );
      
      if (sourcesResult.rows[0].count === 0) {
        results.issues.push({
          severity: 'critical',
          issue: 'No sources configured',
          fix: 'Run source discovery and configuration'
        });
      }
      
      results.status = results.issues.filter(i => i.severity === 'critical').length > 0 ? 'failed' : 
                       results.issues.length > 0 ? 'warning' : 'passed';
      
    } catch (error) {
      results.status = 'error';
      results.error = error.message;
    }
    
    console.log(`   Status: ${results.status.toUpperCase()}`);
    console.log(`   Issues found: ${results.issues.length}`);
    
    return results;
  }

  /**
   * STAGE 2: DIAGNOSE SOURCES
   */
  async diagnoseSources(organizationId) {
    console.log('\n📡 STAGE 2: Checking Sources...');
    
    const results = {
      status: 'checking',
      issues: [],
      workingSources: [],
      failedSources: []
    };
    
    // Test RSS feeds
    const rssFeeds = [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
      { name: 'Reuters Tech', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best' },
      { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF' }
    ];
    
    for (const feed of rssFeeds) {
      try {
        const feedContent = await this.parser.parseURL(feed.url);
        if (feedContent.items && feedContent.items.length > 0) {
          results.workingSources.push({
            type: 'rss',
            name: feed.name,
            url: feed.url,
            itemCount: feedContent.items.length
          });
        }
      } catch (error) {
        results.failedSources.push({
          type: 'rss',
          name: feed.name,
          url: feed.url,
          error: error.message
        });
      }
    }
    
    // Test Google News
    const testQuery = 'technology news';
    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(testQuery)}&hl=en-US&gl=US&ceid=US:en`;
    
    try {
      const googleFeed = await this.parser.parseURL(googleNewsUrl);
      if (googleFeed.items && googleFeed.items.length > 0) {
        results.workingSources.push({
          type: 'google-news',
          name: 'Google News',
          itemCount: googleFeed.items.length
        });
      }
    } catch (error) {
      results.failedSources.push({
        type: 'google-news',
        name: 'Google News',
        error: error.message
      });
      
      results.issues.push({
        severity: 'high',
        issue: 'Google News not accessible',
        fix: 'Check network/firewall settings'
      });
    }
    
    // Check if we have enough working sources
    if (results.workingSources.length === 0) {
      results.issues.push({
        severity: 'critical',
        issue: 'No working news sources',
        fix: 'Critical: Need at least one working source'
      });
      results.status = 'failed';
    } else if (results.workingSources.length < 3) {
      results.issues.push({
        severity: 'medium',
        issue: `Only ${results.workingSources.length} working sources`,
        fix: 'Should have at least 5 working sources'
      });
      results.status = 'warning';
    } else {
      results.status = 'passed';
    }
    
    console.log(`   Working sources: ${results.workingSources.length}`);
    console.log(`   Failed sources: ${results.failedSources.length}`);
    console.log(`   Status: ${results.status.toUpperCase()}`);
    
    return results;
  }

  /**
   * STAGE 3: DIAGNOSE DATA COLLECTION
   */
  async diagnoseDataCollection(organizationId) {
    console.log('\n📥 STAGE 3: Checking Data Collection...');
    
    const results = {
      status: 'checking',
      issues: [],
      articlesCollected: 0,
      lastCollection: null
    };
    
    try {
      // Check if we have recent articles
      const articlesResult = await pool.query(
        `SELECT COUNT(*) as count, MAX(published_date) as latest 
         FROM news_articles 
         WHERE organization_id = $1 
         AND created_at > NOW() - INTERVAL '24 hours'`,
        [organizationId]
      );
      
      results.articlesCollected = parseInt(articlesResult.rows[0].count);
      results.lastCollection = articlesResult.rows[0].latest;
      
      if (results.articlesCollected === 0) {
        results.issues.push({
          severity: 'critical',
          issue: 'No articles collected in last 24 hours',
          fix: 'Run immediate data collection'
        });
        results.status = 'failed';
        
        // Try to collect some data right now
        console.log('   🔄 Attempting immediate collection...');
        const collected = await this.attemptImmediateCollection(organizationId);
        if (collected > 0) {
          results.articlesCollected = collected;
          results.issues[0].fix += ` (Collected ${collected} articles)`;
        }
      } else if (results.articlesCollected < 10) {
        results.issues.push({
          severity: 'medium',
          issue: `Only ${results.articlesCollected} articles collected`,
          fix: 'Increase collection frequency or add sources'
        });
        results.status = 'warning';
      } else {
        results.status = 'passed';
      }
      
    } catch (error) {
      results.status = 'error';
      results.error = error.message;
    }
    
    console.log(`   Articles collected (24h): ${results.articlesCollected}`);
    console.log(`   Status: ${results.status.toUpperCase()}`);
    
    return results;
  }

  /**
   * STAGE 4: DIAGNOSE ANALYSIS
   */
  async diagnoseAnalysis(organizationId) {
    console.log('\n🧠 STAGE 4: Checking Analysis Pipeline...');
    
    const results = {
      status: 'checking',
      issues: [],
      analysisRuns: 0,
      lastAnalysis: null
    };
    
    try {
      // Check if analysis is happening
      const analysisResult = await pool.query(
        `SELECT COUNT(*) as count, MAX(created_at) as latest 
         FROM intelligence_summaries 
         WHERE organization_id = $1 
         AND created_at > NOW() - INTERVAL '24 hours'`,
        [organizationId]
      );
      
      results.analysisRuns = parseInt(analysisResult.rows[0].count);
      results.lastAnalysis = analysisResult.rows[0].latest;
      
      if (results.analysisRuns === 0) {
        results.issues.push({
          severity: 'critical',
          issue: 'No analysis performed in last 24 hours',
          fix: 'Run intelligence analysis immediately'
        });
        results.status = 'failed';
      } else {
        results.status = 'passed';
      }
      
      // Check if Claude API is working
      const claudeTest = await this.testClaudeAPI();
      if (!claudeTest.success) {
        results.issues.push({
          severity: 'critical',
          issue: 'Claude API not working',
          fix: 'Check API key and configuration'
        });
        results.status = 'failed';
      }
      
    } catch (error) {
      results.status = 'error';
      results.error = error.message;
    }
    
    console.log(`   Analysis runs (24h): ${results.analysisRuns}`);
    console.log(`   Status: ${results.status.toUpperCase()}`);
    
    return results;
  }

  /**
   * STAGE 5: DIAGNOSE POPULATION
   */
  async diagnosePopulation(organizationId) {
    console.log('\n💾 STAGE 5: Checking Data Population...');
    
    const results = {
      status: 'checking',
      issues: [],
      tables: {}
    };
    
    const tablesToCheck = [
      'organizations',
      'intelligence_targets',
      'source_configurations',
      'news_articles',
      'intelligence_summaries',
      'opportunity_history'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM ${table} WHERE organization_id = $1`,
          [organizationId]
        );
        
        results.tables[table] = parseInt(result.rows[0].count);
        
        if (results.tables[table] === 0) {
          results.issues.push({
            severity: table === 'organizations' ? 'critical' : 'high',
            issue: `No data in ${table}`,
            fix: `Populate ${table} table`
          });
        }
      } catch (error) {
        // Table might not have organization_id column
        try {
          const globalResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          results.tables[table] = parseInt(globalResult.rows[0].count);
        } catch (e) {
          results.tables[table] = 'error';
        }
      }
    }
    
    results.status = results.issues.filter(i => i.severity === 'critical').length > 0 ? 'failed' :
                     results.issues.length > 2 ? 'warning' : 'passed';
    
    console.log(`   Tables populated: ${Object.values(results.tables).filter(v => v > 0).length}/${tablesToCheck.length}`);
    console.log(`   Status: ${results.status.toUpperCase()}`);
    
    return results;
  }

  /**
   * HELPER: Attempt immediate data collection
   */
  async attemptImmediateCollection(organizationId) {
    let collected = 0;
    
    try {
      // Try to collect from TechCrunch
      const feed = await this.parser.parseURL('https://techcrunch.com/feed/');
      
      for (const item of feed.items.slice(0, 10)) {
        await pool.query(
          `INSERT INTO news_articles (organization_id, title, url, content, source, published_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (url) DO NOTHING`,
          [
            organizationId,
            item.title,
            item.link,
            item.contentSnippet || item.content || '',
            'TechCrunch',
            item.pubDate || new Date()
          ]
        );
        collected++;
      }
    } catch (error) {
      console.log('   ⚠️ Immediate collection failed:', error.message);
    }
    
    return collected;
  }

  /**
   * HELPER: Test Claude API
   */
  async testClaudeAPI() {
    try {
      const claudeService = require('../../config/claude');
      const response = await claudeService.sendMessage('Test: respond with "OK"', {
        max_tokens: 10
      });
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate comprehensive fix strategy
   */
  generateFixStrategy(report) {
    const strategy = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      automatedFixes: []
    };
    
    // Analyze all issues and create fix priority
    for (const stage of Object.values(report.stages)) {
      if (stage.issues) {
        stage.issues.forEach(issue => {
          if (issue.severity === 'critical') {
            strategy.immediate.push({
              stage: stage,
              issue: issue.issue,
              fix: issue.fix,
              automated: this.canAutomate(issue)
            });
          } else if (issue.severity === 'high') {
            strategy.shortTerm.push({
              issue: issue.issue,
              fix: issue.fix
            });
          } else {
            strategy.longTerm.push({
              issue: issue.issue,
              fix: issue.fix
            });
          }
        });
      }
    }
    
    return strategy;
  }

  /**
   * Check if a fix can be automated
   */
  canAutomate(issue) {
    const automatableFixes = [
      'Create organization record',
      'Add competitors and topics',
      'Run source discovery',
      'Run immediate data collection',
      'Run intelligence analysis'
    ];
    
    return automatableFixes.some(fix => issue.fix.includes(fix));
  }

  /**
   * Save diagnostic report
   */
  async saveDiagnosticReport(report) {
    try {
      const filePath = path.join(
        __dirname,
        '../diagnostics',
        `diagnostic_${report.organizationId}_${Date.now()}.json`
      );
      
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      
      console.log(`\n📄 Diagnostic report saved: ${filePath}`);
    } catch (error) {
      console.error('Failed to save diagnostic report:', error);
    }
  }

  /**
   * AUTO-FIX: Attempt to fix critical issues automatically
   */
  async autoFix(organizationId, report) {
    console.log('\n🔧 ATTEMPTING AUTO-FIX...');
    console.log('========================\n');
    
    const fixes = {
      attempted: [],
      successful: [],
      failed: []
    };
    
    // Fix 1: Create organization if missing
    if (report.stages.configuration.status === 'failed') {
      console.log('🔧 Fixing: Organization configuration...');
      try {
        await this.fixOrganization(organizationId);
        fixes.successful.push('Organization configuration');
      } catch (error) {
        fixes.failed.push({ fix: 'Organization configuration', error: error.message });
      }
    }
    
    // Fix 2: Add default intelligence targets
    if (report.stages.configuration.data.targets?.length === 0) {
      console.log('🔧 Fixing: Adding default intelligence targets...');
      try {
        await this.addDefaultTargets(organizationId);
        fixes.successful.push('Intelligence targets');
      } catch (error) {
        fixes.failed.push({ fix: 'Intelligence targets', error: error.message });
      }
    }
    
    // Fix 3: Configure sources
    if (report.stages.sources.workingSources.length > 0) {
      console.log('🔧 Fixing: Configuring news sources...');
      try {
        await this.configureWorkingSources(organizationId, report.stages.sources.workingSources);
        fixes.successful.push('Source configuration');
      } catch (error) {
        fixes.failed.push({ fix: 'Source configuration', error: error.message });
      }
    }
    
    // Fix 4: Collect initial data
    if (report.stages.collection.articlesCollected === 0) {
      console.log('🔧 Fixing: Collecting initial data...');
      try {
        const collected = await this.collectInitialData(organizationId);
        fixes.successful.push(`Data collection (${collected} articles)`);
      } catch (error) {
        fixes.failed.push({ fix: 'Data collection', error: error.message });
      }
    }
    
    console.log('\n✅ Auto-fix Results:');
    console.log(`   Successful: ${fixes.successful.length}`);
    console.log(`   Failed: ${fixes.failed.length}`);
    
    return fixes;
  }

  /**
   * Fix organization configuration
   */
  async fixOrganization(organizationId) {
    await pool.query(
      `INSERT INTO organizations (id, name, industry, description, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
      [
        organizationId,
        organizationId, // Will be updated later
        'Technology',
        'Auto-created organization',
      ]
    );
  }

  /**
   * Add default intelligence targets
   */
  async addDefaultTargets(organizationId) {
    const defaultTargets = [
      { name: 'Microsoft', type: 'competitor', priority: 'high' },
      { name: 'Google', type: 'competitor', priority: 'high' },
      { name: 'Amazon', type: 'competitor', priority: 'medium' },
      { name: 'Artificial Intelligence', type: 'topic', priority: 'high' },
      { name: 'Digital Transformation', type: 'topic', priority: 'high' },
      { name: 'Cybersecurity', type: 'topic', priority: 'medium' }
    ];
    
    for (const target of defaultTargets) {
      await pool.query(
        `INSERT INTO intelligence_targets (organization_id, name, type, priority, active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING`,
        [organizationId, target.name, target.type, target.priority]
      );
    }
  }

  /**
   * Configure working sources
   */
  async configureWorkingSources(organizationId, workingSources) {
    for (const source of workingSources) {
      await pool.query(
        `INSERT INTO source_configurations (organization_id, source_type, source_name, configuration, active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING`,
        [
          organizationId,
          source.type,
          source.name,
          JSON.stringify({ url: source.url, verified: true })
        ]
      );
    }
  }

  /**
   * Collect initial data
   */
  async collectInitialData(organizationId) {
    let totalCollected = 0;
    
    const feeds = [
      'https://techcrunch.com/feed/',
      'https://feeds.feedburner.com/venturebeat/SZYF',
      'https://www.engadget.com/rss.xml'
    ];
    
    for (const feedUrl of feeds) {
      try {
        const feed = await this.parser.parseURL(feedUrl);
        const items = feed.items.slice(0, 5); // Get 5 from each
        
        for (const item of items) {
          await pool.query(
            `INSERT INTO news_articles (organization_id, title, url, content, source, published_date)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (url) DO NOTHING`,
            [
              organizationId,
              item.title,
              item.link,
              item.contentSnippet || '',
              feed.title || 'Unknown',
              item.pubDate || new Date()
            ]
          );
          totalCollected++;
        }
      } catch (error) {
        console.log(`   Failed to collect from ${feedUrl}`);
      }
    }
    
    return totalCollected;
  }
}

module.exports = MonitoringDiagnosticService;