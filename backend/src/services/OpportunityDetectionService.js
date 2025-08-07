/**
 * OpportunityDetectionService.js
 * Integrates RSS/API monitoring with pattern detection, cascade intelligence, and stakeholder predictions
 */

const pool = require('../config/db');
const Parser = require('rss-parser');
const axios = require('axios');
const claudeService = require('../../config/claude');
const EventEmitter = require('events');
const IntelligentIndexingAgent = require('./IntelligentIndexingAgent');

class OpportunityDetectionService extends EventEmitter {
  constructor() {
    super();
    this.parser = new Parser();
    this.indexingAgent = new IntelligentIndexingAgent();
    this.monitoringInterval = null;
    this.patterns = null;
    this.stakeholderProfiles = new Map();
    this.cascadeSimulator = new CascadeIntelligenceEngine();
    this.isMonitoring = false;
    this.sourceIndexCache = new Map();
    
    // Initialize pattern library on startup
    this.loadPatterns();
  }

  /**
   * Start continuous monitoring for an organization
   */
  async startMonitoring(organizationId, config = {}) {
    console.log(`Starting opportunity monitoring for organization: ${organizationId}`);
    
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    
    // Load stakeholder profiles for prediction
    await this.loadStakeholderProfiles(organizationId);
    
    // Initial scan
    await this.scanForOpportunities(organizationId);
    
    // Set up continuous monitoring (every 5 minutes by default)
    const interval = config.intervalMinutes || 5;
    this.monitoringInterval = setInterval(async () => {
      await this.scanForOpportunities(organizationId);
    }, interval * 60 * 1000);
    
    console.log(`Monitoring started with ${interval} minute intervals`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('Monitoring stopped');
    }
  }

  /**
   * Main scanning function - integrates all detection methods
   */
  async scanForOpportunities(organizationId) {
    try {
      console.log(`Scanning for opportunities at ${new Date().toISOString()}`);
      
      // 1. Gather signals from all sources
      const signals = await this.gatherSignals(organizationId);
      
      // 2. Detect patterns in signals
      const detectedPatterns = await this.detectPatterns(signals);
      
      // 3. Predict stakeholder actions
      const stakeholderPredictions = await this.predictStakeholderActions(signals, organizationId);
      
      // 4. Analyze cascade potential
      const cascadeOpportunities = await this.analyzeCascadeEffects(signals);
      
      // 5. Score and prioritize opportunities
      const opportunities = await this.scoreOpportunities([
        ...detectedPatterns,
        ...stakeholderPredictions,
        ...cascadeOpportunities
      ], organizationId);
      
      // 6. Store high-value opportunities
      await this.storeOpportunities(opportunities, organizationId);
      
      // 7. Emit events for real-time updates
      this.emit('opportunities-detected', {
        organizationId,
        count: opportunities.length,
        critical: opportunities.filter(o => o.urgency === 'critical').length
      });
      
      return opportunities;
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
      this.emit('scan-error', { organizationId, error: error.message });
      return [];
    }
  }

  /**
   * Gather signals from RSS feeds, APIs, and indexed sources
   */
  async gatherSignals(organizationId) {
    const signals = [];
    
    // Get organization's monitoring configuration
    const config = await this.getMonitoringConfig(organizationId);
    
    // 0. FIRST CHECK FOR INDEXED SOURCES
    const indexedSources = await this.getIndexedSourcesForOrg(organizationId, config);
    if (indexedSources && indexedSources.length > 0) {
      console.log(`📚 Using ${indexedSources.length} indexed sources for opportunity detection`);
      
      // Fetch signals from high-quality indexed sources
      const indexedSignals = await this.fetchSignalsFromIndexedSources(indexedSources, config.keywords || []);
      signals.push(...indexedSignals);
      
      // Track which sources contributed
      console.log(`- Tier 1 sources: ${indexedSources.filter(s => s.tier === 'tier1').length}`);
      console.log(`- Real-time sources: ${indexedSources.filter(s => s.type === 'social').length}`);
      console.log(`- Financial sources: ${indexedSources.filter(s => s.type === 'financial').length}`);
    }
    
    // 1. RSS Feed Monitoring (supplement with non-indexed feeds)
    const rssSignals = await this.fetchRSSSignals(config.keywords || []);
    signals.push(...rssSignals);
    
    // 2. News API Monitoring
    if (process.env.NEWS_API_KEY) {
      const newsSignals = await this.fetchNewsAPISignals(config.keywords || []);
      signals.push(...newsSignals);
    }
    
    // 3. Reddit Monitoring
    if (config.sources?.reddit) {
      const redditSignals = await this.fetchRedditSignals(config.keywords || []);
      signals.push(...redditSignals);
    }
    
    // 4. SEC EDGAR Monitoring (for regulatory/financial signals)
    if (config.sources?.regulatory) {
      const secSignals = await this.fetchSECSignals(organizationId);
      signals.push(...secSignals);
    }
    
    // 5. Patent Database Monitoring (for competitive intelligence)
    if (config.sources?.patents) {
      const patentSignals = await this.fetchPatentSignals(config.competitors || []);
      signals.push(...patentSignals);
    }
    
    console.log(`Gathered ${signals.length} total signals (including ${indexedSources?.length || 0} indexed sources)`);
    return signals;
  }

