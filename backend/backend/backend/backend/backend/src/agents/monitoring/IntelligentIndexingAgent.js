/**
 * INTELLIGENT SOURCE INDEXING AGENT
 * Automatically discovers, categorizes, and indexes sources for any industry, company, or topic
 * Uses all available agents to build comprehensive, continuously updated source indexes
 */

const claudeService = require('../../../config/claude');
const SourceDiscoveryService = require('../../services/SourceDiscoveryService');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
// const puppeteer = require('puppeteer'); // Disabled for Railway deployment
const pool = require('../../config/db');

class IntelligentIndexingAgent {
  constructor() {
    this.sourceDiscovery = new SourceDiscoveryService();
    this.parser = new Parser();
    this.browser = null;
    this.indexCache = new Map();
    this.crawlQueue = [];
    this.isIndexing = false;
  }

  /**
   * MAIN INDEXING PIPELINE
   * Discovers and indexes all sources for a given entity
   */
  async indexEntity(entityType, entityData, options = {}) {
    console.log(`🔍 INDEXING ${entityType.toUpperCase()}: ${entityData.name || entityData.query}`);
    
    // Phase 1: Entity Analysis
    const entityProfile = await this.analyzeEntity(entityType, entityData);
    
    // Phase 2: Source Discovery
    const discoveredSources = await this.discoverEntitySources(entityType, entityData);
    
    // Phase 3: Source Validation
    const validatedSources = await this.validateSources(discoveredSources);
    
    // Phase 4: Content Analysis
    const analyzedSources = await this.analyzeSourceContent(validatedSources);
    
    // Phase 5: Quality Scoring
    const scoredSources = await this.scoreSourceQuality(analyzedSources);
    
    // Phase 6: Categorization
    const categorizedSources = await this.categorizeSources(scoredSources);
    
    // Phase 7: Index Storage
    const indexId = await this.storeIndex(entityType, entityData, categorizedSources);
    
    const pipeline = {
      entityProfile,
      discoveredSources,
      validatedSources,
      analyzedSources,
      scoredSources,
      categorizedSources,
      indexId
    };

    return pipeline;
  }

  /**
   * PHASE 1: ENTITY ANALYSIS
   * Uses Query Clarifier to understand the entity deeply
   */
  async analyzeEntity(entityType, entityData) {
    console.log('📊 Analyzing entity profile...');
    
    const prompt = `You are analyzing an entity for source indexing.
    
    Entity Type: ${entityType}
    Entity Data: ${JSON.stringify(entityData, null, 2)}
    
    Provide a comprehensive profile including:
    1. Key characteristics and attributes
    2. Related entities (parent companies, subsidiaries, competitors)
    3. Industry classification and sectors
    4. Geographic presence and markets
    5. Key topics and themes to monitor
    6. Stakeholder groups to track
    7. Regulatory bodies and compliance areas
    8. Historical context and timeline
    9. Current strategic priorities
    10. Potential information sources categories
    
    Return detailed JSON profile.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultProfile(entityType, entityData);
    } catch (error) {
      console.error('Entity analysis failed:', error);
      return this.getDefaultProfile(entityType, entityData);
    }
  }

  /**
   * PHASE 2: COMPREHENSIVE SOURCE DISCOVERY
   * Discovers all possible sources for the entity
   */
  async discoverEntitySources(entityType, entityData) {
    console.log('🌐 Discovering sources...');
    
    const sources = {
      official: [],      // Official company/organization sources
      news: [],          // News and media outlets
      industry: [],      // Industry publications and trade journals
      regulatory: [],    // Government and regulatory sources
      academic: [],      // Research and academic sources
      social: [],        // Social media and forums
      financial: [],     // Financial data and reports
      technical: [],     // Technical documentation and patents
      competitive: [],   // Competitor intelligence sources
      stakeholder: []    // Stakeholder and partner sources
    };

    // 1. Official Sources
    sources.official = await this.discoverOfficialSources(entityData);
    
    // 2. News Sources
    sources.news = await this.discoverNewsSourcesForEntity(entityData);
    
    // 3. Industry Publications
    sources.industry = await this.discoverIndustryPublications(entityData);
    
    // 4. Regulatory Sources
    sources.regulatory = await this.discoverRegulatorySource(entityData);
    
    // 5. Academic Sources
    sources.academic = await this.discoverAcademicSources(entityData);
    
    // 6. Social Media
    sources.social = await this.discoverSocialSources(entityData);
    
    // 7. Financial Sources
    sources.financial = await this.discoverFinancialSources(entityData);
    
    // 8. Technical Sources
    sources.technical = await this.discoverTechnicalSources(entityData);
    
    // 9. Competitive Intelligence
    sources.competitive = await this.discoverCompetitiveSources(entityData);
    
    // 10. Stakeholder Sources
    sources.stakeholder = await this.discoverStakeholderSources(entityData);

    return sources;
  }

  /**
   * Discover official sources for an entity
   */
  async discoverOfficialSources(entityData) {
    const sources = [];
    const baseUrl = this.generateBaseUrl(entityData.name);
    
    // Company website variations
    const domains = [
      `https://www.${baseUrl}.com`,
      `https://www.${baseUrl}.org`,
      `https://www.${baseUrl}.net`,
      `https://www.${baseUrl}.io`,
      `https://${baseUrl}.com`,
      `https://ir.${baseUrl}.com`, // Investor relations
      `https://news.${baseUrl}.com`, // News room
      `https://blog.${baseUrl}.com`, // Blog
      `https://developers.${baseUrl}.com` // Developer portal
    ];

