/**
 * Intelligent Discovery Service
 * Automatically discovers everything about a company from just their name
 * No more asking users for data we can find ourselves
 */

class IntelligentDiscoveryService {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
    this.cache = new Map();
  }

  /**
   * Discover everything about a company from minimal input
   */
  async discoverCompanyIntelligence(companyName, website = null, description = null) {
    console.log(`🔍 Starting intelligent discovery for ${companyName}`);
    
    // Check cache first
    const cacheKey = `${companyName}_${website}`;
    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached discovery');
      return this.cache.get(cacheKey);
    }

    try {
      // Step 1: Use Claude to analyze the company
      const companyAnalysis = await this.analyzeCompanyWithClaude(companyName, website, description);
      
      // Step 2: Discover actual competitors (not placeholders!)
      const competitors = await this.discoverRealCompetitors(companyName, companyAnalysis.industry);
      
      // Step 3: Map actual stakeholders
      const stakeholders = await this.mapRealStakeholders(companyName, companyAnalysis.industry);
      
      // Step 4: Identify relevant topics based on industry
      const topics = await this.identifyRelevantTopics(companyAnalysis);
      
      // Step 5: Generate monitoring keywords
      const keywords = await this.generateSmartKeywords(companyName, companyAnalysis);
      
      const discovery = {
        company: {
          name: companyName,
          website: website,
          description: description || companyAnalysis.description,
          ...companyAnalysis
        },
        competitors: competitors,
        stakeholders: stakeholders,
        topics: topics,
        keywords: keywords,
        monitoring_strategy: this.createMonitoringStrategy(companyAnalysis),
        discovered_at: new Date().toISOString()
      };
      
      // Cache the discovery
      this.cache.set(cacheKey, discovery);
      
      return discovery;
      
    } catch (error) {
      console.error('Discovery failed:', error);
      // Return minimal fallback
      return this.getFallbackDiscovery(companyName);
    }
  }

  /**
   * Use Claude to understand the company
   */
  async analyzeCompanyWithClaude(companyName, website, description) {
    const prompt = `
      Analyze this company and provide structured intelligence:
      Company: ${companyName}
      Website: ${website || 'not provided'}
      Description: ${description || 'not provided'}
      
      Provide a JSON response with:
      1. industry: The PRIMARY industry (e.g., "automotive", "finance", "technology")
      2. sub_industry: More specific category
      3. business_model: How they make money
      4. market_position: leader/challenger/emerging/niche
      5. key_products: Main products/services
      6. target_customers: Who they sell to
      7. geographic_focus: Where they operate
      8. company_stage: startup/growth/mature/enterprise
      9. likely_pain_points: Current challenges they face
      10. description: One sentence describing what they do
      
      Be specific and accurate. If this is a well-known company, use your knowledge.
      For example:
      - Toyota = automotive giant, not tech company
      - Mitsui & Co = Japanese trading conglomerate (sogo shosha), not just "finance"
      - Goldman Sachs = investment banking, not generic "finance"
    `;

    try {
      console.log('🔍 Calling Claude API for company analysis...');
      console.log('URL:', `${this.supabaseUrl}/functions/v1/claude-intelligence-synthesizer-v2`);
      console.log('Has API Key:', !!this.supabaseKey);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-intelligence-synthesizer-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          intelligence_type: 'company_analysis',
          prompt: prompt,
          organization: { name: companyName }
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Claude analysis successful:', data);
        // Make sure we return the full analysis with competitors
        if (data.analysis) {
          console.log('🎯 Discovered competitors:', data.analysis.competitors);
          return data.analysis;
        }
        return this.getDefaultAnalysis(companyName);
      } else {
        const errorText = await response.text();
        console.error('❌ Claude API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Claude analysis failed:', error);
    }

    return this.getDefaultAnalysis(companyName);
  }

  /**
   * Discover REAL competitors, not placeholders
   */
  async discoverRealCompetitors(companyName, industry) {
    // Normalize industry name for lookup
    const normalizedIndustry = (industry || '').toLowerCase();
    console.log('🔍 Looking up competitors for:', companyName, 'in industry:', normalizedIndustry);
    
    // Industry-specific real competitors
    const competitorMap = {
      automotive: {
        'Toyota': ['Tesla', 'Volkswagen', 'General Motors', 'Ford', 'Stellantis', 'BYD', 'Honda', 'Hyundai'],
        'Tesla': ['Toyota', 'Volkswagen', 'BYD', 'Rivian', 'Lucid', 'Polestar', 'NIO', 'Xpeng'],
        'Ford': ['General Motors', 'Stellantis', 'Toyota', 'Tesla', 'Rivian', 'Volkswagen']
      },
      trading: {
        'Mitsui & Co': ['Mitsubishi Corporation', 'Itochu', 'Sumitomo Corporation', 'Marubeni', 'Sojitz', 'Toyota Tsusho'],
        'Mitsubishi Corporation': ['Mitsui & Co', 'Itochu', 'Sumitomo Corporation', 'Marubeni']
      },
      'diversified conglomerate': {
        'Mitsui & Co': ['Mitsubishi Corporation', 'Itochu Corporation', 'Sumitomo Corporation', 'Marubeni Corporation', 'Sojitz', 'Toyota Tsusho'],
        'Mitsui & Co.': ['Mitsubishi Corporation', 'Itochu Corporation', 'Sumitomo Corporation', 'Marubeni Corporation', 'Sojitz', 'Toyota Tsusho']
      },
      finance: {
        'Goldman Sachs': ['Morgan Stanley', 'JPMorgan', 'Bank of America', 'Citigroup', 'Barclays', 'Deutsche Bank'],
        'JPMorgan': ['Bank of America', 'Citigroup', 'Wells Fargo', 'Goldman Sachs', 'Morgan Stanley']
      },
      technology: {
        'OpenAI': ['Anthropic', 'Google DeepMind', 'Microsoft', 'Meta AI', 'Cohere', 'Stability AI', 'Midjourney'],
        'Microsoft': ['Google', 'Amazon', 'Apple', 'Meta', 'Oracle', 'Salesforce', 'IBM'],
        'Palantir': ['Snowflake', 'Databricks', 'C3.ai', 'SAS', 'IBM', 'Oracle', 'Splunk']
      }
    };

    // Check if we have specific competitors for this company
    const industryCompetitors = competitorMap[normalizedIndustry] || {};
    const specificCompetitors = industryCompetitors[companyName];
    
    if (specificCompetitors) {
      return specificCompetitors.slice(0, 8);
    }

    // Use Claude to discover competitors if not in our map
    return await this.discoverCompetitorsWithClaude(companyName, industry);
  }

  /**
   * Map REAL stakeholders for the company
   */
  async mapRealStakeholders(companyName, industry) {
    const stakeholders = {
      investors: [],
      customers: [],
      partners: [],
      regulators: [],
      analysts: [],
      media: []
    };

    // Industry-specific stakeholders
    if (industry === 'automotive') {
      stakeholders.regulators = ['NHTSA', 'EPA', 'CARB', 'EU Commission', 'METI (Japan)'];
      stakeholders.analysts = ['Cox Automotive', 'JD Power', 'IHS Markit', 'Bloomberg Intelligence'];
      stakeholders.media = ['Automotive News', 'Car and Driver', 'Motor Trend', 'Electrek'];
    } else if (industry === 'finance' || industry === 'trading') {
      stakeholders.regulators = ['SEC', 'FINRA', 'Federal Reserve', 'FSA (Japan)', 'FCA (UK)'];
      stakeholders.analysts = ['Moody\'s', 'S&P Global', 'Fitch Ratings', 'Bloomberg'];
      stakeholders.media = ['Wall Street Journal', 'Financial Times', 'Bloomberg', 'Reuters'];
    } else if (industry === 'technology') {
      stakeholders.regulators = ['FTC', 'EU Commission', 'FCC', 'Data Protection Authorities'];
      stakeholders.analysts = ['Gartner', 'Forrester', 'IDC', 'CB Insights'];
      stakeholders.media = ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'The Information'];
    }

    return stakeholders;
  }

  /**
   * Identify topics that actually matter for this company
   */
  async identifyRelevantTopics(companyAnalysis) {
    const topics = [];
    
    // Industry-specific topics
    const industryTopics = {
      automotive: [
        'Electric vehicle adoption',
        'Autonomous driving regulations',
        'Battery technology advances',
        'Supply chain resilience',
        'Charging infrastructure'
      ],
      finance: [
        'Interest rate changes',
        'Regulatory compliance',
        'Digital banking trends',
        'Cryptocurrency regulation',
        'ESG investing'
      ],
      technology: [
        'AI regulation',
        'Data privacy laws',
        'Antitrust scrutiny',
        'Cybersecurity threats',
        'Open source trends'
      ]
    };

    // Add industry-specific topics
    const industrySpecific = industryTopics[companyAnalysis.industry] || [];
    topics.push(...industrySpecific);

    // Add stage-specific topics
    if (companyAnalysis.company_stage === 'startup') {
      topics.push('Funding rounds', 'Talent acquisition', 'Product-market fit');
    } else if (companyAnalysis.company_stage === 'enterprise') {
      topics.push('Market consolidation', 'Shareholder activism', 'Executive changes');
    }

    return topics;
  }

  /**
   * Generate smart keywords for monitoring
   */
  async generateSmartKeywords(companyName, analysis) {
    const keywords = [companyName];
    
    // Add variations of company name
    if (companyName.includes('&')) {
      keywords.push(companyName.replace('&', 'and'));
    }
    
    // Add ticker symbol if public company
    if (analysis.ticker) {
      keywords.push(`$${analysis.ticker}`);
    }
    
    // Add key products
    if (analysis.key_products) {
      keywords.push(...analysis.key_products.slice(0, 3));
    }
    
    // Add CEO/founder name if known
    if (analysis.key_executives) {
      keywords.push(...analysis.key_executives.slice(0, 2));
    }
    
    return [...new Set(keywords)];
  }

  /**
   * Create a monitoring strategy based on discovery
   */
  createMonitoringStrategy(analysis) {
    return {
      focus_areas: this.determineFocusAreas(analysis),
      alert_triggers: this.defineAlertTriggers(analysis),
      opportunity_patterns: this.identifyOpportunityPatterns(analysis),
      risk_indicators: this.identifyRiskIndicators(analysis)
    };
  }

  determineFocusAreas(analysis) {
    const areas = [];
    
    if (analysis.market_position === 'leader') {
      areas.push('Defend market position', 'Innovation leadership', 'Talent retention');
    } else if (analysis.market_position === 'challenger') {
      areas.push('Competitive differentiation', 'Market share gains', 'Disruptive messaging');
    } else if (analysis.market_position === 'emerging') {
      areas.push('Brand awareness', 'Funding news', 'Partnership opportunities');
    }
    
    return areas;
  }

  defineAlertTriggers(analysis) {
    return [
      'Competitor major announcement',
      'Regulatory change in ' + analysis.industry,
      'Market disruption event',
      'Leadership changes at competitors',
      'Industry consolidation moves'
    ];
  }

  identifyOpportunityPatterns(analysis) {
    return [
      'Competitor crisis or scandal',
      'Industry award deadlines',
      'Speaking opportunity at conferences',
      'Trending topic alignment',
      'Partnership announcements'
    ];
  }

  identifyRiskIndicators(analysis) {
    return [
      'Negative sentiment surge',
      'Regulatory investigation news',
      'Competitor aggressive moves',
      'Economic downturn signals',
      'Technology disruption threats'
    ];
  }

  /**
   * Use Claude to discover competitors when not in our database
   */
  async discoverCompetitorsWithClaude(companyName, industry) {
    const prompt = `
      List the top 8 direct competitors of ${companyName} in the ${industry} industry.
      Return ONLY company names, no descriptions.
      Focus on actual competitors they compete with for customers.
      Format: Return as a JSON array of strings.
    `;

    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-intelligence-synthesizer-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          intelligence_type: 'competitor_discovery',
          prompt: prompt,
          organization: { name: companyName, industry: industry }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.competitors || [];
      }
    } catch (error) {
      console.error('Competitor discovery failed:', error);
    }

    return [];
  }

  /**
   * Fallback discovery when APIs fail
   */
  getFallbackDiscovery(companyName) {
    return {
      company: {
        name: companyName,
        industry: 'technology',
        description: 'Company in the technology sector'
      },
      competitors: [],
      stakeholders: {
        regulators: ['FTC', 'SEC'],
        media: ['TechCrunch', 'WSJ'],
        analysts: ['Gartner', 'Forrester']
      },
      topics: ['Industry trends', 'Market dynamics'],
      keywords: [companyName],
      monitoring_strategy: {
        focus_areas: ['Brand awareness', 'Competitive position'],
        alert_triggers: ['Major announcements', 'Market changes']
      }
    };
  }

  /**
   * Default analysis structure
   */
  getDefaultAnalysis(companyName) {
    return {
      industry: 'technology',
      sub_industry: 'software',
      business_model: 'B2B SaaS',
      market_position: 'emerging',
      key_products: [],
      target_customers: ['Enterprises'],
      geographic_focus: 'Global',
      company_stage: 'growth',
      likely_pain_points: ['Market competition', 'Talent acquisition'],
      description: `${companyName} is a company in the technology sector`
    };
  }
}

export default new IntelligentDiscoveryService();