  /**
   * Fetch signals from RSS feeds
   */
  async fetchRSSSignals(keywords) {
    const feeds = [
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
      { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best', category: 'business' },
      { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF', category: 'tech' },
      { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'finance' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' }
    ];
    
    const signals = [];
    
    for (const feed of feeds) {
      try {
        const parsedFeed = await Promise.race([
          this.parser.parseURL(feed.url),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        for (const item of parsedFeed.items.slice(0, 10)) {
          const signal = {
            id: `rss-${Date.now()}-${Math.random()}`,
            source: feed.name,
            category: feed.category,
            title: item.title,
            content: item.contentSnippet || item.content,
            url: item.link,
            publishedAt: new Date(item.pubDate || Date.now()),
            type: 'news',
            rawData: item
          };
          
          // Check keyword relevance
          const relevance = this.calculateRelevance(signal, keywords);
          if (relevance > 0.3) {
            signal.relevance = relevance;
            signals.push(signal);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${feed.name}:`, error.message);
      }
    }
    
    return signals;
  }

  /**
   * Detect patterns in signals
   */
  async detectPatterns(signals) {
    const detectedOpportunities = [];
    
    if (!this.patterns) {
      await this.loadPatterns();
    }
    
    for (const pattern of this.patterns) {
      const matchScore = await this.calculatePatternMatch(signals, pattern);
      
      if (matchScore > 0.6) {
        const opportunity = {
          id: `opp-${Date.now()}-${Math.random()}`,
          patternId: pattern.id,
          patternName: pattern.name,
          type: pattern.type,
          title: `${pattern.name} Detected`,
          description: pattern.description,
          score: matchScore * 100,
          confidence: matchScore,
          urgency: this.calculateUrgency(pattern.action_window),
          windowStart: new Date(),
          windowEnd: this.calculateWindowEnd(pattern.action_window),
          recommendedActions: pattern.recommended_action,
          supportingSignals: signals.filter(s => this.signalMatchesPattern(s, pattern)),
          detectedAt: new Date()
        };
        
        detectedOpportunities.push(opportunity);
      }
    }
    
    return detectedOpportunities;
  }

  /**
   * Predict stakeholder actions based on signals
   */
  async predictStakeholderActions(signals, organizationId) {
    const predictions = [];
    
    // Group signals by potential stakeholder impact
    const stakeholderSignals = this.mapSignalsToStakeholders(signals);
    
    for (const [stakeholderType, relevantSignals] of Object.entries(stakeholderSignals)) {
      if (relevantSignals.length === 0) continue;
      
      const profile = this.stakeholderProfiles.get(stakeholderType);
      if (!profile) continue;
      
      // Check against known stakeholder patterns
      const patternMatch = await this.matchStakeholderPattern(relevantSignals, profile);
      
      if (patternMatch.probability > 0.5) {
        const prediction = {
          id: `pred-${Date.now()}-${Math.random()}`,
          type: 'stakeholder_action',
          stakeholderType,
          title: `${stakeholderType} Action Predicted: ${patternMatch.action}`,
          description: `${stakeholderType} likely to ${patternMatch.action} based on recent signals`,
          probability: patternMatch.probability,
          timeframe: patternMatch.timeframe,
          urgency: this.calculateStakeholderUrgency(patternMatch.timeframe),
          expectedAction: patternMatch.action,
          triggerSignals: relevantSignals,
          recommendedResponse: this.generateStakeholderResponse(stakeholderType, patternMatch.action),
          cascadePotential: patternMatch.cascadePotential || 'medium'
        };
        
        predictions.push(prediction);
      }
    }
    
    return predictions;
  }

  /**
   * Analyze cascade effects from signals
   */
  async analyzeCascadeEffects(signals) {
    const cascadeOpportunities = [];
    
    // Identify potential trigger events
    const triggerEvents = signals.filter(s => 
      s.category === 'finance' || 
      s.category === 'regulatory' ||
      (s.content && s.content.match(/bankruptcy|acquisition|merger|investigation|lawsuit/i))
    );
    
    for (const trigger of triggerEvents) {
      const cascade = await this.cascadeSimulator.simulateCascade(trigger);
      
      if (cascade.opportunities.length > 0) {
        for (const opp of cascade.opportunities) {
          cascadeOpportunities.push({
            id: `cascade-${Date.now()}-${Math.random()}`,
            type: 'cascade',
            title: `Cascade Opportunity: ${opp.description}`,
            description: `Predicted cascade effect from ${trigger.title}`,
            triggerEvent: trigger,
            firstOrderEffects: cascade.firstOrder,
            secondOrderEffects: cascade.secondOrder,
            thirdOrderEffects: cascade.thirdOrder,
            timeToAction: opp.timeWindow,
            urgency: opp.urgency,
            confidence: cascade.confidence,
            recommendedAction: opp.action
          });
        }
      }
    }
    
    return cascadeOpportunities;
  }

  /**
   * Score and prioritize opportunities
   */
  async scoreOpportunities(opportunities, organizationId) {
    const scoredOpportunities = [];
    
    // Get organization readiness
    const readiness = await this.getOrganizationReadiness(organizationId);
    
    for (const opp of opportunities) {
      // Calculate dynamic score
      const baseScore = opp.score || (opp.confidence * 100) || 50;
      
      // Apply multipliers
      const timingMultiplier = this.getTimingMultiplier(opp.urgency);
      const readinessMultiplier = this.getReadinessMultiplier(readiness, opp.type);
      const competitiveMultiplier = await this.getCompetitiveMultiplier(opp);
      const cascadeMultiplier = opp.cascadePotential === 'high' ? 1.5 : 1.0;
      
      const finalScore = baseScore * timingMultiplier * readinessMultiplier * 
                        competitiveMultiplier * cascadeMultiplier;
      
      scoredOpportunities.push({
        ...opp,
        score: Math.min(100, finalScore),
        scoreBreakdown: {
          base: baseScore,
          timing: timingMultiplier,
          readiness: readinessMultiplier,
          competitive: competitiveMultiplier,
          cascade: cascadeMultiplier
        }
      });
    }
    
    // Sort by score
    return scoredOpportunities.sort((a, b) => b.score - a.score);
  }

  /**
   * Store opportunities in database
   */
  async storeOpportunities(opportunities, organizationId) {
    for (const opp of opportunities.slice(0, 10)) { // Store top 10
      try {
        await pool.query(
          `INSERT INTO opportunity_queue 
           (organization_id, pattern_name, source_type, score, confidence, 
            window_start, window_end, urgency, title, description, 
            key_points, recommended_actions, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT DO NOTHING`,
          [
            organizationId,
            opp.patternName || opp.type,
            'api',
            opp.score,
            opp.confidence || 0.7,
            opp.windowStart || new Date(),
            opp.windowEnd || new Date(Date.now() + 24 * 60 * 60 * 1000),
            opp.urgency || 'medium',
            opp.title,
            opp.description,
            JSON.stringify(opp.keyPoints || []),
            JSON.stringify([opp.recommendedAction || opp.recommendedActions]),
            JSON.stringify(opp)
          ]
        );
        
        console.log(`Stored opportunity: ${opp.title}`);
      } catch (error) {
        console.error('Error storing opportunity:', error);
      }
    }
  }

  /**
   * Helper: Calculate pattern match score
   */
  async calculatePatternMatch(signals, pattern) {
    let matchScore = 0;
    const triggers = pattern.signals?.triggers || [];
    const threshold = pattern.signals?.threshold || 0.6;
    
    for (const trigger of triggers) {
      const matchingSignals = signals.filter(s => 
        s.content?.toLowerCase().includes(trigger.toLowerCase()) ||
        s.title?.toLowerCase().includes(trigger.toLowerCase())
      );
      
      if (matchingSignals.length > 0) {
        matchScore += (1 / triggers.length);
      }
    }
    
    return matchScore >= threshold ? matchScore : 0;
  }

  /**
   * Helper: Map signals to stakeholder types
   */
  mapSignalsToStakeholders(signals) {
    const stakeholderSignals = {
      regulators: [],
      activists: [],
      investors: [],
      competitors: [],
      customers: [],
      employees: [],
      media: []
    };
    
    for (const signal of signals) {
      // Regulatory signals
      if (signal.content?.match(/SEC|FTC|DOJ|regulation|compliance|investigation/i)) {
        stakeholderSignals.regulators.push(signal);
      }
      
      // Investor signals
      if (signal.content?.match(/earnings|stock|investor|shareholder|IPO|acquisition/i)) {
        stakeholderSignals.investors.push(signal);
      }
      
      // Activist signals
      if (signal.content?.match(/activist|campaign|proxy|board|governance/i)) {
        stakeholderSignals.activists.push(signal);
      }
      
      // Competitor signals
      if (signal.content?.match(/competitor|rival|market share|pricing/i)) {
        stakeholderSignals.competitors.push(signal);
      }
      
      // Customer signals
      if (signal.content?.match(/customer|user|satisfaction|complaint|boycott/i)) {
        stakeholderSignals.customers.push(signal);
      }
      
      // Employee signals
      if (signal.content?.match(/employee|layoff|hiring|culture|union/i)) {
        stakeholderSignals.employees.push(signal);
      }
      
      // Media signals (all signals are potential media signals)
      stakeholderSignals.media.push(signal);
    }
    
    return stakeholderSignals;
  }

  /**
   * Helper: Match stakeholder pattern
   */
  async matchStakeholderPattern(signals, profile) {
    // Simplified pattern matching - in production, use ML models
    const signalStrength = signals.length / 10; // Normalize
    const recentSignals = signals.filter(s => 
      (Date.now() - new Date(s.publishedAt)) < 7 * 24 * 60 * 60 * 1000
    );
    
    const velocity = recentSignals.length / signals.length;
    
    // Determine likely action based on signal patterns
    let action = 'monitor situation';
    let timeframe = '30 days';
    let cascadePotential = 'low';
    
    if (velocity > 0.7 && signalStrength > 0.5) {
      action = 'take immediate action';
      timeframe = '7 days';
      cascadePotential = 'high';
    } else if (velocity > 0.5) {
      action = 'prepare response';
      timeframe = '14 days';
      cascadePotential = 'medium';
    }
    
    return {
      probability: Math.min(1, signalStrength * velocity * 1.5),
      action,
      timeframe,
      cascadePotential
    };
  }

  /**
   * Helper: Load patterns from database
   */
  async loadPatterns() {
    try {
      const result = await pool.query('SELECT * FROM opportunity_patterns ORDER BY success_rate DESC');
      this.patterns = result.rows;
      console.log(`Loaded ${this.patterns.length} opportunity patterns`);
    } catch (error) {
      console.error('Error loading patterns:', error);
      // Fallback to default patterns
      this.patterns = [
        {
          id: 'default-1',
          name: 'Competitor Weakness',
          type: 'competitive',
          description: 'Competitor facing challenges',
          signals: { triggers: ['lawsuit', 'investigation', 'layoff', 'breach'], threshold: 0.6 },
          action_window: '24-48 hours',
          recommended_action: 'Position as stable alternative'
        },
        {
          id: 'default-2',
          name: 'Narrative Vacuum',
          type: 'thought_leadership',
          description: 'Topic trending with no clear expert',
          signals: { triggers: ['debate', 'controversy', 'unclear', 'questions'], threshold: 0.5 },
          action_window: '3-5 days',
          recommended_action: 'Provide expert commentary'
        }
      ];
    }
  }

  /**
   * Helper: Load stakeholder profiles
   */
  async loadStakeholderProfiles(organizationId) {
    try {
      const result = await pool.query(
        'SELECT * FROM stakeholder_profiles WHERE company_id = $1',
        [organizationId]
      );
      
      for (const profile of result.rows) {
        this.stakeholderProfiles.set(profile.stakeholder_type, profile);
      }
      
      console.log(`Loaded ${result.rows.length} stakeholder profiles`);
    } catch (error) {
      console.error('Error loading stakeholder profiles:', error);
      // Set default profiles
      this.stakeholderProfiles.set('regulators', { type: 'regulators', sensitivity: 'high' });
      this.stakeholderProfiles.set('investors', { type: 'investors', sensitivity: 'medium' });
      this.stakeholderProfiles.set('customers', { type: 'customers', sensitivity: 'high' });
    }
  }

  /**
   * Helper: Get monitoring configuration
   */
  async getMonitoringConfig(organizationId) {
    try {
      const result = await pool.query(
        'SELECT config_data FROM monitoring_configs WHERE user_id = $1',
        [organizationId]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0].config_data;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    
    // Return default config
    return {
      keywords: ['industry', 'market', 'technology'],
      sources: {
        rss: true,
        news: true,
        reddit: false,
        regulatory: true,
        patents: false
      },
      competitors: []
    };
  }

  /**
   * Helper: Calculate relevance score
   */
  calculateRelevance(signal, keywords) {
    if (!keywords || keywords.length === 0) return 1;
    
    const text = `${signal.title} ${signal.content}`.toLowerCase();
    let matches = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    return matches / keywords.length;
  }

  /**
   * Helper: Calculate urgency from time window
   */
  calculateUrgency(timeWindow) {
    if (!timeWindow) return 'medium';
    
    if (timeWindow.includes('hour')) return 'critical';
    if (timeWindow.includes('1-') || timeWindow.includes('2-')) return 'high';
    if (timeWindow.includes('day')) return 'medium';
    return 'low';
  }

  /**
   * Helper: Calculate window end time
   */
  calculateWindowEnd(timeWindow) {
    if (!timeWindow) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const now = Date.now();
    if (timeWindow.includes('hour')) {
      const hours = parseInt(timeWindow.match(/\d+/)?.[0] || '24');
      return new Date(now + hours * 60 * 60 * 1000);
    }
    if (timeWindow.includes('day')) {
      const days = parseInt(timeWindow.match(/\d+/)?.[0] || '7');
      return new Date(now + days * 24 * 60 * 60 * 1000);
    }
    if (timeWindow.includes('week')) {
      const weeks = parseInt(timeWindow.match(/\d+/)?.[0] || '2');
      return new Date(now + weeks * 7 * 24 * 60 * 60 * 1000);
    }
    
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Helper: Get timing multiplier
   */
  getTimingMultiplier(urgency) {
    switch (urgency) {
      case 'critical': return 2.0;
      case 'high': return 1.5;
      case 'medium': return 1.0;
      case 'low': return 0.7;
      default: return 1.0;
    }
  }

  /**
   * Helper: Get organization readiness
   */
  async getOrganizationReadiness(organizationId) {
    // In production, calculate from actual org data
    return {
      resources: 0.7,
      agility: 0.8,
      expertise: 0.75
    };
  }

  /**
   * Helper: Get readiness multiplier
   */
  getReadinessMultiplier(readiness, oppType) {
    const avgReadiness = (readiness.resources + readiness.agility + readiness.expertise) / 3;
    return 0.5 + (avgReadiness * 0.5);
  }

  /**
   * Helper: Get competitive multiplier
   */
  async getCompetitiveMultiplier(opportunity) {
    // Check if competitors are likely aware
    if (opportunity.type === 'competitive' || opportunity.urgency === 'critical') {
      return 1.3; // First mover advantage
    }
    return 1.0;
  }

  /**
   * Helper: Generate stakeholder response
   */
  generateStakeholderResponse(stakeholderType, action) {
    const responses = {
      regulators: {
        'take immediate action': 'Prepare compliance documentation and legal response',
        'prepare response': 'Review compliance posture and prepare briefings',
        'monitor situation': 'Track regulatory developments'
      },
      investors: {
        'take immediate action': 'Schedule investor calls and prepare market update',
        'prepare response': 'Update investor materials and FAQ',
        'monitor situation': 'Monitor investor sentiment'
      },
      activists: {
        'take immediate action': 'Engage board and prepare defense strategy',
        'prepare response': 'Review governance and prepare talking points',
        'monitor situation': 'Track activist positions'
      },
      customers: {
        'take immediate action': 'Activate customer service surge and PR response',
        'prepare response': 'Prepare customer communications',
        'monitor situation': 'Monitor customer sentiment'
      }
    };
    
    return responses[stakeholderType]?.[action] || 'Continue monitoring';
  }

  /**
   * Helper: Calculate stakeholder urgency
   */
  calculateStakeholderUrgency(timeframe) {
    if (!timeframe) return 'medium';
    
    const days = parseInt(timeframe.match(/\d+/)?.[0] || '30');
    if (days <= 7) return 'critical';
    if (days <= 14) return 'high';
    if (days <= 30) return 'medium';
    return 'low';
  }

  /**
   * Helper: Check if signal matches pattern
   */
  signalMatchesPattern(signal, pattern) {
    const triggers = pattern.signals?.triggers || [];
    const text = `${signal.title} ${signal.content}`.toLowerCase();
    
    return triggers.some(trigger => text.includes(trigger.toLowerCase()));
  }

  // Additional API fetching methods would go here...
  async fetchNewsAPISignals(keywords) {
    // Implementation for NewsAPI
    return [];
  }

  async fetchRedditSignals(keywords) {
    // Implementation for Reddit API
    return [];
  }

  async fetchSECSignals(organizationId) {
    // Implementation for SEC EDGAR
    return [];
  }

  async fetchPatentSignals(competitors) {
    // Implementation for Patent API
    return [];
  }
  /**
   * Get indexed sources for organization
   */
  async getIndexedSourcesForOrg(organizationId, config) {
    try {
      const sources = [];
      
      // Get organization name from config or database
      const orgName = config.organizationName || await this.getOrganizationName(organizationId);
      
      // 1. Get company-specific sources
      if (orgName) {
        const companyResult = await pool.query(
          `SELECT index_data FROM source_indexes 
           WHERE entity_type = 'company' 
           AND LOWER(entity_name) = LOWER($1)
           AND active = true
           ORDER BY quality_score DESC, created_at DESC
           LIMIT 1`,
          [orgName]
        );
        
        if (companyResult.rows.length > 0) {
          const indexData = JSON.parse(companyResult.rows[0].index_data);
          if (indexData.sources) {
            // Filter for high-quality sources relevant to opportunities
            const opportunitySources = indexData.sources.filter(s => 
              s.qualityScore?.overall > 6 && 
              ['news', 'financial', 'regulatory', 'competitive', 'social'].includes(s.type)
            );
            sources.push(...opportunitySources);
          }
        }
      }
      
      // 2. Get competitor sources for competitive intelligence
      if (config.competitors && config.competitors.length > 0) {
        for (const competitor of config.competitors.slice(0, 3)) { // Limit to top 3
          const compResult = await pool.query(
            `SELECT index_data FROM source_indexes 
             WHERE entity_type = 'company'
             AND LOWER(entity_name) = LOWER($1)
             AND active = true
             ORDER BY quality_score DESC
             LIMIT 1`,
            [competitor]
          );
          
          if (compResult.rows.length > 0) {
            const indexData = JSON.parse(compResult.rows[0].index_data);
            if (indexData.sources) {
              // Get news and financial sources for competitors
              const competitorSources = indexData.sources
                .filter(s => ['news', 'financial'].includes(s.type) && s.qualityScore?.overall > 7)
                .slice(0, 5); // Top 5 per competitor
              sources.push(...competitorSources);
            }
          }
        }
      }
      
      // 3. Get industry sources for market opportunities
      if (config.industry) {
        const industryResult = await pool.query(
          `SELECT index_data FROM source_indexes 
           WHERE entity_type = 'industry'
           AND LOWER(entity_name) = LOWER($1)
           AND active = true
           ORDER BY created_at DESC
           LIMIT 1`,
          [config.industry]
        );
        
        if (industryResult.rows.length > 0) {
          const indexData = JSON.parse(industryResult.rows[0].index_data);
          if (indexData.sources) {
            // Get industry publications and news
            const industrySources = indexData.sources
              .filter(s => s.tier === 'tier1' || s.qualityScore?.overall > 8)
              .slice(0, 10);
            sources.push(...industrySources);
          }
        }
      }
      
      // Deduplicate sources by URL
      const uniqueSources = Array.from(
        new Map(sources.map(s => [s.url, s])).values()
      );
      
      // Sort by quality score and relevance
      uniqueSources.sort((a, b) => {
        const scoreA = (a.qualityScore?.overall || 0) + (a.priority === 'high' ? 2 : 0);
        const scoreB = (b.qualityScore?.overall || 0) + (b.priority === 'high' ? 2 : 0);
        return scoreB - scoreA;
      });
      
      return uniqueSources.slice(0, 50); // Return top 50 sources
    } catch (error) {
      console.error('Failed to get indexed sources:', error);
      return [];
    }
  }
  
  /**
   * Fetch signals from indexed sources
   */
  async fetchSignalsFromIndexedSources(sources, keywords) {
    const signals = [];
    const processedUrls = new Set();
    
    for (const source of sources) {
      // Skip duplicates
      if (processedUrls.has(source.url)) continue;
      processedUrls.add(source.url);
      
      try {
        // Handle different source types
        if (source.url.includes('.rss') || source.url.includes('/rss') || source.type === 'rss') {
          // RSS feed
          const feed = await this.parser.parseURL(source.url);
          const relevantItems = feed.items
            .filter(item => this.matchesKeywords(item.title + ' ' + item.contentSnippet, keywords))
            .slice(0, 5)
            .map(item => ({
              title: item.title,
              content: item.contentSnippet,
              url: item.link,
              date: item.pubDate || item.isoDate,
              source: source.name,
              sourceType: 'indexed_rss',
              tier: source.tier,
              qualityScore: source.qualityScore?.overall || 5,
              category: source.type
            }));
          
          signals.push(...relevantItems);
        } else if (source.type === 'api') {
          // API endpoint - make request
          const response = await axios.get(source.url, {
            timeout: 5000,
            headers: source.headers || {}
          });
          
          if (response.data) {
            signals.push({
              title: `API Data from ${source.name}`,
              content: JSON.stringify(response.data).substring(0, 500),
              url: source.url,
              date: new Date(),
              source: source.name,
              sourceType: 'indexed_api',
              tier: source.tier,
              qualityScore: source.qualityScore?.overall || 5,
              category: source.type
            });
          }
        }
        // For web sources, we'll rely on the regular scraping methods
        
      } catch (error) {
        console.log(`Failed to fetch from indexed source ${source.name}: ${error.message}`);
      }
    }
    
    console.log(`Fetched ${signals.length} signals from indexed sources`);
    return signals;
  }
  
  /**
   * Get organization name from database
   */
  async getOrganizationName(organizationId) {
    try {
      const result = await pool.query(
        'SELECT name FROM organizations WHERE id = $1',
        [organizationId]
      );
      return result.rows[0]?.name || null;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Cascade Intelligence Engine
 */
class CascadeIntelligenceEngine {
  async simulateCascade(triggerEvent) {
    const cascade = {
      trigger: triggerEvent,
      firstOrder: [],
      secondOrder: [],
      thirdOrder: [],
      opportunities: [],
      confidence: 0.7
    };
    
    // Analyze trigger event type
    if (triggerEvent.content?.match(/bankruptcy|acquisition|merger/i)) {
      cascade.firstOrder = ['Market share redistribution', 'Customer migration'];
      cascade.secondOrder = ['Competitive positioning shifts', 'Pricing changes'];
      cascade.thirdOrder = ['Industry consolidation', 'Regulatory scrutiny'];
      
      cascade.opportunities = [
        {
          description: 'Capture migrating customers',
          timeWindow: '1-3 days',
          urgency: 'critical',
          action: 'Launch targeted campaign for switching customers'
        },
        {
          description: 'Position as stable alternative',
          timeWindow: '3-7 days',
          urgency: 'high',
          action: 'Emphasize stability and continuity in messaging'
        }
      ];
    }
    
    if (triggerEvent.content?.match(/regulation|compliance|investigation/i)) {
      cascade.firstOrder = ['Industry-wide compliance review', 'Investor concern'];
      cascade.secondOrder = ['Market volatility', 'Competitive advantages'];
      cascade.thirdOrder = ['Industry transformation', 'New market entrants'];
      
      cascade.opportunities = [
        {
          description: 'Demonstrate compliance leadership',
          timeWindow: '1-2 weeks',
          urgency: 'medium',
          action: 'Publish compliance best practices whitepaper'
        }
      ];
    }
    
    return cascade;
  }
}

module.exports = OpportunityDetectionService;