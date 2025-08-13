/**
 * Competitor Intelligence Service
 * Focuses on discovering and tracking top competitors with intelligent source configuration
 */

class CompetitorIntelligenceService {
  constructor() {
    this.competitorData = new Map();
    this.trackingAgents = new Map();
    this.sourceConfigurations = new Map();
  }

  /**
   * Analyze organization and discover top 5 competitors
   */
  async discoverCompetitors(organization) {
    console.log(`🔍 CompetitorIntelligenceService: Discovering competitors for ${organization.name}...`);
    console.log('📋 Organization data:', organization);
    
    try {
      // Step 1: Industry analysis
      const industry = await this.analyzeIndustry(organization);
      
      // Step 2: Competitor discovery using multiple methods
      const competitors = await this.findCompetitors(organization, industry);
      
      // Step 3: Rank and select top 5
      const topCompetitors = await this.rankCompetitors(competitors, organization);
      
      // Step 4: Enrich competitor profiles
      const enrichedCompetitors = await this.enrichCompetitorProfiles(topCompetitors);
      
      const result = {
        organization,
        industry,
        competitors: enrichedCompetitors.slice(0, 5),
        discoveryMethod: 'ai_analysis',
        confidence: this.calculateDiscoveryConfidence(enrichedCompetitors),
        timestamp: new Date().toISOString()
      };
      
      console.log('🎯 Final competitor analysis result:', {
        orgName: result.organization.name,
        competitorNames: result.competitors.map(c => c.name),
        industry: result.industry.primary
      });
      
      return result;
    } catch (error) {
      console.error('Error discovering competitors:', error);
      // Fallback to basic competitor suggestions
      return this.getFallbackCompetitors(organization);
    }
  }

