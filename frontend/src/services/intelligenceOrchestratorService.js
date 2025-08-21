/**
 * Intelligence Orchestrator Service
 * Manages the complete 4-phase intelligence flow:
 * 1. Intelligent Discovery
 * 2. Source Mapping
 * 3. Parallel Data Gathering
 * 4. Intelligent Synthesis
 */

class IntelligenceOrchestratorService {
  constructor() {
    this.supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co').trim().replace(/\n/g, '');
    this.supabaseKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8').trim().replace(/\n/g, '');
    this.cache = new Map();
    this.activeRequests = new Map();
  }

  /**
   * Run the complete intelligence orchestration flow
   * @param {Object} organization - Organization details
   * @param {string} organization.name - Organization name
   * @param {string} organization.industry - Industry hint
   * @param {string} method - Method to run: 'full', 'discovery', 'gather'
   */
  async orchestrateIntelligence(organization, method = 'full', forceRefresh = false) {
    console.log(`🎯 Starting Intelligence Orchestration for ${organization.name}`);
    
    // Check cache (unless force refresh)
    const cacheKey = `${organization.name}_${organization.industry}_${method}`;
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
        console.log('📦 Using cached orchestration results');
        return cached.data;
      }
    }

    // Check if request is already in progress
    if (this.activeRequests.has(cacheKey)) {
      console.log('⏳ Request already in progress, waiting...');
      return this.activeRequests.get(cacheKey);
    }

    // Start new request
    const requestPromise = this._executeOrchestration(organization, method);
    this.activeRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful result
      if (result.success) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } finally {
      this.activeRequests.delete(cacheKey);
    }
  }

  async _executeOrchestration(organization, method) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          organization,
          method
        })
      });

      if (!response.ok) {
        throw new Error(`Orchestration failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Orchestration complete:', data);
      
      // Check if the Edge Function returned an error
      if (!data.success && data.error) {
        console.error('❌ Edge Function error:', data.error);
        throw new Error(data.error);
      }
      
      return this._processOrchestrationResult(data);
    } catch (error) {
      console.error('❌ Orchestration error:', error);
      return {
        success: false,
        error: error.message,
        fallback: await this._getFallbackIntelligence(organization)
      };
    }
  }

  _processOrchestrationResult(data) {
    if (!data.success) {
      return data;
    }

    // The raw orchestrator returns everything in 'intelligence', not 'insights'
    // We need to keep the raw intelligence AND extract insights for tabs
    const processed = {
      success: true,
      organization: data.organization,
      industry: data.industry,
      
      // Phase completion status - KEEP ORIGINAL
      phases_completed: data.phases_completed || {},
      
      // Statistics - KEEP ORIGINAL
      statistics: data.statistics || {},
      
      // Keep stats in both formats for compatibility
      stats: {
        competitors: data.statistics?.competitors_identified || 0,
        websites: data.statistics?.websites_scraped || 0,
        articles: data.statistics?.articles_processed || 0,
        sources: data.statistics?.sources_used || 0
      },
      
      // Main intelligence data - KEEP AS IS
      intelligence: data.intelligence || {},
      
      // Extract insights for different tabs from the intelligence data
      insights: {
        overview: this._extractOverviewInsights(data),
        competitive: this._extractCompetitiveInsights(data),
        stakeholder: this._extractStakeholderInsights(data),
        risk: this._extractRiskInsights(data),
        opportunity: this._extractOpportunityInsights(data),
        predictive: this._extractPredictiveInsights(data)
      },
      
      // Also add tab intelligence for direct compatibility
      tabIntelligence: {
        overview: this._extractOverviewInsights(data),
        competition: this._extractCompetitiveInsights(data),
        stakeholders: this._extractStakeholderInsights(data),
        topics: this._extractTopicsInsights(data),
        predictions: this._extractPredictiveInsights(data)
      },
      
      timestamp: data.timestamp || new Date().toISOString()
    };

    console.log('📊 Processed orchestration result:', {
      hasIntelligence: !!processed.intelligence,
      intelligenceKeys: Object.keys(processed.intelligence),
      hasInsights: !!processed.insights,
      insightKeys: Object.keys(processed.insights),
      phasesCompleted: processed.phases_completed
    });

    return processed;
  }

  _extractOverviewInsights(data) {
    const intelligence = data.intelligence || {};
    
    // The orchestrator now returns executive_summary as a direct string
    const summaryText = intelligence.executive_summary || 
                       intelligence.synthesized?.executive_summary || 
                       'Executive intelligence analysis in progress...';
    
    return {
      executive_summary: summaryText,
      key_insights: intelligence.key_insights || [],
      critical_alerts: intelligence.alerts || [],
      recommended_actions: intelligence.recommendations || intelligence.immediate_opportunities || []
    };
  }

  _extractTopicsInsights(data) {
    const intelligence = data.intelligence || {};
    return {
      trending_topics: intelligence.trending_topics || intelligence.industry_trends || [],
      media_coverage: intelligence.media_coverage || [],
      sentiment_analysis: intelligence.sentiment_analysis || {},
      key_narratives: intelligence.key_narratives || []
    };
  }

  _extractCompetitiveInsights(data) {
    const intelligence = data.intelligence || {};
    
    // Build proper competitive landscape structure
    const competitorProfiles = {};
    if (intelligence.competitors && Array.isArray(intelligence.competitors)) {
      intelligence.competitors.forEach(comp => {
        if (typeof comp === 'string') {
          competitorProfiles[comp] = {
            threat_level: 'medium',
            market_position: { position: 'competitive' },
            latest_developments: [],
            opportunities: []
          };
        } else if (comp.name) {
          competitorProfiles[comp.name] = {
            threat_level: comp.threat_level || 'medium',
            market_position: comp.market_position || { position: 'competitive' },
            latest_developments: comp.developments || [],
            opportunities: comp.opportunities || []
          };
        }
      });
    }
    
    return {
      competitive_landscape: {
        summary: intelligence.competitive_landscape_summary || 
                 intelligence.executive_summary?.competitive_analysis ||
                 'Competitive landscape analysis in progress',
        competitor_profiles: competitorProfiles,
        opportunities: intelligence.competitive_opportunities || []
      },
      competitor_profiles: competitorProfiles,
      competitive_opportunities: intelligence.competitive_opportunities || [],
      positioning: intelligence.competitive_positioning || {},
      advantages: intelligence.competitive_advantages || [],
      threats: intelligence.competitive_threats || [],
      recommendations: intelligence.executive_summary?.recommendations || [],
      activity: intelligence.competitor_activity || []
    };
  }

  _extractStakeholderInsights(data) {
    const intelligence = data.intelligence || {};
    // Since orchestrator doesn't return stakeholder-specific data, create defaults
    return {
      groups: ['investors', 'customers', 'employees', 'media', 'regulators'],
      sentiment: {},
      concerns: intelligence.alerts || [],
      communications: []
    };
  }

  _extractRiskInsights(data) {
    const intelligence = data.intelligence || {};
    return {
      immediate: intelligence.immediate_risks || [],
      emerging: intelligence.alerts || [],
      mitigation: [],
      alerts: intelligence.alerts || []
    };
  }

  _extractOpportunityInsights(data) {
    const intelligence = data.intelligence || {};
    return {
      immediate: intelligence.immediate_opportunities || [],
      strategic: intelligence.opportunities || [],
      market: [],
      partnerships: []
    };
  }

  _extractPredictiveInsights(data) {
    const intelligence = data.intelligence || {};
    return {
      trends: intelligence.industry_trends || [],
      scenarios: [],
      timeline: [],
      confidence: {}
    };
  }

  async _getFallbackIntelligence(organization) {
    // Basic fallback intelligence if orchestration fails
    return {
      organization: organization.name,
      industry: organization.industry || 'unknown',
      message: 'Using simplified intelligence gathering',
      insights: {
        competitive: { competitors: [], positioning: {} },
        stakeholder: { groups: [], sentiment: {} },
        risk: { immediate: [], emerging: [] },
        opportunity: { immediate: [], strategic: [] },
        predictive: { trends: [], scenarios: [] }
      }
    };
  }

  /**
   * Get just the discovery phase data
   */
  async runDiscovery(organizationName, industryHint) {
    return this.orchestrateIntelligence(
      { name: organizationName, industry: industryHint },
      'discovery'
    );
  }

  /**
   * Get discovery + gathering (no synthesis)
   */
  async runGathering(organizationName, industryHint) {
    return this.orchestrateIntelligence(
      { name: organizationName, industry: industryHint },
      'gather'
    );
  }

  /**
   * Clear cache for an organization
   */
  clearCache(organizationName = null) {
    if (organizationName) {
      // Clear specific organization
      for (const [key] of this.cache) {
        if (key.includes(organizationName)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
    console.log('🗑️ Cache cleared');
  }
}

// Export singleton instance
const intelligenceOrchestratorService = new IntelligenceOrchestratorService();
export default intelligenceOrchestratorService;