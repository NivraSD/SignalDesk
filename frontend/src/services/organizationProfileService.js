/**
 * Organization Profile Service
 * Builds and maintains intelligent profiles of organizations
 * Provides context-aware intelligence gathering
 */

class OrganizationProfileService {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.profiles = new Map();
  }

  /**
   * Build or retrieve an organization's intelligence profile
   */
  async getOrBuildProfile(organization) {
    // Check if organization exists
    if (!organization) {
      console.warn('No organization provided to getOrBuildProfile');
      return this.getDefaultProfile();
    }
    
    // Use consistent key based on name (fallback to ID if available)
    const profileId = organization.id || organization.name?.toLowerCase().replace(/\s+/g, '_') || 'default';
    const key = `profile_${profileId}`;
    
    // Check cache first
    if (this.profiles.has(key)) {
      console.log(`📋 Using cached profile for ${organization.name}`);
      return this.profiles.get(key);
    }

    // Check localStorage for persisted profile
    const storedProfile = localStorage.getItem(`signaldesk_${key}`);
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        console.log(`📋 Loaded persisted profile for ${organization.name}`);
        this.profiles.set(key, profile);
        return profile;
      } catch (e) {
        console.error('Failed to parse stored profile:', e);
      }
    }

    // Build new profile
    const profile = await this.buildProfile(organization);
    this.profiles.set(key, profile);
    
    // Persist to localStorage
    localStorage.setItem(`signaldesk_${key}`, JSON.stringify(profile));
    
    return profile;
  }

  /**
   * Get default profile for when no organization is provided
   */
  getDefaultProfile() {
    return {
      identity: {
        name: 'Unknown Organization',
        industry: 'general',
        market_position: 'unknown'
      },
      established_facts: {
        strategic_initiatives: [],
        recent_history: [],
        pain_points: [],
        strengths: []
      },
      monitoring_targets: {
        competitors: { primary: [], emerging: [] },
        stakeholder_groups: {},
        critical_topics: [],
        keywords: []
      },
      objectives: {
        primary: 'Monitor general landscape',
        risk_areas: [],
        opportunity_areas: []
      },
      context: {},
      confidence_level: 'building',
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Build comprehensive organization profile
   */
  async buildProfile(organization) {
    console.log(`🏗️ Building intelligence profile for ${organization.name}`);
    
    // Start with AI-powered industry analysis
    const industryAnalysis = await this.getIndustryContext(organization);
    
    // Build the profile structure
    const profile = {
      // Identity & Context
      identity: {
        name: organization.name,
        website: organization.website,
        industry: industryAnalysis.primary_industry,
        description: organization.description,
        size: organization.size || 'unknown',
        founded: organization.founded,
        headquarters: organization.headquarters,
        market_position: this.assessMarketPosition(organization, industryAnalysis)
      },
      
      // Established Facts (what we KNOW)
      established_facts: {
        strategic_initiatives: await this.identifyStrategicInitiatives(organization),
        recent_history: await this.getRecentHistory(organization),
        pain_points: await this.identifyPainPoints(organization, industryAnalysis),
        strengths: await this.identifyStrengths(organization, industryAnalysis),
        public_commitments: await this.getPublicCommitments(organization)
      },
      
      // Monitoring Configuration
      monitoring_targets: {
        competitors: {
          primary: industryAnalysis.direct_competitors?.slice(0, 5) || [],
          emerging: industryAnalysis.adjacent_competitors?.slice(0, 3) || [],
          to_watch: []
        },
        stakeholder_groups: this.defineStakeholderGroups(organization, industryAnalysis),
        critical_topics: this.defineCriticalTopics(organization, industryAnalysis),
        keywords: this.defineMonitoringKeywords(organization, industryAnalysis)
      },
      
      // Intelligence Objectives
      objectives: {
        primary: organization.goals?.primary || 'Monitor competitive landscape',
        risk_areas: this.identifyRiskAreas(organization, industryAnalysis),
        opportunity_areas: this.identifyOpportunityAreas(organization, industryAnalysis),
        blindspots: this.identifyBlindspots(organization)
      },
      
      // Context Flags
      context: {
        is_crisis_mode: false,
        is_launching: false,
        is_pivoting: false,
        regulatory_pressure: false,
        competitive_threat_level: 'moderate'
      },
      
      // Metadata
      profile_created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      confidence_level: 'building' // building -> established -> refined
    };
    
    return profile;
  }

  /**
   * Get industry-specific context
   */
  async getIndustryContext(organization) {
    // This would call the AI industry expansion service
    // For now, return structured data
    return {
      primary_industry: organization.industry || 'technology',
      direct_competitors: this.getIndustryCompetitors(organization.industry),
      market_dynamics: this.getMarketDynamics(organization.industry),
      regulatory_landscape: this.getRegulatoryLandscape(organization.industry)
    };
  }

  /**
   * Identify strategic initiatives from available data
   */
  async identifyStrategicInitiatives(organization) {
    const initiatives = [];
    
    // Industry-specific initiatives
    if (organization.industry === 'automotive') {
      if (organization.name.includes('Toyota')) {
        initiatives.push(
          'Hybrid technology leadership',
          'Gradual EV transition strategy',
          'Hydrogen fuel cell development',
          'Manufacturing efficiency (TPS)'
        );
      }
    } else if (organization.industry === 'technology') {
      initiatives.push(
        'Digital transformation',
        'Cloud migration',
        'AI/ML integration'
      );
    }
    
    return initiatives;
  }

  /**
   * Get recent history and milestones
   */
  async getRecentHistory(organization) {
    const history = [];
    
    // Would fetch from news/database
    // For now, return examples
    if (organization.name.includes('Toyota')) {
      history.push(
        '2024: Announced $8B battery plant in North Carolina',
        '2023: Committed to 30 EV models by 2030',
        '2023: Solid-state battery breakthrough announced'
      );
    }
    
    return history;
  }

  /**
   * Identify organizational pain points
   */
  async identifyPainPoints(organization, industryAnalysis) {
    const painPoints = [];
    
    if (organization.industry === 'automotive') {
      painPoints.push(
        'EV transition pace criticism',
        'Supply chain vulnerabilities',
        'Regulatory compliance costs'
      );
    } else if (organization.industry === 'public_relations') {
      painPoints.push(
        'Client retention in economic downturn',
        'Digital transformation demands',
        'Talent acquisition and retention'
      );
    }
    
    return painPoints;
  }

  /**
   * Identify organizational strengths
   */
  async identifyStrengths(organization, industryAnalysis) {
    const strengths = [];
    
    if (organization.name.includes('Toyota')) {
      strengths.push(
        'Manufacturing excellence (TPS)',
        'Hybrid technology leadership',
        'Global supply chain',
        'Brand reliability reputation'
      );
    }
    
    return strengths;
  }

  /**
   * Get public commitments and promises
   */
  async getPublicCommitments(organization) {
    // Would fetch from news/PR database
    return [];
  }

  /**
   * Define stakeholder groups to monitor
   */
  defineStakeholderGroups(organization, industryAnalysis) {
    const groups = {
      investors: {
        types: ['institutional', 'retail', 'activist'],
        key_concerns: [],
        influence_level: 'high'
      },
      regulators: {
        entities: industryAnalysis.regulatory_bodies || [],
        key_concerns: [],
        influence_level: 'high'
      },
      customers: {
        segments: industryAnalysis.customer_segments || [],
        key_concerns: [],
        influence_level: 'high'
      },
      employees: {
        groups: ['unions', 'management', 'contractors'],
        key_concerns: [],
        influence_level: 'medium'
      },
      partners: {
        types: ['suppliers', 'distributors', 'technology'],
        key_concerns: [],
        influence_level: 'medium'
      },
      media: {
        outlets: industryAnalysis.media_outlets || [],
        sentiment: 'neutral',
        influence_level: 'medium'
      }
    };
    
    return groups;
  }

  /**
   * Define critical topics to monitor
   */
  defineCriticalTopics(organization, industryAnalysis) {
    const topics = [];
    
    // Industry-specific topics
    if (organization.industry === 'automotive') {
      topics.push(
        'Electric vehicle adoption',
        'Autonomous driving technology',
        'Supply chain resilience',
        'Environmental regulations',
        'Battery technology advances'
      );
    } else if (organization.industry === 'public_relations') {
      topics.push(
        'Crisis communications trends',
        'Digital PR evolution',
        'Influencer marketing',
        'Measurement and ROI',
        'AI in communications'
      );
    }
    
    // Add organization-specific topics
    if (organization.focus_areas) {
      topics.push(...organization.focus_areas);
    }
    
    return topics;
  }

  /**
   * Define monitoring keywords
   */
  defineMonitoringKeywords(organization, industryAnalysis) {
    const keywords = [
      organization.name,
      ...industryAnalysis.monitoring_keywords || [],
      ...industryAnalysis.trending_topics || []
    ];
    
    return [...new Set(keywords)];
  }

  /**
   * Assess market position
   */
  assessMarketPosition(organization, industryAnalysis) {
    // Would use market data
    if (organization.name.includes('Toyota')) {
      return 'global_leader';
    }
    return 'established_player';
  }

  /**
   * Identify risk areas
   */
  identifyRiskAreas(organization, industryAnalysis) {
    const risks = [];
    
    if (organization.industry === 'automotive') {
      risks.push(
        'Regulatory changes',
        'Supply chain disruption',
        'Technology disruption',
        'Market share erosion'
      );
    }
    
    return risks;
  }

  /**
   * Identify opportunity areas
   */
  identifyOpportunityAreas(organization, industryAnalysis) {
    const opportunities = [];
    
    if (organization.industry === 'automotive') {
      opportunities.push(
        'Emerging markets expansion',
        'New technology partnerships',
        'Sustainability leadership',
        'Service business models'
      );
    }
    
    return opportunities;
  }

  /**
   * Identify potential blindspots
   */
  identifyBlindspots(organization) {
    return [
      'Emerging competitors',
      'Adjacent industry disruption',
      'Consumer preference shifts',
      'Technology convergence'
    ];
  }

  /**
   * Get industry competitors based on industry
   */
  getIndustryCompetitors(industry) {
    const competitorMap = {
      automotive: ['Tesla', 'Volkswagen', 'GM', 'Ford', 'Stellantis', 'BMW', 'Mercedes'],
      technology: ['Microsoft', 'Google', 'Apple', 'Amazon', 'Meta'],
      public_relations: ['Edelman', 'Weber Shandwick', 'Ogilvy', 'FleishmanHillard'],
      finance: ['JPMorgan', 'Bank of America', 'Goldman Sachs', 'Morgan Stanley']
    };
    
    return competitorMap[industry] || [];
  }

  /**
   * Get market dynamics for industry
   */
  getMarketDynamics(industry) {
    const dynamics = {
      automotive: {
        trend: 'transformation',
        drivers: ['electrification', 'autonomy', 'connectivity'],
        challenges: ['supply chain', 'regulations', 'consumer adoption']
      },
      technology: {
        trend: 'rapid_growth',
        drivers: ['AI/ML', 'cloud', 'digital transformation'],
        challenges: ['talent', 'regulation', 'competition']
      }
    };
    
    return dynamics[industry] || { trend: 'stable' };
  }

  /**
   * Get regulatory landscape
   */
  getRegulatoryLandscape(industry) {
    const regulations = {
      automotive: ['emissions', 'safety', 'trade', 'labor'],
      technology: ['privacy', 'antitrust', 'content', 'AI governance'],
      finance: ['banking', 'securities', 'consumer protection', 'AML']
    };
    
    return regulations[industry] || [];
  }

  /**
   * Update profile with new intelligence
   */
  async updateProfile(organization, newIntelligence) {
    const profile = await this.getOrBuildProfile(organization);
    
    // Update relevant sections based on new intelligence
    if (newIntelligence.competitors) {
      profile.monitoring_targets.competitors = {
        ...profile.monitoring_targets.competitors,
        ...newIntelligence.competitors
      };
    }
    
    if (newIntelligence.events) {
      profile.established_facts.recent_history.push(
        ...newIntelligence.events.map(e => `${new Date().getFullYear()}: ${e}`)
      );
    }
    
    profile.last_updated = new Date().toISOString();
    profile.confidence_level = 'established';
    
    return profile;
  }

  /**
   * Get intelligence guidance based on profile
   */
  getIntelligenceGuidance(profile) {
    return {
      search_priorities: [
        ...profile.monitoring_targets.competitors.primary,
        ...profile.monitoring_targets.critical_topics
      ],
      
      alert_triggers: [
        `${profile.identity.name} announcement`,
        'Competitor major move',
        'Regulatory change',
        'Stakeholder action'
      ],
      
      analysis_focus: {
        competition: 'Track competitor moves and market share',
        stakeholders: 'Monitor sentiment and actions',
        topics: 'Identify trend changes and breakthroughs',
        predictions: 'Anticipate cascade events'
      },
      
      context_reminders: profile.established_facts.pain_points
    };
  }
}

export default new OrganizationProfileService();