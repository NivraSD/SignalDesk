/**
 * AI Industry Expansion Service
 * Uses Claude AI to automatically expand industry categorization beyond the existing 25+ industries
 */

class AIIndustryExpansionService {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
    
    // Cache for AI-generated industry data
    this.industryCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Analyze organization and expand industry categorization using AI
   */
  async analyzeAndExpandIndustry(organizationData) {
    console.log('🔍 AI Industry Analysis for:', organizationData.name);
    
    const cacheKey = `${organizationData.name}_${organizationData.website}`;
    const cached = this.getCachedAnalysis(cacheKey);
    
    if (cached) {
      console.log('📦 Using cached AI industry analysis');
      return cached;
    }

    try {
      // Call AI Industry Expansion Edge Function
      const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-industry-expansion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          organization_name: organizationData.name,
          website: organizationData.website,
          description: organizationData.description,
          current_categories: this.getCurrentCategories(organizationData)
        })
      });

      if (response.ok) {
        const result = await response.json();
        const expandedIndustry = result.analysis;
        
        // Cache the result
        this.cacheAnalysis(cacheKey, expandedIndustry);
        
        console.log('✅ AI Industry Expansion completed:', expandedIndustry.primary_industry);
        return expandedIndustry;
      } else {
        console.error('AI Industry Expansion failed:', response.status);
        return this.getFallbackIndustryData(organizationData);
      }
    } catch (error) {
      console.error('AI Industry Expansion error:', error);
      return this.getFallbackIndustryData(organizationData);
    }
  }

  /**
   * Get current categories detected by existing systems
   */
  getCurrentCategories(organizationData) {
    return [
      organizationData.industry,
      organizationData.sector,
      organizationData.category
    ].filter(Boolean);
  }

  /**
   * Enhanced organization data with AI-expanded industry insights
   */
  async enhanceOrganizationWithAI(organizationData) {
    const aiAnalysis = await this.analyzeAndExpandIndustry(organizationData);
    
    return {
      ...organizationData,
      // Enhanced industry data
      primary_industry: aiAnalysis.primary_industry,
      subcategories: aiAnalysis.subcategories,
      
      // Expanded competitive landscape
      direct_competitors: aiAnalysis.direct_competitors,
      adjacent_competitors: aiAnalysis.adjacent_competitors,
      
      // Rich stakeholder mapping
      stakeholder_groups: aiAnalysis.stakeholder_groups,
      
      // Industry-specific monitoring
      monitoring_keywords: aiAnalysis.monitoring_keywords,
      trending_topics: aiAnalysis.trending_topics,
      
      // Ecosystem understanding
      industry_events: aiAnalysis.industry_events,
      media_outlets: aiAnalysis.media_outlets,
      regulatory_bodies: aiAnalysis.regulatory_bodies,
      ecosystem_players: aiAnalysis.ecosystem_players,
      
      // Metadata
      ai_enhanced: true,
      last_ai_analysis: new Date().toISOString()
    };
  }

  /**
   * Smart industry detection that goes beyond basic keyword matching
   */
  async smartIndustryDetection(organizationName, website, description) {
    // First try AI analysis
    const aiAnalysis = await this.analyzeAndExpandIndustry({
      name: organizationName,
      website,
      description
    });

    // If AI analysis is successful, use it
    if (aiAnalysis && aiAnalysis.primary_industry !== 'unknown') {
      return {
        industry: aiAnalysis.primary_industry,
        confidence: 'high',
        source: 'ai_analysis',
        subcategories: aiAnalysis.subcategories,
        competitors: aiAnalysis.direct_competitors.slice(0, 10),
        stakeholders: aiAnalysis.stakeholder_groups.slice(0, 8)
      };
    }

    // Fallback to pattern matching for common cases
    return this.patternBasedDetection(organizationName, website, description);
  }

  /**
   * Pattern-based detection for fallback
   */
  patternBasedDetection(name, website, description) {
    const text = `${name} ${website} ${description}`.toLowerCase();
    
    // Define pattern mappings for various industries
    const industryPatterns = {
      'public_relations': ['pr agency', 'public relations', 'communications agency', 'media relations', 'crisis communications'],
      'management_consulting': ['consulting', 'strategy consulting', 'management consulting', 'advisory', 'mckinsey', 'bain', 'bcg'],
      'marketing_advertising': ['marketing agency', 'advertising', 'digital marketing', 'creative agency', 'brand strategy'],
      'law_legal': ['law firm', 'legal services', 'attorneys', 'lawyers', 'litigation'],
      'accounting_finance': ['accounting', 'audit', 'tax services', 'financial advisory', 'cpa'],
      'architecture_design': ['architecture', 'architectural', 'design firm', 'interior design', 'urban planning'],
      'real_estate': ['real estate', 'property', 'realty', 'commercial real estate', 'residential'],
      'nonprofit': ['nonprofit', 'non-profit', 'foundation', 'charity', 'ngo'],
      'government': ['government', 'municipal', 'federal', 'state agency', 'public sector']
    };

    for (const [industry, patterns] of Object.entries(industryPatterns)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        return {
          industry,
          confidence: 'medium',
          source: 'pattern_matching',
          subcategories: [industry.split('_')[1] || 'general'],
          competitors: [],
          stakeholders: ['clients', 'employees', 'industry_peers', 'regulators']
        };
      }
    }

    return {
      industry: 'professional_services',
      confidence: 'low',
      source: 'default',
      subcategories: ['general'],
      competitors: [],
      stakeholders: ['customers', 'employees', 'partners']
    };
  }

  /**
   * Cache management
   */
  getCachedAnalysis(key) {
    const cached = this.industryCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  cacheAnalysis(key, data) {
    this.industryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fallback industry data when AI fails
   */
  getFallbackIndustryData(organizationData) {
    return {
      primary_industry: 'professional_services',
      subcategories: ['general'],
      direct_competitors: [],
      adjacent_competitors: [],
      stakeholder_groups: ['clients', 'employees', 'partners', 'regulators'],
      industry_events: [],
      media_outlets: [],
      monitoring_keywords: [organizationData.name?.toLowerCase()],
      trending_topics: [],
      regulatory_bodies: [],
      ecosystem_players: {
        suppliers: [],
        partners: [],
        customers: []
      }
    };
  }

  /**
   * Update existing industry database with AI insights
   */
  async expandExistingIndustryDatabase() {
    console.log('🚀 Expanding industry database with AI insights...');
    
    // This would update your existing MasterSourceRegistry with AI-discovered industries
    // For now, return the enhanced categorization approach
    return {
      message: 'AI Industry Expansion system ready',
      capabilities: [
        'Smart organization analysis beyond 25+ existing industries',
        'Automatic competitor discovery',
        'Stakeholder group identification',
        'Industry event and media mapping',
        'Regulatory body detection',
        'Ecosystem player analysis'
      ]
    };
  }
}

const aiIndustryExpansionService = new AIIndustryExpansionService();
export default aiIndustryExpansionService;