/**
 * STRATEGIC MONITORING COORDINATOR
 * A complete rethink of how monitoring should work with proper agent utilization
 */

const pool = require('../config/db');
const Parser = require('rss-parser');
const axios = require('axios');
const MonitoringDiagnosticService = require('./MonitoringDiagnosticService');
const OpportunityEngineOrchestrator = require('../agents/opportunity/OpportunityEngineOrchestration');

class StrategicMonitoringCoordinator {
  constructor() {
    this.diagnostic = new MonitoringDiagnosticService();
    this.orchestrator = new OpportunityEngineOrchestrator();
    this.parser = new Parser({ timeout: 10000 });
    
    // Strategic configuration
    this.strategy = {
      phases: {
        setup: { status: 'pending', agents: ['task-decomposition-expert'] },
        discovery: { status: 'pending', agents: ['search-specialist'] },
        collection: { status: 'pending', agents: ['data-analyst'] },
        analysis: { status: 'pending', agents: ['research-orchestrator'] },
        synthesis: { status: 'pending', agents: ['report-generator'] },
        opportunities: { status: 'pending', agents: ['research-optimizer'] }
      }
    };
  }

  /**
   * MAIN STRATEGIC MONITORING FLOW
   * This is the complete, working pipeline that ensures everything flows correctly
   */
  async runStrategicMonitoring(organizationId) {
    console.log('\n🎯 STRATEGIC MONITORING COORDINATOR');
    console.log('=====================================');
    console.log('Organization:', organizationId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=====================================\n');
    
    const results = {
      organizationId,
      timestamp: new Date().toISOString(),
      phases: {},
      data: {},
      success: false
    };
    
    try {
      // PHASE 0: Diagnostic & Auto-Fix
      console.log('🔍 PHASE 0: System Diagnostic & Repair');
      console.log('---------------------------------------');
      const diagnostic = await this.diagnostic.runCompleteDiagnostic(organizationId);
      
      // Auto-fix critical issues
      if (this.hasCriticalIssues(diagnostic)) {
        console.log('🔧 Critical issues detected. Running auto-fix...');
        await this.diagnostic.autoFix(organizationId, diagnostic);
        
        // Re-run diagnostic to verify fixes
        const verifyDiagnostic = await this.diagnostic.runCompleteDiagnostic(organizationId);
        if (this.hasCriticalIssues(verifyDiagnostic)) {
          throw new Error('Critical issues persist after auto-fix. Manual intervention required.');
        }
      }
      
      results.phases.diagnostic = { status: 'completed', issues: diagnostic.stages };
      
      // PHASE 1: Strategic Setup (Using Task Decomposition Expert)
      console.log('\n📋 PHASE 1: Strategic Setup');
      console.log('---------------------------');
      const setup = await this.setupMonitoring(organizationId);
      results.phases.setup = setup;
      results.data.configuration = setup.configuration;
      
      // PHASE 2: Source Discovery (Using Search Specialist)
      console.log('\n🔍 PHASE 2: Source Discovery');
      console.log('----------------------------');
      const sources = await this.discoverSources(results.data.configuration);
      results.phases.discovery = sources;
      results.data.sources = sources.discovered;
      
      // PHASE 3: Data Collection (Using Data Analyst)
      console.log('\n📥 PHASE 3: Data Collection');
      console.log('---------------------------');
      const collected = await this.collectData(organizationId, sources.discovered);
      results.phases.collection = collected;
      results.data.articles = collected.articles;
      
      // PHASE 4: Intelligence Analysis (Using Research Orchestrator)
      console.log('\n🧠 PHASE 4: Intelligence Analysis');
      console.log('---------------------------------');
      const analysis = await this.analyzeIntelligence(organizationId, collected.articles);
      results.phases.analysis = analysis;
      results.data.intelligence = analysis.intelligence;
      
      // PHASE 5: Synthesis (Using Report Generator)
      console.log('\n📊 PHASE 5: Intelligence Synthesis');
      console.log('----------------------------------');
      const synthesis = await this.synthesizeIntelligence(analysis.intelligence);
      results.phases.synthesis = synthesis;
      results.data.summary = synthesis.summary;
      
      // PHASE 6: Opportunity Discovery (Using Research Optimizer)
      console.log('\n💡 PHASE 6: Opportunity Discovery');
      console.log('---------------------------------');
      const opportunities = await this.discoverOpportunities(organizationId, results.data);
      results.phases.opportunities = opportunities;
      results.data.opportunities = opportunities.discovered;
      
      // Save everything to database
      await this.saveMonitoringResults(organizationId, results);
      
      results.success = true;
      
      // Generate summary
      console.log('\n✅ MONITORING COMPLETE');
      console.log('======================');
      console.log(`📊 Articles collected: ${collected.articles.length}`);
      console.log(`🧠 Intelligence points: ${Object.keys(analysis.intelligence).length}`);
      console.log(`💡 Opportunities found: ${opportunities.discovered.length}`);
      console.log('======================\n');
      
    } catch (error) {
      console.error('\n❌ STRATEGIC MONITORING FAILED');
      console.error('Error:', error.message);
      results.error = error.message;
      results.success = false;
    }
    
    return results;
  }

  /**
   * PHASE 1: Setup Monitoring Strategy
   */
  async setupMonitoring(organizationId) {
    console.log('   🤖 Deploying Task Decomposition Expert...');
    
    // Get organization context
    const context = await this.getOrganizationContext(organizationId);
    
    // Use task decomposition expert to plan monitoring strategy
    const strategy = await this.orchestrator.deployAgent(
      'task-decomposition-expert',
      'Create comprehensive monitoring strategy for PR intelligence',
      {
        organization: context.organization,
        competitors: context.competitors,
        topics: context.topics,
        objectives: [
          'Monitor competitive landscape',
          'Track industry trends',
          'Identify PR opportunities',
          'Detect narrative vacuums'
        ]
      }
    );
    
    // Build configuration from strategy
    const configuration = {
      organization: context.organization,
      competitors: context.competitors || [],
      topics: context.topics || [],
      keywords: this.extractKeywords(context),
      searchQueries: this.buildSearchQueries(context),
      updateFrequency: '1 hour',
      depth: 'comprehensive'
    };
    
    // Ensure we have minimum viable configuration
    if (configuration.competitors.length === 0) {
      console.log('   ⚠️ No competitors found. Adding defaults...');
      configuration.competitors = await this.addDefaultCompetitors(organizationId);
    }
    
    if (configuration.topics.length === 0) {
      console.log('   ⚠️ No topics found. Adding defaults...');
      configuration.topics = await this.addDefaultTopics(organizationId);
    }
    
    console.log('   ✅ Configuration ready');
    console.log(`      - Competitors: ${configuration.competitors.length}`);
    console.log(`      - Topics: ${configuration.topics.length}`);
    console.log(`      - Keywords: ${configuration.keywords.length}`);
    
    return {
      status: 'completed',
      configuration,
      strategy: strategy.phases || []
    };
  }

  /**
   * PHASE 2: Discover Sources
   */
  async discoverSources(configuration) {
    console.log('   🤖 Deploying Search Specialist...');
    
    // Use search specialist to find relevant sources
    const sourceDiscovery = await this.orchestrator.deployAgent(
      'search-specialist',
      'Find high-quality news sources for monitoring',
      {
        industry: configuration.organization?.industry || 'Technology',
        competitors: configuration.competitors.map(c => c.name),
        topics: configuration.topics.map(t => t.name),
        requirements: [
          'RSS feeds available',
          'Updated frequently',
          'Authoritative sources',
          'Industry-specific publications'
        ]
      }
    );
    
    // Start with guaranteed working sources
    const guaranteedSources = [
      { type: 'rss', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
      { type: 'rss', name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', category: 'tech' },
      { type: 'rss', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
      { type: 'rss', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'tech' },
      { type: 'rss', name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'tech' }
    ];
    
    // Add Google News feeds for each competitor
    const googleNewsFeeds = configuration.competitors.map(competitor => ({
      type: 'google-news',
      name: `Google News - ${competitor.name}`,
      url: `https://news.google.com/rss/search?q="${encodeURIComponent(competitor.name)}"&hl=en-US&gl=US&ceid=US:en`,
      category: 'competitor'
    }));
    
    // Add topic-based feeds
    const topicFeeds = configuration.topics.map(topic => ({
      type: 'google-news',
      name: `Google News - ${topic.name}`,
      url: `https://news.google.com/rss/search?q="${encodeURIComponent(topic.name)}"&hl=en-US&gl=US&ceid=US:en`,
      category: 'topic'
    }));
    
    // Combine all sources
    const allSources = [
      ...guaranteedSources,
      ...googleNewsFeeds.slice(0, 5), // Limit to 5 competitor feeds
      ...topicFeeds.slice(0, 5) // Limit to 5 topic feeds
    ];
    
    // Test each source
    const workingSources = [];
    const failedSources = [];
    
    for (const source of allSources) {
      try {
        const feed = await this.parser.parseURL(source.url);
        if (feed.items && feed.items.length > 0) {
          workingSources.push({
            ...source,
            itemCount: feed.items.length,
            lastUpdate: feed.items[0].pubDate || new Date()
          });
          console.log(`   ✅ ${source.name}: ${feed.items.length} items`);
        }
      } catch (error) {
        failedSources.push({ ...source, error: error.message });
        console.log(`   ❌ ${source.name}: Failed`);
      }
    }
    
    // Save source configuration
    await this.saveSourceConfiguration(configuration.organization.id, workingSources);
    
    console.log(`   📡 Sources discovered: ${workingSources.length} working, ${failedSources.length} failed`);
    
    return {
      status: 'completed',
      discovered: workingSources,
      failed: failedSources
    };
  }

  /**
   * PHASE 3: Collect Data
   */
  async collectData(organizationId, sources) {
    console.log('   🤖 Deploying Data Analyst for collection...');
    
    const articles = [];
    const errors = [];
    
    // Collect from each source
    for (const source of sources) {
      try {
        console.log(`   📥 Collecting from ${source.name}...`);
        const feed = await this.parser.parseURL(source.url);
        
        // Process articles
        const items = feed.items.slice(0, 10); // Get up to 10 from each source
        
        for (const item of items) {
          const article = {
            title: item.title,
            url: item.link,
            content: item.contentSnippet || item.content || '',
            source: source.name,
            sourceType: source.type,
            category: source.category,
            publishedDate: item.pubDate || item.isoDate || new Date(),
            guid: item.guid || item.link
          };
          
          // Save to database
          try {
            const result = await pool.query(
              `INSERT INTO news_articles 
               (organization_id, title, url, content, source, source_type, category, published_date, guid)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (url) DO UPDATE SET updated_at = NOW()
               RETURNING id`,
              [
                organizationId,
                article.title,
                article.url,
                article.content,
                article.source,
                article.sourceType,
                article.category,
                article.publishedDate,
                article.guid
              ]
            );
            
            article.id = result.rows[0].id;
            articles.push(article);
          } catch (dbError) {
            errors.push({ article: article.title, error: dbError.message });
          }
        }
        
        console.log(`      ✓ Collected ${items.length} articles`);
        
      } catch (error) {
        errors.push({ source: source.name, error: error.message });
        console.log(`      ✗ Failed: ${error.message}`);
      }
    }
    
    console.log(`   📊 Total collected: ${articles.length} articles`);
    
    return {
      status: articles.length > 0 ? 'completed' : 'failed',
      articles,
      errors,
      stats: {
        total: articles.length,
        bySource: this.groupBySource(articles),
        byCategory: this.groupByCategory(articles)
      }
    };
  }

  /**
   * PHASE 4: Analyze Intelligence
   */
  async analyzeIntelligence(organizationId, articles) {
    console.log('   🤖 Deploying Research Orchestrator for analysis...');
    
    if (articles.length === 0) {
      return {
        status: 'failed',
        intelligence: {},
        error: 'No articles to analyze'
      };
    }
    
    // Group articles for analysis
    const grouped = {
      competitor: articles.filter(a => a.category === 'competitor'),
      topic: articles.filter(a => a.category === 'topic'),
      general: articles.filter(a => a.category === 'tech' || !a.category)
    };
    
    // Use research orchestrator to analyze
    const analysis = await this.orchestrator.deployAgent(
      'research-orchestrator',
      'Analyze news articles for intelligence insights',
      {
        articles: articles.slice(0, 50), // Limit for API
        objectives: [
          'Identify competitive movements',
          'Detect emerging trends',
          'Find narrative gaps',
          'Assess market sentiment'
        ]
      }
    );
    
    // Extract intelligence points
    const intelligence = {
      competitorActivity: this.extractCompetitorActivity(grouped.competitor),
      emergingTrends: this.extractTrends(grouped.topic),
      narrativeGaps: this.identifyNarrativeGaps(articles),
      marketSentiment: this.assessSentiment(articles),
      keyInsights: analysis.insights || [],
      timestamp: new Date().toISOString()
    };
    
    // Save intelligence summary
    await this.saveIntelligenceSummary(organizationId, intelligence);
    
    console.log(`   ✅ Intelligence extracted:`);
    console.log(`      - Competitor activities: ${intelligence.competitorActivity.length}`);
    console.log(`      - Emerging trends: ${intelligence.emergingTrends.length}`);
    console.log(`      - Narrative gaps: ${intelligence.narrativeGaps.length}`);
    
    return {
      status: 'completed',
      intelligence,
      analysis: analysis
    };
  }

  /**
   * PHASE 5: Synthesize Intelligence
   */
  async synthesizeIntelligence(intelligence) {
    console.log('   🤖 Deploying Report Generator for synthesis...');
    
    // Use report generator to create executive summary
    const synthesis = await this.orchestrator.deployAgent(
      'report-generator',
      'Create executive intelligence summary',
      intelligence
    );
    
    const summary = {
      headline: this.generateHeadline(intelligence),
      keyFindings: [
        ...intelligence.keyInsights.slice(0, 3),
        `${intelligence.competitorActivity.length} competitor movements detected`,
        `${intelligence.emergingTrends.length} emerging trends identified`,
        `${intelligence.narrativeGaps.length} narrative opportunities found`
      ],
      competitorHighlights: intelligence.competitorActivity.slice(0, 3),
      trendHighlights: intelligence.emergingTrends.slice(0, 3),
      opportunities: intelligence.narrativeGaps.slice(0, 3),
      sentiment: intelligence.marketSentiment,
      recommendations: synthesis.recommendations || [],
      generatedAt: new Date().toISOString()
    };
    
    console.log('   ✅ Synthesis complete');
    
    return {
      status: 'completed',
      summary,
      fullReport: synthesis
    };
  }

  /**
   * PHASE 6: Discover Opportunities
   */
  async discoverOpportunities(organizationId, data) {
    console.log('   🤖 Deploying Research Optimizer for opportunities...');
    
    // Prepare data for opportunity discovery
    const opportunityData = {
      intelligence: data.intelligence,
      articles: data.articles,
      summary: data.summary,
      organization: data.configuration.organization,
      competitors: data.configuration.competitors,
      topics: data.configuration.topics
    };
    
    // Use the full orchestrator for opportunity discovery
    await this.orchestrator.initialize();
    const opportunities = await this.orchestrator.discoverOpportunities(opportunityData);
    
    // Save opportunities
    for (const opp of opportunities.opportunities) {
      await pool.query(
        `INSERT INTO opportunity_history 
         (organization_id, title, type, score, execution_plan, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          organizationId,
          opp.title,
          opp.type,
          opp.totalScore || 0,
          JSON.stringify(opp.executionPlan)
        ]
      );
    }
    
    console.log(`   ✅ Opportunities discovered: ${opportunities.opportunities.length}`);
    
    return {
      status: 'completed',
      discovered: opportunities.opportunities,
      metadata: opportunities.metadata
    };
  }

  /**
   * HELPER FUNCTIONS
   */
  
  hasCriticalIssues(diagnostic) {
    return Object.values(diagnostic.stages).some(stage => 
      stage.issues && stage.issues.some(issue => issue.severity === 'critical')
    );
  }
  
  async getOrganizationContext(organizationId) {
    try {
      const orgResult = await pool.query(
        'SELECT * FROM organizations WHERE id = $1 OR name = $1',
        [organizationId]
      );
      
      const competitorResult = await pool.query(
        `SELECT * FROM intelligence_targets 
         WHERE organization_id = $1 AND type = 'competitor' AND active = true`,
        [organizationId]
      );
      
      const topicResult = await pool.query(
        `SELECT * FROM intelligence_targets 
         WHERE organization_id = $1 AND type = 'topic' AND active = true`,
        [organizationId]
      );
      
      return {
        organization: orgResult.rows[0] || { id: organizationId, name: organizationId },
        competitors: competitorResult.rows,
        topics: topicResult.rows
      };
    } catch (error) {
      console.error('Error getting context:', error);
      return {
        organization: { id: organizationId },
        competitors: [],
        topics: []
      };
    }
  }
  
  extractKeywords(context) {
    const keywords = [];
    
    if (context.organization?.name && !context.organization.name.startsWith('org-')) {
      keywords.push(context.organization.name);
    }
    
    context.competitors?.forEach(c => {
      if (c.name) keywords.push(c.name);
    });
    
    context.topics?.forEach(t => {
      if (t.name) keywords.push(t.name);
    });
    
    return [...new Set(keywords)];
  }
  
  buildSearchQueries(context) {
    const queries = [];
    
    // Competitor queries
    context.competitors?.forEach(c => {
      queries.push(`"${c.name}" announcement OR launch OR partnership`);
    });
    
    // Topic queries
    context.topics?.forEach(t => {
      queries.push(`"${t.name}" trends OR innovation OR breakthrough`);
    });
    
    return queries;
  }
  
  async addDefaultCompetitors(organizationId) {
    const defaults = [
      { name: 'Microsoft', priority: 'high' },
      { name: 'Google', priority: 'high' },
      { name: 'Amazon', priority: 'medium' }
    ];
    
    for (const comp of defaults) {
      await pool.query(
        `INSERT INTO intelligence_targets (organization_id, name, type, priority, active)
         VALUES ($1, $2, 'competitor', $3, true)
         ON CONFLICT DO NOTHING`,
        [organizationId, comp.name, comp.priority]
      );
    }
    
    return defaults;
  }
  
  async addDefaultTopics(organizationId) {
    const defaults = [
      { name: 'Artificial Intelligence', priority: 'high' },
      { name: 'Digital Transformation', priority: 'high' },
      { name: 'Cybersecurity', priority: 'medium' }
    ];
    
    for (const topic of defaults) {
      await pool.query(
        `INSERT INTO intelligence_targets (organization_id, name, type, priority, active)
         VALUES ($1, $2, 'topic', $3, true)
         ON CONFLICT DO NOTHING`,
        [organizationId, topic.name, topic.priority]
      );
    }
    
    return defaults;
  }
  
  async saveSourceConfiguration(organizationId, sources) {
    for (const source of sources) {
      await pool.query(
        `INSERT INTO source_configurations 
         (organization_id, source_type, source_name, configuration, active, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())
         ON CONFLICT (organization_id, source_name) 
         DO UPDATE SET configuration = $4, updated_at = NOW()`,
        [
          organizationId,
          source.type,
          source.name,
          JSON.stringify({
            url: source.url,
            category: source.category,
            itemCount: source.itemCount,
            verified: true
          })
        ]
      );
    }
  }
  
  groupBySource(articles) {
    const grouped = {};
    articles.forEach(a => {
      grouped[a.source] = (grouped[a.source] || 0) + 1;
    });
    return grouped;
  }
  
  groupByCategory(articles) {
    const grouped = {};
    articles.forEach(a => {
      grouped[a.category] = (grouped[a.category] || 0) + 1;
    });
    return grouped;
  }
  
  extractCompetitorActivity(articles) {
    const activities = [];
    
    articles.forEach(article => {
      if (article.title.match(/launch|announce|partner|acquire|expand/i)) {
        activities.push({
          competitor: article.source.replace('Google News - ', ''),
          activity: article.title,
          date: article.publishedDate,
          url: article.url
        });
      }
    });
    
    return activities;
  }
  
  extractTrends(articles) {
    const trends = [];
    const trendKeywords = ['growing', 'emerging', 'trend', 'shift', 'transformation', 'adoption'];
    
    articles.forEach(article => {
      const hasKeyword = trendKeywords.some(kw => 
        article.title.toLowerCase().includes(kw) || 
        article.content.toLowerCase().includes(kw)
      );
      
      if (hasKeyword) {
        trends.push({
          trend: article.title,
          source: article.source,
          date: article.publishedDate,
          strength: 0.7 // Would calculate based on multiple signals
        });
      }
    });
    
    return trends;
  }
  
  identifyNarrativeGaps(articles) {
    const gaps = [];
    
    // Simple gap detection - would be more sophisticated
    const topicCoverage = {};
    
    articles.forEach(article => {
      const topics = this.extractTopics(article);
      topics.forEach(topic => {
        topicCoverage[topic] = (topicCoverage[topic] || 0) + 1;
      });
    });
    
    // Find under-covered topics
    Object.entries(topicCoverage).forEach(([topic, count]) => {
      if (count < 3) {
        gaps.push({
          topic,
          coverage: count,
          opportunity: `Low coverage on ${topic} presents narrative opportunity`,
          confidence: 0.7
        });
      }
    });
    
    return gaps;
  }
  
  extractTopics(article) {
    // Simplified topic extraction
    const topics = [];
    const topicKeywords = {
      'AI': ['artificial intelligence', 'machine learning', 'neural', 'ai'],
      'Cloud': ['cloud', 'aws', 'azure', 'saas'],
      'Security': ['security', 'cyber', 'breach', 'privacy'],
      'Mobile': ['mobile', 'ios', 'android', 'app'],
      'Data': ['data', 'analytics', 'database', 'big data']
    };
    
    const text = `${article.title} ${article.content}`.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
  
  assessSentiment(articles) {
    // Simplified sentiment assessment
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    const positiveWords = ['success', 'growth', 'innovation', 'breakthrough', 'leading'];
    const negativeWords = ['failure', 'decline', 'problem', 'issue', 'concern'];
    
    articles.forEach(article => {
      const text = `${article.title} ${article.content}`.toLowerCase();
      
      const hasPositive = positiveWords.some(w => text.includes(w));
      const hasNegative = negativeWords.some(w => text.includes(w));
      
      if (hasPositive && !hasNegative) positive++;
      else if (hasNegative && !hasPositive) negative++;
      else neutral++;
    });
    
    const total = articles.length;
    
    return {
      positive: positive / total,
      negative: negative / total,
      neutral: neutral / total,
      overall: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral'
    };
  }
  
  async saveIntelligenceSummary(organizationId, intelligence) {
    await pool.query(
      `INSERT INTO intelligence_summaries 
       (organization_id, summary_data, created_at)
       VALUES ($1, $2, NOW())`,
      [organizationId, JSON.stringify(intelligence)]
    );
  }
  
  generateHeadline(intelligence) {
    if (intelligence.narrativeGaps.length > 0) {
      return `${intelligence.narrativeGaps.length} PR Opportunities Identified`;
    } else if (intelligence.competitorActivity.length > 0) {
      return `${intelligence.competitorActivity.length} Competitor Movements Detected`;
    } else if (intelligence.emergingTrends.length > 0) {
      return `${intelligence.emergingTrends.length} Emerging Trends to Watch`;
    }
    return 'Intelligence Update Available';
  }
  
  async saveMonitoringResults(organizationId, results) {
    try {
      await pool.query(
        `INSERT INTO monitoring_runs 
         (organization_id, results, success, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [organizationId, JSON.stringify(results), results.success]
      );
    } catch (error) {
      console.error('Failed to save monitoring results:', error);
    }
  }
}

module.exports = StrategicMonitoringCoordinator;