  /**
   * Analyze industry from company URL and description
   */
  async analyzeIndustry(organization) {
    // In production, this would use website scraping + AI analysis
    const industryMapping = {
      'tech': ['technology', 'software', 'saas', 'ai', 'cloud'],
      'finance': ['bank', 'fintech', 'investment', 'trading', 'crypto'],
      'healthcare': ['health', 'medical', 'pharma', 'biotech', 'hospital'],
      'retail': ['shop', 'ecommerce', 'store', 'marketplace', 'commerce']
    };

    const orgLower = (organization.name + ' ' + (organization.url || '')).toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryMapping)) {
      if (keywords.some(keyword => orgLower.includes(keyword))) {
        return {
          primary: industry,
          confidence: 0.8,
          keywords: keywords.filter(k => orgLower.includes(k))
        };
      }
    }

    return { primary: 'technology', confidence: 0.5, keywords: [] };
  }

  /**
   * Find competitors using various discovery methods
   */
  async findCompetitors(organization, industry) {
    const competitors = [];
    
    // Method 1: Check for specific company competitors first
    const companyKey = organization.name.toLowerCase();
    const specificCompetitors = this.getSpecificCompetitors(companyKey);
    
    if (specificCompetitors.length > 0) {
      competitors.push(...specificCompetitors);
    } else {
      // Method 2: Industry database lookup
      const industryCompetitors = this.getIndustryCompetitors(industry.primary);
      competitors.push(...industryCompetitors);
    }
    
    // Method 2: Similar company analysis (simulated)
    const similarCompanies = await this.findSimilarCompanies(organization);
    competitors.push(...similarCompanies);
    
    // Method 3: Market research (simulated API call)
    const marketCompetitors = await this.getMarketCompetitors(organization, industry);
    competitors.push(...marketCompetitors);
    
    // Remove duplicates and organization itself
    const uniqueCompetitors = this.deduplicateCompetitors(competitors, organization.name);
    
    return uniqueCompetitors;
  }

  /**
   * Get specific competitors for known companies
   */
  getSpecificCompetitors(companyName) {
    const specificCompetitors = {
      'target': [
        { name: 'Walmart', size: 'enterprise', focus: 'retail, ecommerce' },
        { name: 'Amazon', size: 'enterprise', focus: 'ecommerce, retail' },
        { name: 'Costco', size: 'enterprise', focus: 'wholesale retail' },
        { name: 'Kroger', size: 'enterprise', focus: 'grocery retail' },
        { name: 'Best Buy', size: 'enterprise', focus: 'electronics retail' }
      ],
      'ikea': [
        { name: 'Wayfair', size: 'enterprise', focus: 'online furniture' },
        { name: 'Ashley Furniture', size: 'enterprise', focus: 'furniture retail' },
        { name: 'West Elm', size: 'mid-market', focus: 'modern furniture' },
        { name: 'Crate & Barrel', size: 'mid-market', focus: 'home furnishings' },
        { name: 'Home Depot', size: 'enterprise', focus: 'home improvement' }
      ],
      'apple': [
        { name: 'Samsung', size: 'enterprise', focus: 'consumer electronics' },
        { name: 'Google', size: 'enterprise', focus: 'mobile, services' },
        { name: 'Microsoft', size: 'enterprise', focus: 'software, devices' },
        { name: 'Sony', size: 'enterprise', focus: 'electronics, entertainment' },
        { name: 'Dell', size: 'enterprise', focus: 'computers, enterprise' }
      ]
    };
    
    return specificCompetitors[companyName] || [];
  }

  /**
   * Get competitors from industry database
   */
  getIndustryCompetitors(industry) {
    const industryDatabase = {
      technology: [
        { name: 'Microsoft', size: 'enterprise', focus: 'cloud, productivity' },
        { name: 'Google', size: 'enterprise', focus: 'search, cloud, ai' },
        { name: 'Amazon', size: 'enterprise', focus: 'cloud, ecommerce' },
        { name: 'Apple', size: 'enterprise', focus: 'consumer tech' },
        { name: 'Meta', size: 'enterprise', focus: 'social media' },
        { name: 'OpenAI', size: 'mid-market', focus: 'artificial intelligence' },
        { name: 'Salesforce', size: 'enterprise', focus: 'crm, saas' }
      ],
      finance: [
        { name: 'JPMorgan Chase', size: 'enterprise', focus: 'banking' },
        { name: 'Goldman Sachs', size: 'enterprise', focus: 'investment banking' },
        { name: 'PayPal', size: 'enterprise', focus: 'payments' },
        { name: 'Square', size: 'mid-market', focus: 'fintech' },
        { name: 'Stripe', size: 'mid-market', focus: 'payments' }
      ],
      healthcare: [
        { name: 'Pfizer', size: 'enterprise', focus: 'pharmaceuticals' },
        { name: 'Johnson & Johnson', size: 'enterprise', focus: 'healthcare' },
        { name: 'UnitedHealth', size: 'enterprise', focus: 'health insurance' },
        { name: 'Moderna', size: 'mid-market', focus: 'biotech' }
      ],
      retail: [
        { name: 'Amazon', size: 'enterprise', focus: 'ecommerce' },
        { name: 'Walmart', size: 'enterprise', focus: 'retail' },
        { name: 'Target', size: 'enterprise', focus: 'retail' },
        { name: 'Shopify', size: 'mid-market', focus: 'ecommerce platform' }
      ]
    };

    return industryDatabase[industry] || industryDatabase.technology;
  }

  /**
   * Find similar companies (simulated)
   */
  async findSimilarCompanies(organization) {
    // In production: Use APIs like Crunchbase, PitchBook, or company databases
    return [
      { name: 'Similar Corp', size: 'mid-market', focus: 'similar services', similarity: 0.8 },
      { name: 'Competitor Inc', size: 'startup', focus: 'competing product', similarity: 0.7 }
    ];
  }

  /**
   * Get market competitors (simulated API)
   */
  async getMarketCompetitors(organization, industry) {
    // In production: Use market research APIs
    return [
      { name: 'Market Leader', size: 'enterprise', focus: 'market dominant', marketShare: 0.3 },
      { name: 'Rising Star', size: 'startup', focus: 'disruptive tech', growth: 'high' }
    ];
  }

  /**
   * Remove duplicates and filter out the organization itself
   */
  deduplicateCompetitors(competitors, orgName) {
    const seen = new Set();
    const unique = [];
    
    for (const comp of competitors) {
      const key = comp.name.toLowerCase();
      if (!seen.has(key) && key !== orgName.toLowerCase()) {
        seen.add(key);
        unique.push(comp);
      }
    }
    
    return unique;
  }

  /**
   * Rank competitors by relevance and threat level
   */
  async rankCompetitors(competitors, organization) {
    return competitors.map(comp => ({
      ...comp,
      threatLevel: this.calculateThreatLevel(comp, organization),
      relevanceScore: this.calculateRelevanceScore(comp, organization),
      trackingPriority: this.calculateTrackingPriority(comp)
    })).sort((a, b) => (b.threatLevel + b.relevanceScore) - (a.threatLevel + a.relevanceScore));
  }

  /**
   * Calculate threat level (0-100)
   */
  calculateThreatLevel(competitor, organization) {
    let threat = 50; // Base threat
    
    // Size factor
    if (competitor.size === 'enterprise') threat += 20;
    else if (competitor.size === 'mid-market') threat += 10;
    
    // Market share factor
    if (competitor.marketShare > 0.2) threat += 15;
    else if (competitor.marketShare > 0.1) threat += 10;
    
    // Growth factor
    if (competitor.growth === 'high') threat += 15;
    
    return Math.min(100, threat);
  }

  /**
   * Calculate relevance score (0-100)
   */
  calculateRelevanceScore(competitor, organization) {
    let relevance = 30; // Base relevance
    
    // Similarity factor
    if (competitor.similarity > 0.8) relevance += 30;
    else if (competitor.similarity > 0.6) relevance += 20;
    
    // Focus alignment
    const orgFocus = organization.description || '';
    if (competitor.focus && orgFocus.includes(competitor.focus.split(',')[0])) {
      relevance += 25;
    }
    
    return Math.min(100, relevance);
  }

  /**
   * Calculate tracking priority
   */
  calculateTrackingPriority(competitor) {
    const combined = competitor.threatLevel + competitor.relevanceScore;
    if (combined > 150) return 'high';
    if (combined > 100) return 'medium';
    return 'low';
  }

  /**
   * Enrich competitor profiles with additional data
   */
  async enrichCompetitorProfiles(competitors) {
    return Promise.all(competitors.map(async (comp) => {
      // In production: Fetch from various APIs
      return {
        ...comp,
        profile: {
          industry: comp.focus || 'Unknown',
          employees: this.estimateEmployees(comp.size),
          website: this.guessWebsite(comp.name),
          funding: this.estimateFunding(comp.size),
          lastNews: await this.getLatestNews(comp.name)
        },
        trackingSources: await this.generateTrackingSources(comp),
        monitoringSignals: this.defineMonitoringSignals(comp)
      };
    }));
  }

  /**
   * Generate intelligent tracking sources for each competitor
   */
  async generateTrackingSources(competitor) {
    const sources = [];
    
    // Core sources for all competitors
    sources.push(
      {
        type: 'news',
        name: 'Google News',
        query: `"${competitor.name}" OR "${competitor.name} company"`,
        priority: 'high',
        frequency: 'daily'
      },
      {
        type: 'press_releases',
        name: 'PR Newswire',
        query: competitor.name,
        priority: 'high',
        frequency: 'daily'
      }
    );

    // Add specialized sources based on competitor characteristics
    if (competitor.size === 'startup' || competitor.growth === 'high') {
      sources.push({
        type: 'funding',
        name: 'Crunchbase',
        query: competitor.name,
        priority: 'medium',
        frequency: 'weekly'
      });
    }

    if (competitor.trackingPriority === 'high') {
      sources.push(
        {
          type: 'social',
          name: 'LinkedIn Company',
          query: competitor.name,
          priority: 'medium',
          frequency: 'daily'
        },
        {
          type: 'jobs',
          name: 'LinkedIn Jobs',
          query: `"${competitor.name}" hiring`,
          priority: 'low',
          frequency: 'weekly'
        }
      );
    }

    return sources;
  }

  /**
   * Define what signals to monitor for each competitor
   */
  defineMonitoringSignals(competitor) {
    const baseSignals = [
      'product launches',
      'funding announcements',
      'executive changes',
      'partnerships',
      'acquisitions'
    ];

    const prioritySignals = [];
    
    if (competitor.trackingPriority === 'high') {
      prioritySignals.push(
        'hiring trends',
        'marketing campaigns',
        'pricing changes',
        'customer wins/losses'
      );
    }

    if (competitor.size === 'startup') {
      prioritySignals.push('fundraising', 'pivot announcements');
    }

    if (competitor.threatLevel > 70) {
      prioritySignals.push('competitive responses', 'market expansion');
    }

    return {
      critical: baseSignals,
      important: prioritySignals,
      monitoring_frequency: competitor.trackingPriority === 'high' ? 'real-time' : 'daily'
    };
  }

  /**
   * Helper methods for enrichment
   */
  estimateEmployees(size) {
    const ranges = {
      startup: '1-50',
      'mid-market': '50-1000',
      enterprise: '1000+'
    };
    return ranges[size] || 'Unknown';
  }

  guessWebsite(name) {
    return `https://${name.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  estimateFunding(size) {
    const estimates = {
      startup: '$1M - $10M',
      'mid-market': '$10M - $100M',
      enterprise: '$100M+'
    };
    return estimates[size] || 'Unknown';
  }

  async getLatestNews(companyName) {
    // Simulate fetching latest news
    return {
      headline: `${companyName} announces quarterly results`,
      date: new Date().toISOString(),
      source: 'Business Wire'
    };
  }

  /**
   * Calculate confidence in discovery process
   */
  calculateDiscoveryConfidence(competitors) {
    if (competitors.length >= 5 && competitors.every(c => c.threatLevel > 40)) {
      return 0.9;
    } else if (competitors.length >= 3) {
      return 0.7;
    }
    return 0.5;
  }

  /**
   * Fallback competitors for when discovery fails
   */
  getFallbackCompetitors(organization) {
    return {
      organization,
      industry: { primary: 'technology', confidence: 0.3 },
      competitors: [
        {
          name: 'Generic Competitor 1',
          size: 'mid-market',
          focus: 'similar services',
          threatLevel: 60,
          relevanceScore: 50,
          trackingPriority: 'medium'
        }
      ],
      discoveryMethod: 'fallback',
      confidence: 0.3,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start monitoring competitors with configured sources
   */
  async startCompetitorMonitoring(competitorAnalysis) {
    console.log(`🎯 Starting monitoring for ${competitorAnalysis.competitors.length} competitors...`);
    
    for (const competitor of competitorAnalysis.competitors) {
      const agentId = `agent-${competitor.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Create monitoring agent for this competitor
      const agent = {
        id: agentId,
        competitor: competitor,
        sources: competitor.trackingSources,
        signals: competitor.monitoringSignals,
        status: 'active',
        lastUpdate: null,
        findings: []
      };
      
      this.trackingAgents.set(agentId, agent);
      
      // Start source monitoring
      await this.activateSourceMonitoring(agent);
    }
    
    return {
      status: 'monitoring_active',
      agents: Array.from(this.trackingAgents.keys()),
      totalSources: competitorAnalysis.competitors.reduce((sum, c) => sum + c.trackingSources.length, 0)
    };
  }

  /**
   * Activate source monitoring for an agent
   */
  async activateSourceMonitoring(agent) {
    console.log(`📡 Activating monitoring for ${agent.competitor.name}...`);
    
    // Simulate source activation
    for (const source of agent.sources) {
      console.log(`  - ${source.name}: ${source.query} (${source.frequency})`);
    }
    
    agent.lastUpdate = new Date().toISOString();
    agent.status = 'monitoring';
    
    return true;
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus() {
    const agents = Array.from(this.trackingAgents.values());
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'monitoring').length,
      totalSources: agents.reduce((sum, a) => sum + a.sources.length, 0),
      lastUpdate: agents.length > 0 ? Math.max(...agents.map(a => new Date(a.lastUpdate || 0))) : null
    };
  }
}

export default new CompetitorIntelligenceService();