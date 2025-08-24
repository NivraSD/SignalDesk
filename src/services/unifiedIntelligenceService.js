/**
 * Unified Intelligence Service
 * Connects: Company Profile → Stakeholders → Sources → Monitoring → Opportunity Discovery
 */

import stakeholderIntelligenceService from './stakeholderIntelligenceService';
import prDetectionService from './prDetectionService';
import narrativeVacuumService from './narrativeVacuumService';

class UnifiedIntelligenceService {
  constructor() {
    // Single source of truth for the entire intelligence flow
    this.companyProfile = null;
    this.stakeholders = [];
    this.sources = [];
    this.monitoringData = [];
    this.opportunities = [];
    this.goals = [];
    this.isInitialized = false;
    
    // Log state changes for debugging
    console.log('UnifiedIntelligenceService initialized');
  }

  /**
   * STEP 1: Initialize company profile and goals
   */
  async initializeCompany(data) {
    console.log('UnifiedService - Initializing company with data:', data);
    
    this.companyProfile = {
      id: Date.now(),
      company: data.company,
      url: data.url,
      industry: data.industry,
      userType: data.userType, // 'brand', 'agency', 'agency-self'
      objectives: data.objectives,
      expertiseAreas: this.extractExpertise(data),
      competitors: data.competitors || [],
      createdAt: new Date().toISOString()
    };

    // Extract specific goals from objectives
    this.goals = this.parseGoals(data.objectives);
    this.isInitialized = true;
    
    console.log('UnifiedService - Company profile created:', this.companyProfile);
    console.log('UnifiedService - Goals identified:', this.goals);

    // Save to backend
    try {
      await stakeholderIntelligenceService.createOrganization(this.companyProfile);
    } catch (error) {
      console.error('Error saving company profile:', error);
    }

    return this.companyProfile;
  }

