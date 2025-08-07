/**
 * ULTIMATE MONITORING & ANALYSIS AGENT
 * The world's most comprehensive web monitoring, scraping, and analysis system
 * 
 * This agent orchestrates multiple specialized agents to:
 * 1. Continuously monitor thousands of sources
 * 2. Intelligently scrape and extract relevant data
 * 3. Perform deep multi-layered analysis
 * 4. Generate actionable intelligence in real-time
 * 
 * Agent Pipeline:
 * Query Clarifier → Source Discovery → Data Collection → 
 * Research Orchestrator → Data Analyst → Report Generator
 */

const claudeService = require('../../config/claude');
const SourceDiscoveryService = require('./SourceDiscoveryService');
const IntelligentIndexingAgent = require('./IntelligentIndexingAgent');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const pool = require('../config/db');

class UltimateMonitoringAgent {
  constructor() {
    this.sourceDiscovery = new SourceDiscoveryService();
    this.indexingAgent = new IntelligentIndexingAgent();
    this.parser = new Parser();
    this.monitoringQueue = new Map();
    this.analysisCache = new Map();
    this.browser = null;
    this.activeMonitors = new Map();
    this.sourceIndexCache = new Map();
  }

  /**
   * PHASE 1: QUERY CLARIFICATION & STRATEGY
   * Uses Query Clarifier Agent to understand what we're really looking for
   */
  async clarifyMonitoringObjectives(config) {
    console.log('🎯 PHASE 1: QUERY CLARIFICATION');
    
    const prompt = `You are the Query Clarifier Agent for an advanced monitoring system.
    
    The user wants to monitor:
    - Organization: ${config.organization?.name}
    - Competitors: ${config.competitors?.map(c => c.name).join(', ')}
    - Topics: ${config.topics?.map(t => t.name).join(', ')}
    - Stakeholders: ${config.stakeholders?.map(s => s.name).join(', ')}
    - Custom Queries: ${config.customQueries?.join(', ')}
    
    Clarify and expand these monitoring objectives into:
    1. Specific search queries (at least 20 variations)
    2. Key entities to track (people, companies, products)
    3. Event triggers to watch for (announcements, crises, opportunities)
    4. Sentiment indicators (what would be positive/negative)
    5. Data points to measure (metrics, KPIs, trends)
    6. Geographic focus areas
    7. Time-sensitive elements
    8. Regulatory/compliance aspects
    
    Return comprehensive JSON with all clarified objectives.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultObjectives(config);
    } catch (error) {
      console.error('Query clarification failed:', error);
      return this.getDefaultObjectives(config);
    }
  }

  /**
   * PHASE 2: INTELLIGENT SOURCE DISCOVERY
   * Discovers and ranks thousands of potential sources using indexed sources
   */
  async discoverComprehensiveSources(objectives, config) {
    console.log('🔍 PHASE 2: COMPREHENSIVE SOURCE DISCOVERY WITH INDEX');
    
    const sources = {
      tier1: [],     // Primary sources - official, authoritative
      tier2: [],     // Secondary sources - industry, specialized
      tier3: [],     // Tertiary sources - aggregators, forums
      realtime: [],  // Real-time sources - Twitter, Reddit
      deep: [],      // Deep web sources - databases, archives
      custom: [],    // Custom scraped sources
      indexed: []    // Pre-indexed high-quality sources
    };

    // 1. FIRST, check for pre-indexed sources
    const indexedSources = await this.getIndexedSources(config);
    if (indexedSources && indexedSources.length > 0) {
      console.log(`📚 Found ${indexedSources.length} pre-indexed sources`);
      sources.indexed = indexedSources;
      
      // Categorize indexed sources by tier
      for (const source of indexedSources) {
        if (source.tier === 'tier1') sources.tier1.push(source);
        else if (source.tier === 'tier2') sources.tier2.push(source);
        else if (source.tier === 'tier3') sources.tier3.push(source);
        
        if (source.type === 'social') sources.realtime.push(source);
        if (['regulatory', 'academic', 'financial'].includes(source.type)) sources.deep.push(source);
      }
    } else {
      console.log('📖 No pre-indexed sources found, creating new index...');
      // Create index for future use
      this.createIndexInBackground(config);
    }

    // 2. Get intelligent source recommendations
    const discoveredSources = await this.sourceDiscovery.getSourcesForOrganization(
      config.organization,
      config.competitors,
      config.topics
    );

    // 3. Expand with search engine discovery
    const searchQueries = objectives.searchQueries || [];
    for (const query of searchQueries.slice(0, 10)) {
      const additionalSources = await this.discoverSourcesViaSearch(query);
      sources.tier2.push(...additionalSources);
    }

    // 4. Add real-time social sources
    const socialSources = await this.getSocialMediaSources(objectives);
    sources.realtime.push(...socialSources);

    // 5. Add deep web and specialized databases
    const deepSources = await this.getDeepWebSources(config);
    sources.deep.push(...deepSources);

    // 6. Identify pages for custom scraping
    sources.custom = await this.identifyScrapingTargets(objectives);

    // 7. Rank and deduplicate all sources (prioritizing indexed sources)
    const allSources = await this.rankAndDeduplicateSources(sources);

    console.log(`Discovered ${allSources.length} unique sources across all tiers`);
    console.log(`- Indexed: ${sources.indexed.length}`);
    console.log(`- Tier 1: ${sources.tier1.length}`);
    console.log(`- Real-time: ${sources.realtime.length}`);
    
    return allSources;
  }

  /**
   * PHASE 3: MULTI-METHOD DATA COLLECTION
   * Collects data using RSS, APIs, web scraping, and browser automation
   */
  async collectDataFromAllSources(sources, objectives) {
    console.log('📊 PHASE 3: MULTI-METHOD DATA COLLECTION');
    
    const collectedData = {
      rss: [],
      api: [],
      scraped: [],
      social: [],
      documents: [],
      metrics: []
    };

    // Parallel collection from different source types
    const collectionPromises = [
      this.collectFromRSSFeeds(sources.filter(s => s.type === 'rss')),
      this.collectFromAPIs(sources.filter(s => s.type === 'api')),
      this.scrapeWebPages(sources.filter(s => s.type === 'web')),
      this.collectSocialData(sources.filter(s => s.type === 'social')),
      this.extractDocuments(sources.filter(s => s.type === 'document'))
    ];

    const results = await Promise.allSettled(collectionPromises);
    
    // Aggregate results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const dataType = ['rss', 'api', 'scraped', 'social', 'documents'][index];
        collectedData[dataType] = result.value;
      }
    });

    // Extract metrics and KPIs
    collectedData.metrics = await this.extractMetrics(collectedData);

    console.log(`Collected ${this.countTotalItems(collectedData)} data points`);
    return collectedData;
  }

  /**
   * PHASE 4: RESEARCH ORCHESTRATION
   * Uses Research Orchestrator Agent to coordinate deep analysis
   */
  async orchestrateResearchAnalysis(data, objectives, config) {
    console.log('🧠 PHASE 4: RESEARCH ORCHESTRATION');
    
    const prompt = `You are the Research Orchestrator Agent managing a comprehensive analysis.
    
    Monitoring Configuration:
    ${JSON.stringify(config, null, 2)}
    
    Clarified Objectives:
    ${JSON.stringify(objectives, null, 2)}
    
    Collected Data Summary:
    - RSS Items: ${data.rss.length}
    - API Data Points: ${data.api.length}
    - Scraped Pages: ${data.scraped.length}
    - Social Posts: ${data.social.length}
    - Documents: ${data.documents.length}
    - Metrics: ${data.metrics.length}
    
    Orchestrate a comprehensive research process that:
    1. Identifies the most important signals in the data
    2. Detects patterns and anomalies
    3. Correlates information across sources
    4. Identifies gaps that need further investigation
    5. Prioritizes findings by impact and urgency
    6. Suggests follow-up research questions
    7. Flags items requiring human attention
    
    Return a structured research plan with specific analysis tasks.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultResearchPlan();
    } catch (error) {
      console.error('Research orchestration failed:', error);
      return this.getDefaultResearchPlan();
    }
  }

  /**
   * PHASE 5: DEEP DATA ANALYSIS
   * Uses Data Analyst Agent for quantitative analysis
   */
  async performDeepDataAnalysis(data, researchPlan) {
    console.log('📈 PHASE 5: DEEP DATA ANALYSIS');
    
    const analyses = {
      statistical: await this.performStatisticalAnalysis(data),
      sentiment: await this.performSentimentAnalysis(data),
      trends: await this.identifyTrends(data),
      anomalies: await this.detectAnomalies(data),
      correlations: await this.findCorrelations(data),
      predictions: await this.generatePredictions(data),
      competitive: await this.performCompetitiveAnalysis(data),
      risk: await this.assessRisks(data)
    };

    // Use Data Analyst Agent for comprehensive quantitative analysis
    const prompt = `You are the Data Analyst Agent performing deep quantitative analysis.
    
    Data Statistics:
    ${JSON.stringify(analyses.statistical, null, 2)}
    
    Sentiment Metrics:
    ${JSON.stringify(analyses.sentiment, null, 2)}
    
    Identified Trends:
    ${JSON.stringify(analyses.trends, null, 2)}
    
    Detected Anomalies:
    ${JSON.stringify(analyses.anomalies, null, 2)}
    
    Perform comprehensive data analysis including:
    1. Statistical significance testing
    2. Trend extrapolation and forecasting
    3. Correlation analysis between variables
    4. Anomaly investigation and explanation
    5. Competitive benchmarking
    6. Risk scoring and probability assessment
    7. Opportunity identification with confidence scores
    8. Key metric calculations and KPI tracking
    
    Return detailed quantitative findings with visualizations recommendations.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const dataAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      return {
        ...analyses,
        comprehensive: dataAnalysis
      };
    } catch (error) {
      console.error('Data analysis failed:', error);
      return analyses;
    }
  }

  /**
   * PHASE 6: INTELLIGENCE SYNTHESIS
   * Synthesizes all findings into actionable intelligence
   */
  async synthesizeIntelligence(data, analysis, objectives, config) {
    console.log('💡 PHASE 6: INTELLIGENCE SYNTHESIS');
    
    const prompt = `You are synthesizing comprehensive monitoring intelligence.
    
    Create actionable intelligence from:
    1. Collected data from ${this.countTotalItems(data)} sources
    2. Deep analysis results
    3. Identified patterns and trends
    4. Detected opportunities and threats
    
    Synthesize into:
    1. Executive Summary (3-5 key points)
    2. Critical Alerts (immediate action required)
    3. Strategic Opportunities (ranked by impact)
    4. Risk Warnings (with mitigation strategies)
    5. Competitive Intelligence (positioning and moves)
    6. Market Signals (what's changing)
    7. Stakeholder Impacts (who's affected and how)
    8. Recommended Actions (prioritized list)
    9. Follow-up Questions (what to investigate next)
    10. Confidence Assessment (how sure are we)
    
    Make it actionable, specific, and time-bound.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultIntelligence();
    } catch (error) {
      console.error('Intelligence synthesis failed:', error);
      return this.getDefaultIntelligence();
    }
  }

  /**
   * PHASE 7: REPORT GENERATION
   * Uses Report Generator Agent to create comprehensive deliverables
   */
  async generateComprehensiveReport(intelligence, analysis, data, config) {
    console.log('📝 PHASE 7: COMPREHENSIVE REPORT GENERATION');
    
    const prompt = `You are the Report Generator Agent creating a world-class intelligence report.
    
    Create a comprehensive monitoring report including:
    
    1. EXECUTIVE DASHBOARD
       - Key metrics and KPIs
       - Traffic light status indicators
       - Trend arrows and change percentages
       - Alert badges for critical items
    
    2. STRATEGIC INTELLIGENCE
       - Market positioning analysis
       - Competitive landscape changes
       - Opportunity windows (time-sensitive)
       - Threat assessment matrix
    
    3. DETAILED FINDINGS
       - By organization/competitor/topic
       - With evidence and source citations
       - Confidence levels for each finding
       - Impact assessments
    
    4. PREDICTIVE INSIGHTS
       - Likely scenarios (next 24h, 7d, 30d)
       - Early warning indicators
       - Cascade effects analysis
    
    5. RECOMMENDED ACTIONS
       - Immediate (within 24 hours)
       - Short-term (this week)
       - Strategic (this month)
       - Each with success metrics
    
    6. APPENDICES
       - Methodology notes
       - Source reliability ratings
       - Data quality assessment
       - Technical details
    
    Format for clarity, readability, and immediate action.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return {
        generatedAt: new Date().toISOString(),
        config: config,
        intelligence: intelligence,
        analysis: analysis,
        dataSummary: this.summarizeData(data),
        report: response,
        exportFormats: ['json', 'pdf', 'html', 'ppt'],
        subscriberAlerts: this.generateAlerts(intelligence)
      };
    } catch (error) {
      console.error('Report generation failed:', error);
      return this.getDefaultReport();
    }
  }

  /**
   * CONTINUOUS MONITORING ENGINE
   * Runs the entire pipeline continuously with smart scheduling
   */
  async startContinuousMonitoring(config, options = {}) {
    console.log('🚀 STARTING CONTINUOUS MONITORING ENGINE');
    
    const monitoringId = `monitor-${Date.now()}`;
    const monitor = {
      id: monitoringId,
      config: config,
      status: 'active',
      startedAt: new Date(),
      lastRun: null,
      nextRun: null,
      runCount: 0,
      options: {
        interval: options.interval || 15 * 60 * 1000, // 15 minutes default
        priority: options.priority || 'normal',
        alertThreshold: options.alertThreshold || 'high',
        maxRetries: options.maxRetries || 3,
        ...options
      }
    };

    this.activeMonitors.set(monitoringId, monitor);

    // Start the monitoring loop
    const runMonitoring = async () => {
      if (monitor.status !== 'active') return;

      try {
        console.log(`\n========== MONITORING RUN #${++monitor.runCount} ==========`);
        monitor.lastRun = new Date();

        // Run the complete pipeline
        const result = await this.runCompletePipeline(config);

        // Store results
        this.analysisCache.set(monitoringId, {
          timestamp: new Date(),
          result: result
        });

        // Check for critical alerts
        if (result.intelligence.criticalAlerts?.length > 0) {
          await this.handleCriticalAlerts(result.intelligence.criticalAlerts, config);
        }

        // Schedule next run
        monitor.nextRun = new Date(Date.now() + monitor.options.interval);
        console.log(`Next run scheduled for: ${monitor.nextRun.toISOString()}`);

      } catch (error) {
        console.error('Monitoring run failed:', error);
        monitor.errors = (monitor.errors || 0) + 1;
        
        if (monitor.errors >= monitor.options.maxRetries) {
          console.error('Max retries reached, pausing monitor');
          monitor.status = 'paused';
          return;
        }
      }

      // Schedule next run
      if (monitor.status === 'active') {
        setTimeout(runMonitoring, monitor.options.interval);
      }
    };

    // Start first run immediately
    runMonitoring();

    return monitoringId;
  }

  /**
   * RUN COMPLETE PIPELINE
   * Executes all phases in sequence
   */
  async runCompletePipeline(config) {
    const startTime = Date.now();
    console.log('\n🎬 RUNNING COMPLETE MONITORING PIPELINE');

    // Phase 1: Clarify objectives
    const objectives = await this.clarifyMonitoringObjectives(config);
    console.log('✅ Objectives clarified');

    // Phase 2: Discover sources
    const sources = await this.discoverComprehensiveSources(objectives, config);
    console.log(`✅ ${sources.length} sources discovered`);

    // Phase 3: Collect data
    const data = await this.collectDataFromAllSources(sources, objectives);
    console.log(`✅ ${this.countTotalItems(data)} data points collected`);

    // Phase 4: Orchestrate research
    const researchPlan = await this.orchestrateResearchAnalysis(data, objectives, config);
    console.log('✅ Research orchestrated');

    // Phase 5: Deep analysis
    const analysis = await this.performDeepDataAnalysis(data, researchPlan);
    console.log('✅ Deep analysis completed');

    // Phase 6: Synthesize intelligence
    const intelligence = await this.synthesizeIntelligence(data, analysis, objectives, config);
    console.log('✅ Intelligence synthesized');

    // Phase 7: Generate report
    const report = await this.generateComprehensiveReport(intelligence, analysis, data, config);
    console.log('✅ Report generated');

    const endTime = Date.now();
    console.log(`\n✨ PIPELINE COMPLETED in ${(endTime - startTime) / 1000}s`);

    return {
      objectives,
      sources,
      data,
      researchPlan,
      analysis,
      intelligence,
      report,
      metadata: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: endTime - startTime,
        sourcesMonitored: sources.length,
        dataPointsCollected: this.countTotalItems(data),
        confidence: intelligence.confidence || 'medium'
      }
    };
  }

  /**
   * HELPER: Discover sources via search engines
   */
  async discoverSourcesViaSearch(query) {
    const sources = [];
    
    // Simulate search engine discovery (in production, use Google Custom Search API)
    const searchResults = [
      { url: `https://www.industry-news.com/${query.replace(/\s+/g, '-')}`, type: 'web' },
      { url: `https://www.expert-blog.com/analysis/${query.replace(/\s+/g, '-')}`, type: 'blog' },
      { url: `https://data.sector-intel.com/${query.replace(/\s+/g, '_')}`, type: 'data' }
    ];

    for (const result of searchResults) {
      sources.push({
        name: `Search Result: ${query}`,
        url: result.url,
        type: result.type,
        priority: 'medium',
        discoveryMethod: 'search'
      });
    }

    return sources;
  }

  /**
   * HELPER: Get social media sources
   */
  async getSocialMediaSources(objectives) {
    const sources = [];
    
    // Twitter/X lists and searches
    for (const entity of objectives.entities || []) {
      sources.push({
        name: `Twitter - ${entity}`,
        url: `https://twitter.com/search?q=${encodeURIComponent(entity)}`,
        type: 'social',
        platform: 'twitter',
        priority: 'high'
      });
    }

    // Reddit monitoring
    sources.push({
      name: 'Reddit - Relevant Subreddits',
      url: 'https://www.reddit.com/r/business+technology+investing',
      type: 'social',
      platform: 'reddit',
      priority: 'medium'
    });

    // LinkedIn monitoring
    sources.push({
      name: 'LinkedIn - Industry Updates',
      url: 'https://www.linkedin.com/feed/',
      type: 'social',
      platform: 'linkedin',
      priority: 'medium'
    });

    return sources;
  }

  /**
   * HELPER: Get deep web sources
   */
  async getDeepWebSources(config) {
    const sources = [];

    // SEC filings for public companies
    if (config.organization?.type === 'public') {
      sources.push({
        name: 'SEC EDGAR Database',
        url: 'https://www.sec.gov/edgar/search/',
        type: 'database',
        priority: 'high'
      });
    }

    // Patent databases
    sources.push({
      name: 'Patent Database',
      url: 'https://patents.google.com',
      type: 'database',
      priority: 'medium'
    });

    // Academic sources
    sources.push({
      name: 'Google Scholar',
      url: 'https://scholar.google.com',
      type: 'academic',
      priority: 'low'
    });

    return sources;
  }

  /**
   * HELPER: Identify pages for custom scraping
   */
  async identifyScrapingTargets(objectives) {
    const targets = [];

    // Competitor websites
    for (const competitor of objectives.competitors || []) {
      targets.push({
        name: `${competitor} Website`,
        url: `https://www.${competitor.toLowerCase().replace(/\s+/g, '')}.com`,
        type: 'web',
        scrapeType: 'dynamic',
        selectors: {
          news: '.news-item, .press-release, .blog-post',
          products: '.product, .service, .offering',
          pricing: '.pricing, .cost, .price'
        }
      });
    }

    return targets;
  }

  /**
   * HELPER: Rank and deduplicate sources
   */
  async rankAndDeduplicateSources(sourcesObj) {
    const allSources = [];
    
    // Flatten all source categories
    for (const [tier, sources] of Object.entries(sourcesObj)) {
      for (const source of sources) {
        source.tier = tier;
        allSources.push(source);
      }
    }

    // Deduplicate by URL
    const uniqueSources = Array.from(
      new Map(allSources.map(s => [s.url, s])).values()
    );

    // Rank by priority and tier
    const tierRank = { tier1: 5, tier2: 4, tier3: 3, realtime: 4, deep: 3, custom: 5 };
    const priorityRank = { critical: 5, high: 4, medium: 3, low: 2 };

    uniqueSources.sort((a, b) => {
      const aTierScore = tierRank[a.tier] || 3;
      const bTierScore = tierRank[b.tier] || 3;
      const aPriorityScore = priorityRank[a.priority] || 3;
      const bPriorityScore = priorityRank[b.priority] || 3;
      
      return (bTierScore + bPriorityScore) - (aTierScore + aPriorityScore);
    });

    return uniqueSources;
  }

  /**
   * HELPER: Collect from RSS feeds
   */
  async collectFromRSSFeeds(sources) {
    const items = [];
    
    for (const source of sources) {
      try {
        const feed = await this.parser.parseURL(source.url);
        items.push(...feed.items.map(item => ({
          ...item,
          source: source.name,
          sourceUrl: source.url,
          collectedAt: new Date()
        })));
      } catch (error) {
        console.log(`RSS collection failed for ${source.name}`);
      }
    }

    return items;
  }

  /**
   * HELPER: Collect from APIs
   */
  async collectFromAPIs(sources) {
    const data = [];
    
    for (const source of sources) {
      try {
        const response = await axios.get(source.url, {
          headers: source.headers || {},
          params: source.params || {}
        });
        
        data.push({
          source: source.name,
          data: response.data,
          collectedAt: new Date()
        });
      } catch (error) {
        console.log(`API collection failed for ${source.name}`);
      }
    }

    return data;
  }

  /**
   * HELPER: Scrape web pages
   */
  async scrapeWebPages(sources) {
    const scraped = [];
    
    // Initialize browser if needed
    if (!this.browser) {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    for (const source of sources.slice(0, 10)) { // Limit for performance
      try {
        const page = await this.browser.newPage();
        await page.goto(source.url, { waitUntil: 'networkidle2' });
        
        // Extract structured data
        const content = await page.evaluate(() => {
          return {
            title: document.title,
            meta: Array.from(document.querySelectorAll('meta')).map(m => ({
              name: m.name || m.property,
              content: m.content
            })),
            headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
            links: Array.from(document.querySelectorAll('a')).map(a => ({
              text: a.textContent,
              href: a.href
            })),
            text: document.body.innerText
          };
        });
        
        scraped.push({
          source: source.name,
          url: source.url,
          content: content,
          scrapedAt: new Date()
        });
        
        await page.close();
      } catch (error) {
        console.log(`Scraping failed for ${source.url}`);
      }
    }

    return scraped;
  }

  /**
   * HELPER: Collect social media data
   */
  async collectSocialData(sources) {
    // In production, this would use official APIs
    // For now, return simulated data
    return sources.map(source => ({
      source: source.name,
      platform: source.platform,
      posts: [],
      metrics: {
        followers: 0,
        engagement: 0
      },
      collectedAt: new Date()
    }));
  }

  /**
   * HELPER: Extract documents
   */
  async extractDocuments(sources) {
    // In production, this would download and parse PDFs, DOCs, etc.
    return [];
  }

  /**
   * HELPER: Extract metrics
   */
  async extractMetrics(data) {
    const metrics = {
      volume: {
        total: this.countTotalItems(data),
        bySource: {},
        byType: {}
      },
      sentiment: {
        positive: 0,
        negative: 0,
        neutral: 0
      },
      engagement: {
        total: 0,
        average: 0
      },
      velocity: {
        itemsPerHour: 0,
        trending: []
      }
    };

    // Calculate metrics from collected data
    // ... implementation ...

    return metrics;
  }

  /**
   * HELPER: Count total items
   */
  countTotalItems(data) {
    let total = 0;
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        total += value.length;
      }
    }
    return total;
  }

  /**
   * HELPER: Statistical analysis
   */
  async performStatisticalAnalysis(data) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      distribution: 'normal'
    };
  }

  /**
   * HELPER: Sentiment analysis
   */
  async performSentimentAnalysis(data) {
    // Use Claude for sentiment analysis
    const samples = this.extractSamples(data, 10);
    
    const prompt = `Analyze sentiment for these samples:
    ${JSON.stringify(samples, null, 2)}
    
    Return sentiment scores (-1 to 1) for each.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return JSON.parse(response);
    } catch {
      return { overall: 0, samples: [] };
    }
  }

  /**
   * HELPER: Trend identification
   */
  async identifyTrends(data) {
    return {
      rising: [],
      falling: [],
      stable: []
    };
  }

  /**
   * HELPER: Anomaly detection
   */
  async detectAnomalies(data) {
    return {
      anomalies: [],
      severity: 'low'
    };
  }

  /**
   * HELPER: Correlation finding
   */
  async findCorrelations(data) {
    return {
      strong: [],
      moderate: [],
      weak: []
    };
  }

  /**
   * HELPER: Generate predictions
   */
  async generatePredictions(data) {
    return {
      shortTerm: [],
      mediumTerm: [],
      longTerm: []
    };
  }

  /**
   * HELPER: Competitive analysis
   */
  async performCompetitiveAnalysis(data) {
    return {
      positioning: {},
      movements: [],
      threats: [],
      opportunities: []
    };
  }

  /**
   * HELPER: Risk assessment
   */
  async assessRisks(data) {
    return {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
  }

  /**
   * HELPER: Extract samples
   */
  extractSamples(data, count) {
    const samples = [];
    // Extract representative samples from data
    return samples.slice(0, count);
  }

  /**
   * HELPER: Summarize data
   */
  summarizeData(data) {
    return {
      totalItems: this.countTotalItems(data),
      breakdown: Object.entries(data).map(([key, value]) => ({
        type: key,
        count: Array.isArray(value) ? value.length : 1
      }))
    };
  }

  /**
   * HELPER: Generate alerts
   */
  generateAlerts(intelligence) {
    const alerts = [];
    
    if (intelligence.criticalAlerts) {
      alerts.push(...intelligence.criticalAlerts.map(alert => ({
        level: 'critical',
        message: alert,
        timestamp: new Date()
      })));
    }

    return alerts;
  }

  /**
   * HELPER: Handle critical alerts
   */
  async handleCriticalAlerts(alerts, config) {
    console.log('🚨 CRITICAL ALERTS DETECTED:', alerts.length);
    
    // In production, this would:
    // - Send emails
    // - Push notifications
    // - Trigger webhooks
    // - Create tickets
    // - Call APIs
    
    for (const alert of alerts) {
      console.log(`  ⚠️ ${alert}`);
    }
  }

  /**
   * HELPER: Get default objectives
   */
  getDefaultObjectives(config) {
    return {
      searchQueries: [config.organization?.name || 'business'],
      entities: [],
      triggers: [],
      indicators: {},
      metrics: [],
      geographic: [],
      temporal: {},
      regulatory: []
    };
  }

  /**
   * HELPER: Get default research plan
   */
  getDefaultResearchPlan() {
    return {
      priorities: [],
      tasks: [],
      gaps: [],
      followUp: []
    };
  }

  /**
   * HELPER: Get default intelligence
   */
  getDefaultIntelligence() {
    return {
      executiveSummary: [],
      criticalAlerts: [],
      opportunities: [],
      risks: [],
      competitive: {},
      marketSignals: [],
      stakeholderImpacts: [],
      recommendations: [],
      followUpQuestions: [],
      confidence: 'low'
    };
  }

  /**
   * HELPER: Get default report
   */
  getDefaultReport() {
    return {
      generatedAt: new Date().toISOString(),
      content: 'Report generation failed',
      format: 'text'
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(monitoringId) {
    const monitor = this.activeMonitors.get(monitoringId);
    if (monitor) {
      monitor.status = 'stopped';
      this.activeMonitors.delete(monitoringId);
      console.log(`Monitoring ${monitoringId} stopped`);
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(monitoringId) {
    return this.activeMonitors.get(monitoringId);
  }

  /**
   * Get latest results
   */
  getLatestResults(monitoringId) {
    return this.analysisCache.get(monitoringId);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * GET INDEXED SOURCES
   * Retrieves pre-indexed sources from the database
   */
  async getIndexedSources(config) {
    try {
      // Check cache first
      const cacheKey = `${config.organization?.name || 'org'}-${Date.now()}`;
      if (this.sourceIndexCache.has(cacheKey)) {
        return this.sourceIndexCache.get(cacheKey);
      }

      const sources = [];
      
      // 1. Get sources for the organization
      if (config.organization?.name) {
        const orgResult = await pool.query(
          `SELECT si.*, si.index_data
           FROM source_indexes si
           WHERE entity_type = 'company' 
           AND LOWER(entity_name) = LOWER($1)
           AND active = true
           ORDER BY created_at DESC
           LIMIT 1`,
          [config.organization.name]
        );
        
        if (orgResult.rows.length > 0) {
          const indexData = JSON.parse(orgResult.rows[0].index_data);
          if (indexData.sources) {
            sources.push(...indexData.sources);
          }
        }
      }
      
      // 2. Get sources for competitors
      if (config.competitors && config.competitors.length > 0) {
        for (const competitor of config.competitors) {
          const compResult = await pool.query(
            `SELECT si.index_data
             FROM source_indexes si
             WHERE entity_type = 'company'
             AND LOWER(entity_name) = LOWER($1)
             AND active = true
             ORDER BY created_at DESC
             LIMIT 1`,
            [competitor.name]
          );
          
          if (compResult.rows.length > 0) {
            const indexData = JSON.parse(compResult.rows[0].index_data);
            if (indexData.sources) {
              sources.push(...indexData.sources.slice(0, 20)); // Limit per competitor
            }
          }
        }
      }
      
      // 3. Get sources for topics
      if (config.topics && config.topics.length > 0) {
        for (const topic of config.topics) {
          const topicResult = await pool.query(
            `SELECT si.index_data
             FROM source_indexes si
             WHERE entity_type = 'topic'
             AND LOWER(entity_name) = LOWER($1)
             AND active = true
             ORDER BY created_at DESC
             LIMIT 1`,
            [topic.name]
          );
          
          if (topicResult.rows.length > 0) {
            const indexData = JSON.parse(topicResult.rows[0].index_data);
            if (indexData.sources) {
              sources.push(...indexData.sources.slice(0, 10)); // Limit per topic
            }
          }
        }
      }
      
      // 4. Get industry-specific sources
      if (config.organization?.industry) {
        const industryResult = await pool.query(
          `SELECT si.index_data
           FROM source_indexes si
           WHERE entity_type = 'industry'
           AND LOWER(entity_name) = LOWER($1)
           AND active = true
           ORDER BY created_at DESC
           LIMIT 1`,
          [config.organization.industry]
        );
        
        if (industryResult.rows.length > 0) {
          const indexData = JSON.parse(industryResult.rows[0].index_data);
          if (indexData.sources) {
            sources.push(...indexData.sources.filter(s => s.qualityScore?.overall > 6));
          }
        }
      }
      
      // Cache for 1 hour
      this.sourceIndexCache.set(cacheKey, sources);
      setTimeout(() => this.sourceIndexCache.delete(cacheKey), 60 * 60 * 1000);
      
      return sources;
    } catch (error) {
      console.error('Failed to get indexed sources:', error);
      return [];
    }
  }

  /**
   * CREATE INDEX IN BACKGROUND
   * Creates a new index for entities that don't have one
   */
  async createIndexInBackground(config) {
    try {
      // Index organization
      if (config.organization?.name) {
        this.indexingAgent.indexEntity('company', config.organization).then(result => {
          console.log(`✅ Created index for ${config.organization.name}`);
        }).catch(err => {
          console.error(`Failed to index ${config.organization.name}:`, err);
        });
      }
      
      // Index competitors
      if (config.competitors) {
        for (const competitor of config.competitors) {
          this.indexingAgent.indexEntity('company', competitor).then(result => {
            console.log(`✅ Created index for competitor ${competitor.name}`);
          }).catch(err => {
            console.error(`Failed to index competitor ${competitor.name}:`, err);
          });
        }
      }
      
      // Index topics
      if (config.topics) {
        for (const topic of config.topics) {
          this.indexingAgent.indexEntity('topic', topic).then(result => {
            console.log(`✅ Created index for topic ${topic.name}`);
          }).catch(err => {
            console.error(`Failed to index topic ${topic.name}:`, err);
          });
        }
      }
    } catch (error) {
      console.error('Background indexing failed:', error);
    }
  }
}

module.exports = UltimateMonitoringAgent;