    for (const url of domains) {
      sources.push({
        url: url,
        type: 'official',
        subtype: this.detectSubtype(url),
        name: `${entityData.name} - ${this.detectSubtype(url)}`,
        priority: 'high',
        verified: false
      });
    }

    // Add RSS feeds
    sources.push({
      url: `https://www.${baseUrl}.com/rss`,
      type: 'official',
      subtype: 'rss',
      name: `${entityData.name} RSS Feed`,
      priority: 'high'
    });

    return sources;
  }

  /**
   * Discover news sources covering the entity
   */
  async discoverNewsSourcesForEntity(entityData) {
    const sources = [];
    const searchQuery = encodeURIComponent(entityData.name);
    
    // Google News RSS
    sources.push({
      url: `https://news.google.com/rss/search?q="${searchQuery}"&hl=en-US&gl=US&ceid=US:en`,
      type: 'news',
      subtype: 'google_news',
      name: `Google News - ${entityData.name}`,
      priority: 'high',
      updateFrequency: 'real-time'
    });

    // Bing News RSS
    sources.push({
      url: `https://www.bing.com/news/search?q=${searchQuery}&format=rss`,
      type: 'news',
      subtype: 'bing_news',
      name: `Bing News - ${entityData.name}`,
      priority: 'medium'
    });

    // Major news outlets with search
    const newsOutlets = [
      { domain: 'reuters.com', name: 'Reuters' },
      { domain: 'bloomberg.com', name: 'Bloomberg' },
      { domain: 'wsj.com', name: 'Wall Street Journal' },
      { domain: 'ft.com', name: 'Financial Times' },
      { domain: 'nytimes.com', name: 'New York Times' },
      { domain: 'bbc.com', name: 'BBC' },
      { domain: 'cnn.com', name: 'CNN' },
      { domain: 'forbes.com', name: 'Forbes' },
      { domain: 'businessinsider.com', name: 'Business Insider' },
      { domain: 'techcrunch.com', name: 'TechCrunch' }
    ];

    for (const outlet of newsOutlets) {
      sources.push({
        url: `https://www.${outlet.domain}/search?q=${searchQuery}`,
        type: 'news',
        subtype: 'major_outlet',
        name: `${outlet.name} - ${entityData.name}`,
        priority: 'high',
        outlet: outlet.name
      });
    }

    return sources;
  }

  /**
   * Discover industry-specific publications
   */
  async discoverIndustryPublications(entityData) {
    const industry = entityData.industry || 'general';
    const sources = [];
    
    // Use Claude to identify industry publications
    const prompt = `Identify the top 20 industry publications, trade journals, and specialized media outlets for:
    Industry: ${industry}
    Company: ${entityData.name}
    Sector: ${entityData.sector || 'general'}
    
    Return JSON with publication name, URL, and focus area.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const publications = JSON.parse(jsonMatch[0]);
        for (const pub of publications.publications || []) {
          sources.push({
            url: pub.url,
            type: 'industry',
            subtype: pub.focusArea || 'trade_journal',
            name: pub.name,
            priority: 'high',
            industry: industry
          });
        }
      }
    } catch (error) {
      console.error('Industry publication discovery failed:', error);
    }

    // Add default industry sources based on common sectors
    const industryDefaults = this.getDefaultIndustrySources(industry);
    sources.push(...industryDefaults);

    return sources;
  }

  /**
   * Discover regulatory and government sources
   */
  async discoverRegulatorySource(entityData) {
    const sources = [];
    
    // SEC filings for public companies
    if (entityData.public || entityData.ticker) {
      sources.push({
        url: `https://www.sec.gov/edgar/search/?r=el#/entityName=${encodeURIComponent(entityData.name)}`,
        type: 'regulatory',
        subtype: 'sec_filings',
        name: `SEC EDGAR - ${entityData.name}`,
        priority: 'critical',
        updateFrequency: 'quarterly'
      });
    }

    // Industry-specific regulators
    const regulators = this.getIndustryRegulators(entityData.industry);
    sources.push(...regulators);

    // Patent databases
    sources.push({
      url: `https://patents.google.com/?q=${encodeURIComponent(entityData.name)}`,
      type: 'regulatory',
      subtype: 'patents',
      name: `Patent Search - ${entityData.name}`,
      priority: 'medium'
    });

    // Government contracts
    sources.push({
      url: `https://www.usaspending.gov/search/${encodeURIComponent(entityData.name)}`,
      type: 'regulatory',
      subtype: 'gov_contracts',
      name: `Government Contracts - ${entityData.name}`,
      priority: 'medium'
    });

    return sources;
  }

  /**
   * Discover academic and research sources
   */
  async discoverAcademicSources(entityData) {
    const sources = [];
    const searchQuery = encodeURIComponent(entityData.name);
    
    sources.push(
      {
        url: `https://scholar.google.com/scholar?q=${searchQuery}`,
        type: 'academic',
        subtype: 'google_scholar',
        name: `Google Scholar - ${entityData.name}`,
        priority: 'medium'
      },
      {
        url: `https://arxiv.org/search/?query=${searchQuery}`,
        type: 'academic',
        subtype: 'arxiv',
        name: `arXiv - ${entityData.name}`,
        priority: 'low'
      },
      {
        url: `https://www.researchgate.net/search?q=${searchQuery}`,
        type: 'academic',
        subtype: 'researchgate',
        name: `ResearchGate - ${entityData.name}`,
        priority: 'low'
      }
    );

    return sources;
  }

  /**
   * Discover social media sources
   */
  async discoverSocialSources(entityData) {
    const sources = [];
    const handle = this.generateSocialHandle(entityData.name);
    
    // Twitter/X
    sources.push({
      url: `https://twitter.com/search?q=${encodeURIComponent(entityData.name)}`,
      type: 'social',
      subtype: 'twitter',
      name: `Twitter/X - ${entityData.name}`,
      priority: 'high',
      realTime: true
    });

    // LinkedIn
    sources.push({
      url: `https://www.linkedin.com/company/${handle}`,
      type: 'social',
      subtype: 'linkedin',
      name: `LinkedIn - ${entityData.name}`,
      priority: 'high'
    });

    // Reddit
    sources.push({
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(entityData.name)}`,
      type: 'social',
      subtype: 'reddit',
      name: `Reddit - ${entityData.name}`,
      priority: 'medium'
    });

    // YouTube
    sources.push({
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(entityData.name)}`,
      type: 'social',
      subtype: 'youtube',
      name: `YouTube - ${entityData.name}`,
      priority: 'medium'
    });

    // Facebook
    sources.push({
      url: `https://www.facebook.com/search/top?q=${encodeURIComponent(entityData.name)}`,
      type: 'social',
      subtype: 'facebook',
      name: `Facebook - ${entityData.name}`,
      priority: 'low'
    });

    return sources;
  }

  /**
   * Discover financial data sources
   */
  async discoverFinancialSources(entityData) {
    const sources = [];
    const ticker = entityData.ticker || entityData.symbol;
    
    if (ticker) {
      // Yahoo Finance
      sources.push({
        url: `https://finance.yahoo.com/quote/${ticker}`,
        type: 'financial',
        subtype: 'yahoo_finance',
        name: `Yahoo Finance - ${entityData.name}`,
        priority: 'high',
        dataType: 'real-time'
      });

      // Google Finance
      sources.push({
        url: `https://www.google.com/finance/quote/${ticker}`,
        type: 'financial',
        subtype: 'google_finance',
        name: `Google Finance - ${entityData.name}`,
        priority: 'high'
      });

      // MarketWatch
      sources.push({
        url: `https://www.marketwatch.com/investing/stock/${ticker}`,
        type: 'financial',
        subtype: 'marketwatch',
        name: `MarketWatch - ${entityData.name}`,
        priority: 'medium'
      });

      // Seeking Alpha
      sources.push({
        url: `https://seekingalpha.com/symbol/${ticker}`,
        type: 'financial',
        subtype: 'seeking_alpha',
        name: `Seeking Alpha - ${entityData.name}`,
        priority: 'medium'
      });
    }

    // Crunchbase
    sources.push({
      url: `https://www.crunchbase.com/organization/${this.generateBaseUrl(entityData.name)}`,
      type: 'financial',
      subtype: 'crunchbase',
      name: `Crunchbase - ${entityData.name}`,
      priority: 'medium'
    });

    return sources;
  }

  /**
   * Discover technical and developer sources
   */
  async discoverTechnicalSources(entityData) {
    const sources = [];
    const orgName = this.generateBaseUrl(entityData.name);
    
    // GitHub
    sources.push({
      url: `https://github.com/${orgName}`,
      type: 'technical',
      subtype: 'github',
      name: `GitHub - ${entityData.name}`,
      priority: 'high'
    });

    // Stack Overflow
    sources.push({
      url: `https://stackoverflow.com/questions/tagged/${orgName}`,
      type: 'technical',
      subtype: 'stackoverflow',
      name: `Stack Overflow - ${entityData.name}`,
      priority: 'medium'
    });

    // Product Hunt
    sources.push({
      url: `https://www.producthunt.com/search?q=${encodeURIComponent(entityData.name)}`,
      type: 'technical',
      subtype: 'product_hunt',
      name: `Product Hunt - ${entityData.name}`,
      priority: 'low'
    });

    // Hacker News
    sources.push({
      url: `https://hn.algolia.com/?q=${encodeURIComponent(entityData.name)}`,
      type: 'technical',
      subtype: 'hackernews',
      name: `Hacker News - ${entityData.name}`,
      priority: 'medium'
    });

    return sources;
  }

  /**
   * Discover competitive intelligence sources
   */
  async discoverCompetitiveSources(entityData) {
    const sources = [];
    
    // Competitor comparison sites
    sources.push({
      url: `https://www.g2.com/search?query=${encodeURIComponent(entityData.name)}`,
      type: 'competitive',
      subtype: 'g2_crowd',
      name: `G2 - ${entityData.name}`,
      priority: 'high'
    });

    sources.push({
      url: `https://www.capterra.com/search/?search=${encodeURIComponent(entityData.name)}`,
      type: 'competitive',
      subtype: 'capterra',
      name: `Capterra - ${entityData.name}`,
      priority: 'medium'
    });

    // Review sites
    sources.push({
      url: `https://www.trustpilot.com/search?query=${encodeURIComponent(entityData.name)}`,
      type: 'competitive',
      subtype: 'trustpilot',
      name: `Trustpilot - ${entityData.name}`,
      priority: 'medium'
    });

    sources.push({
      url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(entityData.name)}`,
      type: 'competitive',
      subtype: 'glassdoor',
      name: `Glassdoor - ${entityData.name}`,
      priority: 'medium'
    });

    return sources;
  }

  /**
   * Discover stakeholder sources
   */
  async discoverStakeholderSources(entityData) {
    const sources = [];
    
    // Industry associations
    const associations = await this.findIndustryAssociations(entityData.industry);
    sources.push(...associations);
    
    // Partner ecosystems
    if (entityData.partners) {
      for (const partner of entityData.partners) {
        sources.push({
          url: `https://www.${this.generateBaseUrl(partner)}.com`,
          type: 'stakeholder',
          subtype: 'partner',
          name: partner,
          priority: 'medium'
        });
      }
    }

    // Investor sources
    if (entityData.investors) {
      for (const investor of entityData.investors) {
        sources.push({
          url: `https://www.${this.generateBaseUrl(investor)}.com`,
          type: 'stakeholder',
          subtype: 'investor',
          name: investor,
          priority: 'medium'
        });
      }
    }

    return sources;
  }

  /**
   * PHASE 3: SOURCE VALIDATION
   * Validates that sources are accessible and relevant
   */
  async validateSources(sourcesObj) {
    console.log('✅ Validating sources...');
    const validatedSources = [];
    
    for (const [category, sources] of Object.entries(sourcesObj)) {
      for (const source of sources) {
        const validation = await this.validateSingleSource(source);
        if (validation.isValid) {
          validatedSources.push({
            ...source,
            validation: validation,
            category: category
          });
        }
      }
    }
    
    console.log(`Validated ${validatedSources.length} sources`);
    return validatedSources;
  }

  /**
   * Validate a single source
   */
  async validateSingleSource(source) {
    try {
      // Check if URL is accessible
      const response = await axios.head(source.url, {
        timeout: 5000,
        validateStatus: status => status < 500
      });
      
      return {
        isValid: response.status < 400,
        statusCode: response.status,
        contentType: response.headers['content-type'],
        lastModified: response.headers['last-modified'],
        validatedAt: new Date()
      };
    } catch (error) {
      // Try GET if HEAD fails
      try {
        const response = await axios.get(source.url, {
          timeout: 5000,
          maxContentLength: 1000,
          validateStatus: status => status < 500
        });
        
        return {
          isValid: response.status < 400,
          statusCode: response.status,
          validatedAt: new Date()
        };
      } catch (err) {
        return {
          isValid: false,
          error: err.message,
          validatedAt: new Date()
        };
      }
    }
  }

  /**
   * PHASE 4: CONTENT ANALYSIS
   * Analyzes content from validated sources
   */
  async analyzeSourceContent(sources) {
    console.log('📝 Analyzing source content...');
    const analyzedSources = [];
    
    // Sample content from each source
    for (const source of sources.slice(0, 50)) { // Limit for performance
      const content = await this.extractSourceContent(source);
      
      if (content) {
        const analysis = await this.analyzeContent(content, source);
        analyzedSources.push({
          ...source,
          contentAnalysis: analysis
        });
      } else {
        analyzedSources.push(source);
      }
    }
    
    return analyzedSources;
  }

  /**
   * Extract content from a source
   */
  async extractSourceContent(source) {
    try {
      if (source.url.includes('.rss') || source.url.includes('/rss') || source.subtype === 'rss') {
        // Parse RSS feed
        const feed = await this.parser.parseURL(source.url);
        return {
          type: 'rss',
          title: feed.title,
          description: feed.description,
          items: feed.items.slice(0, 5),
          itemCount: feed.items.length
        };
      } else {
        // Scrape web page
        const response = await axios.get(source.url, {
          timeout: 10000,
          maxContentLength: 100000
        });
        
        const $ = cheerio.load(response.data);
        
        return {
          type: 'html',
          title: $('title').text(),
          description: $('meta[name="description"]').attr('content'),
          headings: $('h1, h2').map((i, el) => $(el).text()).get().slice(0, 10),
          links: $('a').length,
          images: $('img').length
        };
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze extracted content
   */
  async analyzeContent(content, source) {
    const prompt = `Analyze this content source for quality and relevance:
    
    Source: ${source.name}
    URL: ${source.url}
    Content Type: ${content.type}
    
    Content Sample:
    ${JSON.stringify(content, null, 2).substring(0, 1000)}
    
    Evaluate:
    1. Content freshness (how recent)
    2. Update frequency
    3. Content depth and quality
    4. Relevance to monitoring
    5. Unique value proposition
    
    Return JSON with scores (0-10) for each criterion.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.getDefaultContentScore();
    } catch (error) {
      return this.getDefaultContentScore();
    }
  }

  /**
   * PHASE 5: QUALITY SCORING
   * Scores sources based on multiple criteria
   */
  async scoreSourceQuality(sources) {
    console.log('⭐ Scoring source quality...');
    
    const scoredSources = sources.map(source => {
      const score = this.calculateQualityScore(source);
      return {
        ...source,
        qualityScore: score,
        tier: this.assignTier(score.overall)
      };
    });
    
    // Sort by quality score
    scoredSources.sort((a, b) => b.qualityScore.overall - a.qualityScore.overall);
    
    return scoredSources;
  }

  /**
   * Calculate quality score for a source
   */
  calculateQualityScore(source) {
    const scores = {
      accessibility: source.validation?.isValid ? 10 : 0,
      relevance: source.contentAnalysis?.relevance || 5,
      freshness: source.contentAnalysis?.freshness || 5,
      authority: this.calculateAuthorityScore(source),
      uniqueness: source.contentAnalysis?.uniqueValue || 5,
      updateFrequency: source.contentAnalysis?.updateFrequency || 5
    };
    
    // Calculate weighted overall score
    const weights = {
      accessibility: 0.2,
      relevance: 0.25,
      freshness: 0.15,
      authority: 0.2,
      uniqueness: 0.1,
      updateFrequency: 0.1
    };
    
    let overall = 0;
    for (const [criterion, score] of Object.entries(scores)) {
      overall += score * weights[criterion];
    }
    
    return {
      ...scores,
      overall: Math.round(overall * 10) / 10
    };
  }

  /**
   * Calculate authority score based on source type and domain
   */
  calculateAuthorityScore(source) {
    const authorityMap = {
      'official': 10,
      'regulatory': 9,
      'news': 7,
      'financial': 8,
      'academic': 8,
      'industry': 7,
      'technical': 6,
      'competitive': 6,
      'social': 5,
      'stakeholder': 6
    };
    
    return authorityMap[source.type] || 5;
  }

  /**
   * Assign tier based on overall score
   */
  assignTier(score) {
    if (score >= 8) return 'tier1';
    if (score >= 6) return 'tier2';
    if (score >= 4) return 'tier3';
    return 'tier4';
  }

  /**
   * PHASE 6: CATEGORIZATION
   * Organizes sources into meaningful categories
   */
  async categorizeSources(sources) {
    console.log('📁 Categorizing sources...');
    
    const categorized = {
      byType: {},
      byTier: {},
      byUpdateFrequency: {},
      byDataType: {},
      byPriority: {},
      byRegion: {},
      byLanguage: {}
    };
    
    for (const source of sources) {
      // By Type
      if (!categorized.byType[source.type]) {
        categorized.byType[source.type] = [];
      }
      categorized.byType[source.type].push(source);
      
      // By Tier
      if (!categorized.byTier[source.tier]) {
        categorized.byTier[source.tier] = [];
      }
      categorized.byTier[source.tier].push(source);
      
      // By Priority
      const priority = source.priority || 'medium';
      if (!categorized.byPriority[priority]) {
        categorized.byPriority[priority] = [];
      }
      categorized.byPriority[priority].push(source);
    }
    
    return {
      sources: sources,
      categories: categorized,
      statistics: this.generateStatistics(sources, categorized)
    };
  }

  /**
   * Generate statistics about indexed sources
   */
  generateStatistics(sources, categorized) {
    return {
      totalSources: sources.length,
      validSources: sources.filter(s => s.validation?.isValid).length,
      averageQuality: sources.reduce((sum, s) => sum + (s.qualityScore?.overall || 0), 0) / sources.length,
      byType: Object.keys(categorized.byType).map(type => ({
        type: type,
        count: categorized.byType[type].length
      })),
      byTier: Object.keys(categorized.byTier).map(tier => ({
        tier: tier,
        count: categorized.byTier[tier].length
      })),
      topSources: sources.slice(0, 10).map(s => ({
        name: s.name,
        score: s.qualityScore?.overall
      }))
    };
  }

  /**
   * PHASE 7: INDEX STORAGE
   * Stores the index in the database
   */
  async storeIndex(entityType, entityData, indexData) {
    console.log('💾 Storing index...');
    
    try {
      const result = await pool.query(
        `INSERT INTO source_indexes 
         (entity_type, entity_name, entity_data, index_data, statistics, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [
          entityType,
          entityData.name,
          JSON.stringify(entityData),
          JSON.stringify(indexData),
          JSON.stringify(indexData.statistics)
        ]
      );
      
      console.log(`✅ Index stored with ID: ${result.rows[0].id}`);
      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to store index:', error);
      throw error;
    }
  }

  /**
   * BULK INDEXING
   * Index multiple entities in batch
   */
  async bulkIndex(entities, options = {}) {
    console.log(`🚀 Starting bulk indexing for ${entities.length} entities`);
    const results = [];
    
    for (const entity of entities) {
      try {
        const result = await this.indexEntity(entity.type, entity.data, options);
        results.push({
          entity: entity.data.name,
          success: true,
          indexId: result.indexId,
          sourceCount: result.categorizedSources.sources.length
        });
      } catch (error) {
        results.push({
          entity: entity.data.name,
          success: false,
          error: error.message
        });
      }
      
      // Rate limiting
      await this.delay(options.delayMs || 2000);
    }
    
    return results;
  }

  /**
   * CONTINUOUS INDEX UPDATES
   * Keep indexes fresh with continuous updates
   */
  async startContinuousIndexing(entityType, entityData, interval = 24 * 60 * 60 * 1000) {
    console.log(`🔄 Starting continuous indexing for ${entityData.name}`);
    
    const indexingJob = {
      id: `index-${Date.now()}`,
      entityType,
      entityData,
      interval,
      status: 'active',
      lastRun: null,
      nextRun: new Date(Date.now() + interval)
    };
    
    const runIndexing = async () => {
      if (indexingJob.status !== 'active') return;
      
      console.log(`Running scheduled indexing for ${entityData.name}`);
      indexingJob.lastRun = new Date();
      
      try {
        await this.indexEntity(entityType, entityData);
      } catch (error) {
        console.error(`Indexing failed for ${entityData.name}:`, error);
      }
      
      indexingJob.nextRun = new Date(Date.now() + interval);
      
      if (indexingJob.status === 'active') {
        setTimeout(runIndexing, interval);
      }
    };
    
    // Start first run
    setTimeout(runIndexing, 1000);
    
    return indexingJob;
  }

  /**
   * SEARCH INDEXED SOURCES
   * Search through indexed sources
   */
  async searchIndexes(query, filters = {}) {
    try {
      let sql = `
        SELECT id, entity_type, entity_name, entity_data, statistics, created_at
        FROM source_indexes
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (query) {
        sql += ` AND (entity_name ILIKE $${paramIndex} OR entity_data::text ILIKE $${paramIndex})`;
        params.push(`%${query}%`);
        paramIndex++;
      }
      
      if (filters.entityType) {
        sql += ` AND entity_type = $${paramIndex}`;
        params.push(filters.entityType);
        paramIndex++;
      }
      
      sql += ' ORDER BY created_at DESC LIMIT 100';
      
      const result = await pool.query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * GET INDEX DETAILS
   * Retrieve full index data
   */
  async getIndex(indexId) {
    try {
      const result = await pool.query(
        'SELECT * FROM source_indexes WHERE id = $1',
        [indexId]
      );
      
      if (result.rows.length > 0) {
        const index = result.rows[0];
        index.index_data = JSON.parse(index.index_data);
        index.entity_data = JSON.parse(index.entity_data);
        index.statistics = JSON.parse(index.statistics);
        return index;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get index:', error);
      return null;
    }
  }

  // Helper methods
  
  generateBaseUrl(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  }
  
  generateSocialHandle(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  }
  
  detectSubtype(url) {
    if (url.includes('/ir.') || url.includes('investor')) return 'investor_relations';
    if (url.includes('news')) return 'newsroom';
    if (url.includes('blog')) return 'blog';
    if (url.includes('developer')) return 'developer';
    return 'main_site';
  }
  
  getDefaultProfile(entityType, entityData) {
    return {
      name: entityData.name,
      type: entityType,
      characteristics: [],
      relatedEntities: [],
      industry: entityData.industry || 'general',
      geography: [],
      topics: [],
      stakeholders: []
    };
  }
  
  getDefaultContentScore() {
    return {
      freshness: 5,
      updateFrequency: 5,
      depth: 5,
      relevance: 5,
      uniqueValue: 5
    };
  }
  
  getDefaultIndustrySources(industry) {
    // Return default sources based on industry
    const defaults = {
      'technology': [
        { url: 'https://techcrunch.com', name: 'TechCrunch', type: 'industry', priority: 'high' },
        { url: 'https://www.theverge.com', name: 'The Verge', type: 'industry', priority: 'high' },
        { url: 'https://arstechnica.com', name: 'Ars Technica', type: 'industry', priority: 'medium' }
      ],
      'finance': [
        { url: 'https://www.bloomberg.com', name: 'Bloomberg', type: 'industry', priority: 'high' },
        { url: 'https://www.ft.com', name: 'Financial Times', type: 'industry', priority: 'high' },
        { url: 'https://www.wsj.com', name: 'Wall Street Journal', type: 'industry', priority: 'high' }
      ],
      'healthcare': [
        { url: 'https://www.statnews.com', name: 'STAT News', type: 'industry', priority: 'high' },
        { url: 'https://www.fiercehealthcare.com', name: 'Fierce Healthcare', type: 'industry', priority: 'high' },
        { url: 'https://www.modernhealthcare.com', name: 'Modern Healthcare', type: 'industry', priority: 'medium' }
      ]
    };
    
    return defaults[industry.toLowerCase()] || [];
  }
  
  getIndustryRegulators(industry) {
    const regulators = {
      'finance': [
        { url: 'https://www.sec.gov', name: 'SEC', type: 'regulatory', priority: 'critical' },
        { url: 'https://www.finra.org', name: 'FINRA', type: 'regulatory', priority: 'high' },
        { url: 'https://www.cftc.gov', name: 'CFTC', type: 'regulatory', priority: 'high' }
      ],
      'healthcare': [
        { url: 'https://www.fda.gov', name: 'FDA', type: 'regulatory', priority: 'critical' },
        { url: 'https://www.cms.gov', name: 'CMS', type: 'regulatory', priority: 'high' },
        { url: 'https://www.hhs.gov', name: 'HHS', type: 'regulatory', priority: 'high' }
      ],
      'energy': [
        { url: 'https://www.ferc.gov', name: 'FERC', type: 'regulatory', priority: 'high' },
        { url: 'https://www.energy.gov', name: 'DOE', type: 'regulatory', priority: 'high' },
        { url: 'https://www.epa.gov', name: 'EPA', type: 'regulatory', priority: 'critical' }
      ]
    };
    
    return regulators[industry.toLowerCase()] || [];
  }
  
  async findIndustryAssociations(industry) {
    // This would use Claude to find relevant associations
    return [];
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = IntelligentIndexingAgent;