  /**
   * STEP 2: Identify stakeholders based on company and goals
   */
  async identifyStakeholders() {
    if (!this.companyProfile) {
      console.warn('UnifiedService - Company profile not initialized when identifying stakeholders');
      return this.stakeholders; // Return existing stakeholders if any
    }

    console.log('UnifiedService - Identifying stakeholders for userType:', this.companyProfile.userType);
    const stakeholders = [];
    const timestamp = Date.now();

    // PR-specific stakeholders based on user type
    if (this.companyProfile.userType === 'brand') {
      stakeholders.push(
        {
          id: `media-outlets-${timestamp}-${stakeholders.length}`,
          name: 'Target Media Outlets',
          type: 'media',
          reason: 'Earn media coverage for brand visibility',
          topics: this.generateMediaTopics(),
          priority: 'high',
          prContext: 'earned_media',
          prMetrics: {
            opportunityScore: 85,
            riskLevel: 10,
            engagementPotential: 90,
            timelineCriticality: 'ongoing'
          }
        },
        {
          id: `journalists-${timestamp}-${stakeholders.length}`,
          name: 'Industry Journalists',
          type: 'influencer',
          reason: 'Build relationships for story placement',
          topics: ['industry trends', 'company news', 'expert commentary'],
          priority: 'high',
          prContext: 'media_relations',
          prMetrics: {
            opportunityScore: 80,
            riskLevel: 15,
            engagementPotential: 85,
            timelineCriticality: 'ongoing'
          }
        },
        {
          id: `competitors-${timestamp}-${stakeholders.length}`,
          name: 'Competitor Activity',
          type: 'competitive',
          reason: 'Track competitor PR wins and strategies',
          topics: ['product launches', 'executive changes', 'funding', 'crises'],
          priority: 'medium',
          prContext: 'competitive_analysis',
          prMetrics: {
            opportunityScore: 70,
            riskLevel: 30,
            engagementPotential: 60,
            timelineCriticality: 'ongoing'
          }
        }
      );
    } else if (this.companyProfile.userType === 'agency') {
      stakeholders.push(
        {
          id: `client-mentions-${timestamp}-${stakeholders.length}`,
          name: 'Client Media Coverage',
          type: 'client',
          reason: 'Track and amplify client coverage',
          topics: ['client name mentions', 'industry news', 'competitor moves'],
          priority: 'critical',
          prContext: 'client_results',
          prMetrics: {
            opportunityScore: 90,
            riskLevel: 25,
            engagementPotential: 95,
            timelineCriticality: 'immediate'
          }
        },
        {
          id: `media-opportunities-${timestamp}-${stakeholders.length}`,
          name: 'Media Opportunities',
          type: 'opportunity',
          reason: 'Find pitching opportunities for clients',
          topics: ['journalist requests', 'trending stories', 'news hooks'],
          priority: 'high',
          prContext: 'media_pitching',
          prMetrics: {
            opportunityScore: 85,
            riskLevel: 5,
            engagementPotential: 90,
            timelineCriticality: 'immediate'
          }
        }
      );
    } else if (this.companyProfile.userType === 'agency-self') {
      stakeholders.push(
        {
          id: `prospects-${timestamp}-${stakeholders.length}`,
          name: 'Business Development Targets',
          type: 'prospect',
          reason: 'Identify companies needing PR help',
          topics: ['funding rounds', 'leadership changes', 'crises', 'expansions'],
          priority: 'critical',
          prContext: 'business_development',
          prMetrics: {
            opportunityScore: 95,
            riskLevel: 10,
            engagementPotential: 100,
            timelineCriticality: 'immediate'
          }
        },
        {
          id: `competitor-agencies-${timestamp}-${stakeholders.length}`,
          name: 'Competing Agencies',
          type: 'competitive',
          reason: 'Track competitor wins and losses',
          topics: ['new accounts', 'case studies', 'awards', 'client losses'],
          priority: 'high',
          prContext: 'competitive_intel',
          prMetrics: {
            opportunityScore: 75,
            riskLevel: 20,
            engagementPotential: 70,
            timelineCriticality: 'ongoing'
          }
        }
      );
    }

    // Add goal-specific stakeholders
    this.goals.forEach(goal => {
      const goalStakeholders = this.getStakeholdersForGoal(goal);
      stakeholders.push(...goalStakeholders);
    });

    // Add custom stakeholders from user input
    if (this.companyProfile.customStakeholders) {
      stakeholders.push(...this.companyProfile.customStakeholders);
    }

    this.stakeholders = stakeholders;
    
    console.log('UnifiedService - Identified', stakeholders.length, 'stakeholders');
    console.log('UnifiedService - Stakeholder IDs:', stakeholders.map(s => s.id));

    // Generate monitoring topics from stakeholders
    this.monitoringTopics = this.generateMonitoringTopics(stakeholders);

    return stakeholders;
  }

  /**
   * STEP 3: Configure sources for each stakeholder
   */
  async configureSources() {
    if (!this.stakeholders.length) {
      console.warn('UnifiedService - No stakeholders identified when configuring sources');
      return this.sources;
    }

    console.log('UnifiedService - Configuring sources for', this.stakeholders.length, 'stakeholders');
    const sources = [];

    for (const stakeholder of this.stakeholders) {
      const stakeholderSources = await this.getSourcesForStakeholder(stakeholder);
      sources.push({
        stakeholderId: stakeholder.id,
        stakeholderName: stakeholder.name,
        sources: stakeholderSources
      });
    }

    this.sources = sources;
    
    console.log('UnifiedService - Configured', sources.length, 'source groups');

    // Validate and activate sources
    await this.validateSources();

    return sources;
  }

  /**
   * STEP 4: Start monitoring and collect intelligence
   */
  async startMonitoring() {
    if (!this.sources.length) {
      throw new Error('No sources configured');
    }

    const monitoringResults = [];

    // Monitor each source
    for (const sourceGroup of this.sources) {
      for (const source of sourceGroup.sources) {
        if (source.active) {
          try {
            const data = await this.monitorSource(source, sourceGroup.stakeholderId);
            monitoringResults.push(...data);
          } catch (error) {
            console.error(`Error monitoring source ${source.name}:`, error);
          }
        }
      }
    }

    this.monitoringData = monitoringResults;

    // Analyze findings for PR signals
    await this.analyzeFindings(monitoringResults);

    return monitoringResults;
  }

  /**
   * STEP 5: Discover opportunities based on goals and monitoring
   */
  async discoverOpportunities() {
    const opportunities = [];

    // 1. Find narrative vacuums based on expertise
    const narrativeVacuums = await narrativeVacuumService.discoverOpportunities(
      this.companyProfile,
      { limit: 10 }
    );
    opportunities.push(...narrativeVacuums.opportunities.map(opp => ({
      ...opp,
      source: 'narrative_vacuum',
      matchedGoals: this.matchOpportunityToGoals(opp)
    })));

    // 2. Analyze monitoring data for PR opportunities
    for (const finding of this.monitoringData) {
      const prAnalysis = prDetectionService.analyzePRSignals(
        finding.content || '',
        {
          isOwnBrand: finding.stakeholder === this.companyProfile.company,
          isCompetitor: this.companyProfile.competitors.includes(finding.stakeholder),
          isClient: finding.stakeholderType === 'client'
        }
      );

      // Extract opportunities that match goals
      if (prAnalysis.opportunities.length > 0) {
        prAnalysis.opportunities.forEach(opp => {
          const matchedGoals = this.matchOpportunityToGoals(opp);
          if (matchedGoals.length > 0) {
            opportunities.push({
              ...opp,
              source: 'monitoring',
              stakeholder: finding.stakeholder,
              matchedGoals,
              content: finding.content,
              discoveredAt: new Date().toISOString()
            });
          }
        });
      }
    }

    // 3. Find competitive advantage windows
    const competitorWeaknesses = await this.findCompetitorWeaknesses();
    opportunities.push(...competitorWeaknesses);

    // 4. Identify trending topics we can hijack
    const trendingOpportunities = await this.findTrendingOpportunities();
    opportunities.push(...trendingOpportunities);

    // Sort by relevance to goals
    opportunities.sort((a, b) => {
      const aScore = (a.score || 0) * (a.matchedGoals?.length || 1);
      const bScore = (b.score || 0) * (b.matchedGoals?.length || 1);
      return bScore - aScore;
    });

    this.opportunities = opportunities;
    return opportunities;
  }

  /**
   * Helper: Parse goals from objectives text
   */
  parseGoals(objectives) {
    const goals = [];
    const objectivesLower = objectives.toLowerCase();

    // Common PR goals
    const goalPatterns = {
      'generate_leads': ['new business', 'generate leads', 'win clients', 'grow revenue'],
      'build_awareness': ['brand awareness', 'visibility', 'recognition', 'known for'],
      'thought_leadership': ['thought leader', 'expert', 'authority', 'go-to'],
      'crisis_prevention': ['protect reputation', 'risk management', 'crisis', 'prevent'],
      'media_coverage': ['media coverage', 'press', 'news', 'publicity'],
      'launch_product': ['launch', 'introduce', 'announce', 'reveal'],
      'attract_talent': ['recruit', 'hire', 'talent', 'employees'],
      'investor_relations': ['funding', 'investors', 'ipo', 'valuation']
    };

    Object.entries(goalPatterns).forEach(([goal, patterns]) => {
      if (patterns.some(pattern => objectivesLower.includes(pattern))) {
        goals.push({
          id: goal,
          name: goal.replace('_', ' ').toUpperCase(),
          active: true
        });
      }
    });

    return goals.length > 0 ? goals : [{ id: 'general_pr', name: 'GENERAL PR', active: true }];
  }

  /**
   * Helper: Extract expertise from company data
   */
  extractExpertise(data) {
    const expertise = {};
    
    // Extract from objectives and description
    const text = `${data.objectives} ${data.description || ''}`.toLowerCase();
    
    const expertiseKeywords = {
      'AI': ['artificial intelligence', 'machine learning', 'ai', 'ml', 'neural'],
      'cloud': ['cloud', 'saas', 'paas', 'iaas', 'aws', 'azure'],
      'security': ['security', 'cyber', 'privacy', 'protection', 'secure'],
      'data': ['data', 'analytics', 'insights', 'intelligence', 'metrics'],
      'mobile': ['mobile', 'ios', 'android', 'app'],
      'blockchain': ['blockchain', 'crypto', 'web3', 'defi'],
      'sustainability': ['sustainable', 'green', 'climate', 'esg', 'carbon']
    };

    Object.entries(expertiseKeywords).forEach(([area, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword));
      if (matches.length > 0) {
        expertise[area] = Math.min(1.0, matches.length * 0.3);
      }
    });

    return expertise;
  }

  /**
   * Helper: Generate media topics based on expertise
   */
  generateMediaTopics() {
    const topics = [];
    
    if (this.companyProfile.expertiseAreas) {
      Object.keys(this.companyProfile.expertiseAreas).forEach(area => {
        topics.push(`${area} trends`, `${area} innovation`, `future of ${area}`);
      });
    }

    topics.push('industry analysis', 'market insights', 'executive perspective');
    
    return topics;
  }

  /**
   * Helper: Get stakeholders for specific goal
   */
  getStakeholdersForGoal(goal) {
    const stakeholderMap = {
      'generate_leads': [
        {
          id: `${goal.id}-prospects`,
          name: 'Lead Generation Targets',
          type: 'prospect',
          reason: 'Companies showing buying signals',
          topics: ['budget allocated', 'vendor search', 'RFP issued'],
          priority: 'critical',
          prContext: 'business_development',
          prMetrics: {
            opportunityScore: 90,
            riskLevel: 5,
            engagementPotential: 95,
            timelineCriticality: 'immediate'
          }
        }
      ],
      'build_awareness': [
        {
          id: `${goal.id}-influencers`,
          name: 'Industry Influencers',
          type: 'influencer',
          reason: 'Amplify brand message',
          topics: ['industry commentary', 'trend analysis', 'predictions'],
          priority: 'high',
          prContext: 'influencer_relations',
          prMetrics: {
            opportunityScore: 75,
            riskLevel: 10,
            engagementPotential: 80,
            timelineCriticality: 'ongoing'
          }
        }
      ],
      'investor_relations': [
        {
          id: `${goal.id}-investors`,
          name: 'Target Investors',
          type: 'investor',
          reason: 'Track investor interests and portfolio moves',
          topics: ['investment thesis', 'portfolio companies', 'fund announcements'],
          priority: 'high',
          prContext: 'investor_relations',
          prMetrics: {
            opportunityScore: 85,
            riskLevel: 15,
            engagementPotential: 75,
            timelineCriticality: 'ongoing'
          }
        }
      ]
    };

    return stakeholderMap[goal.id] || [];
  }

  /**
   * Helper: Generate monitoring topics from stakeholders
   */
  generateMonitoringTopics(stakeholders) {
    const topics = new Set();

    stakeholders.forEach(stakeholder => {
      if (stakeholder.topics) {
        stakeholder.topics.forEach(topic => topics.add(topic));
      }
    });

    // Add company-specific topics
    topics.add(this.companyProfile.company);
    this.companyProfile.competitors.forEach(comp => topics.add(comp));

    return Array.from(topics);
  }

  /**
   * Helper: Get sources for stakeholder
   */
  async getSourcesForStakeholder(stakeholder) {
    const sources = [];

    // Base sources for all stakeholders
    sources.push({
      id: `${stakeholder.id}-google-news`,
      name: 'Google News',
      url: `https://news.google.com/search?q=${encodeURIComponent(stakeholder.name)}`,
      type: 'news',
      active: true
    });

    // Type-specific sources
    if (stakeholder.type === 'media') {
      sources.push(
        {
          id: `${stakeholder.id}-pr-newswire`,
          name: 'PR Newswire',
          url: 'https://www.prnewswire.com/rss/news-releases-list.rss',
          type: 'rss',
          active: true
        },
        {
          id: `${stakeholder.id}-haro`,
          name: 'HARO Requests',
          url: 'https://www.helpareporter.com',
          type: 'email',
          active: true
        }
      );
    } else if (stakeholder.type === 'competitive') {
      sources.push({
        id: `${stakeholder.id}-competitor-news`,
        name: 'Competitor News Feed',
        url: `https://www.google.com/alerts/feeds/${stakeholder.id}`,
        type: 'rss',
        active: true
      });
    } else if (stakeholder.type === 'prospect') {
      sources.push({
        id: `${stakeholder.id}-crunchbase`,
        name: 'Crunchbase Signals',
        url: 'https://news.crunchbase.com/feed/',
        type: 'rss',
        active: true
      });
    }

    // Add social media monitoring
    sources.push({
      id: `${stakeholder.id}-twitter`,
      name: 'Twitter Monitoring',
      url: `https://twitter.com/search?q=${encodeURIComponent(stakeholder.name)}`,
      type: 'social',
      active: true
    });

    return sources;
  }

  /**
   * Helper: Validate sources
   */
  async validateSources() {
    for (const sourceGroup of this.sources) {
      for (const source of sourceGroup.sources) {
        try {
          // In production: Actually validate the URL/feed
          source.validated = true;
          source.lastValidated = new Date().toISOString();
        } catch (error) {
          source.validated = false;
          source.error = error.message;
        }
      }
    }
  }

  /**
   * Helper: Monitor a single source
   */
  async monitorSource(source, stakeholderId) {
    // In production: Actually fetch from the source
    // For now, simulate monitoring data
    const mockFindings = [
      {
        id: `finding-${Date.now()}-${Math.random()}`,
        stakeholder: stakeholderId,
        source: source.name,
        content: `Sample finding from ${source.name} about ${stakeholderId}`,
        timestamp: new Date().toISOString(),
        relevance: Math.random()
      }
    ];

    return mockFindings;
  }

  /**
   * Helper: Analyze findings for insights
   */
  async analyzeFindings(findings) {
    for (const finding of findings) {
      // Add PR analysis
      finding.prAnalysis = prDetectionService.analyzePRSignals(finding.content);
      
      // Add sentiment
      finding.sentiment = prDetectionService.analyzeSentiment(finding.content);
      
      // Check goal relevance
      finding.goalRelevance = this.checkGoalRelevance(finding);
    }
  }

  /**
   * Helper: Match opportunity to goals
   */
  matchOpportunityToGoals(opportunity) {
    const matchedGoals = [];

    this.goals.forEach(goal => {
      let matches = false;

      // Match based on opportunity type and goal
      if (goal.id === 'generate_leads' && opportunity.category === 'business_development') {
        matches = true;
      } else if (goal.id === 'build_awareness' && opportunity.category === 'earned_media') {
        matches = true;
      } else if (goal.id === 'thought_leadership' && opportunity.category === 'thought_leadership') {
        matches = true;
      } else if (goal.id === 'media_coverage' && opportunity.type === 'opportunity') {
        matches = true;
      }

      // Check topic relevance
      const oppText = (opportunity.topic || opportunity.content || '').toLowerCase();
      if (goal.id === 'generate_leads' && oppText.includes('funding')) {
        matches = true;
      }

      if (matches) {
        matchedGoals.push(goal);
      }
    });

    return matchedGoals;
  }

  /**
   * Helper: Check if finding is relevant to goals
   */
  checkGoalRelevance(finding) {
    let relevanceScore = 0;
    const content = (finding.content || '').toLowerCase();

    this.goals.forEach(goal => {
      if (goal.id === 'generate_leads' && 
          (content.includes('funding') || content.includes('expansion'))) {
        relevanceScore += 0.3;
      }
      if (goal.id === 'media_coverage' && 
          (content.includes('journalist') || content.includes('reporter'))) {
        relevanceScore += 0.3;
      }
    });

    return Math.min(1.0, relevanceScore);
  }

  /**
   * Helper: Find competitor weaknesses
   */
  async findCompetitorWeaknesses() {
    const weaknesses = [];

    for (const competitor of this.companyProfile.competitors) {
      // Check for negative signals
      const negativeFindings = this.monitoringData.filter(f => 
        f.stakeholder === competitor && 
        f.sentiment?.sentiment === 'negative'
      );

      if (negativeFindings.length > 0) {
        weaknesses.push({
          type: 'competitive_advantage',
          topic: `${competitor} facing challenges`,
          score: 75,
          matchedGoals: this.goals,
          explanation: `${competitor} is experiencing negative coverage - opportunity to position as alternative`,
          source: 'competitive_analysis',
          discoveredAt: new Date().toISOString()
        });
      }
    }

    return weaknesses;
  }

  /**
   * Helper: Find trending opportunities
   */
  async findTrendingOpportunities() {
    // In production: Use Google Trends API
    const trending = [
      { topic: 'AI regulation', score: 85 },
      { topic: 'remote work future', score: 70 },
      { topic: 'sustainability initiatives', score: 75 }
    ];

    return trending.map(trend => ({
      type: 'trending',
      topic: trend.topic,
      score: trend.score,
      matchedGoals: this.matchOpportunityToGoals({ topic: trend.topic }),
      explanation: `Trending topic with high media interest`,
      source: 'trend_analysis',
      discoveredAt: new Date().toISOString()
    }));
  }

  /**
   * Get current state of the entire intelligence pipeline
   */
  getState() {
    const state = {
      companyProfile: this.companyProfile,
      goals: this.goals,
      stakeholders: this.stakeholders,
      sources: this.sources,
      monitoringData: this.monitoringData,
      opportunities: this.opportunities,
      monitoringTopics: this.monitoringTopics,
      isInitialized: this.isInitialized
    };
    
    console.log('UnifiedService - getState called, returning:', {
      hasCompanyProfile: !!state.companyProfile,
      stakeholderCount: state.stakeholders.length,
      sourceCount: state.sources.length,
      isInitialized: state.isInitialized
    });
    
    return state;
  }

  /**
   * Run the complete intelligence pipeline
   */
  async runCompletePipeline(companyData) {
    console.log('Starting unified intelligence pipeline...');
    
    // Step 1: Initialize company
    await this.initializeCompany(companyData);
    console.log('✓ Company profile created');

    // Step 2: Identify stakeholders
    await this.identifyStakeholders();
    console.log(`✓ ${this.stakeholders.length} stakeholders identified`);

    // Step 3: Configure sources
    await this.configureSources();
    console.log(`✓ ${this.sources.length} source groups configured`);

    // Step 4: Start monitoring
    await this.startMonitoring();
    console.log(`✓ ${this.monitoringData.length} findings collected`);

    // Step 5: Discover opportunities
    const opportunities = await this.discoverOpportunities();
    console.log(`✓ ${opportunities.length} opportunities discovered`);

    return {
      success: true,
      summary: {
        stakeholders: this.stakeholders.length,
        sources: this.sources.reduce((acc, sg) => acc + sg.sources.length, 0),
        findings: this.monitoringData.length,
        opportunities: opportunities.length
      },
      opportunities: opportunities.slice(0, 10), // Top 10
      state: this.getState()
    };
  }
}

export default new UnifiedIntelligenceService();