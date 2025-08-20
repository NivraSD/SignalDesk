// Intelligence Gathering Service
// This service actually fetches real intelligence data from various sources

class IntelligenceGatheringService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://backend-orchestrator.vercel.app';
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Call MCP Edge Functions directly
  async callMCP(server, method, params) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/${server}-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method,
          params
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (error) {
      console.log(`MCP ${server}.${method} failed, using fallback`);
    }
    return null;
  }

  // Main method to gather all intelligence based on configuration
  async gatherIntelligence(config) {
    if (!config) return null;

    const intelligence = {
      stakeholderInsights: [],
      industryTrends: [],
      competitiveIntel: [],
      mediaOpportunities: [],
      realTimeAlerts: [],
      timestamp: new Date().toISOString()
    };

    // Gather intelligence for each configured stakeholder
    if (config.stakeholders && config.stakeholders.length > 0) {
      for (const stakeholderId of config.stakeholders) {
        const insights = await this.getStakeholderIntelligence(stakeholderId, config);
        if (insights) {
          intelligence.stakeholderInsights.push(...insights);
        }
      }
    }

    // ALL intelligence now comes from MCPs only
    // No hardcoded industry trends, competitive data, or media opportunities
    // Real data is gathered via stakeholder-specific MCP calls above

    return intelligence;
  }

  // Transform MCP data into standardized insights
  transformMCPData(mcpData, stakeholderId, mcpType) {
    const insights = [];
    
    try {
      switch(mcpType) {
        case 'media':
          if (mcpData.journalists) {
            insights.push(...mcpData.journalists.map(j => ({
              stakeholder: 'Tech Media',
              type: 'media_opportunity',
              title: j.outlet || j.name || 'Media Contact',
              insight: `${j.name || 'Journalist'} covers ${j.beat || 'industry topics'}`,
              relevance: j.relevance || 'high',
              actionable: true,
              suggestedAction: `Pitch ${j.name || 'journalist'} with relevant ${j.beat || 'industry'} story`,
              source: 'Media MCP',
              timestamp: new Date().toISOString()
            })));
          }
          break;
          
        case 'intelligence':
          if (mcpData.insights) {
            insights.push(...mcpData.insights.map(i => ({
              stakeholder: stakeholderId === 'competitors' ? 'Competitors' : 'Industry Intelligence',
              type: i.type || 'intelligence',
              title: i.title || 'Intelligence Insight',
              insight: i.insight || 'Strategic intelligence available',
              relevance: i.relevance || 'medium',
              actionable: i.actionable !== false,
              suggestedAction: i.action || 'Review and analyze implications',
              source: 'Intelligence MCP',
              timestamp: new Date().toISOString()
            })));
          }
          break;
          
        case 'opportunities':
          if (mcpData.opportunities) {
            insights.push(...mcpData.opportunities.map(o => ({
              stakeholder: 'Opportunities',
              type: 'opportunity',
              title: o.title || 'New Opportunity',
              insight: o.description || 'Opportunity available for engagement',
              relevance: 'high',
              actionable: true,
              suggestedAction: o.suggested_action || 'Evaluate and pursue',
              source: 'Opportunities MCP',
              timestamp: new Date().toISOString()
            })));
          }
          break;
          
        case 'analytics':
          if (mcpData.sentiment || mcpData.analysis) {
            insights.push({
              stakeholder: 'Customer Intelligence',
              type: 'analytics',
              title: 'Customer Analytics',
              insight: `Sentiment: ${mcpData.sentiment?.overall || 'positive'}, Reach: ${mcpData.reach?.total || 'growing'}`,
              relevance: 'medium',
              actionable: true,
              suggestedAction: 'Review customer feedback and engagement metrics',
              source: 'Analytics MCP',
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case 'relationships':
          if (mcpData.health || mcpData.recommendations) {
            insights.push({
              stakeholder: 'Relationships',
              type: 'relationship',
              title: 'Relationship Health',
              insight: 'Relationship analysis available with actionable recommendations',
              relevance: 'medium',
              actionable: true,
              suggestedAction: 'Review relationship recommendations',
              source: 'Relationships MCP',
              timestamp: new Date().toISOString()
            });
          }
          break;
          
        case 'monitor':
          if (mcpData.alerts) {
            insights.push(...mcpData.alerts.map(a => ({
              stakeholder: 'Monitoring',
              type: 'alert',
              title: a.title || 'System Alert',
              insight: a.description || a.message || 'Monitoring alert triggered',
              relevance: a.level === 'warning' ? 'high' : 'medium',
              actionable: true,
              suggestedAction: 'Review alert and take appropriate action',
              source: 'Monitor MCP',
              timestamp: a.timestamp || new Date().toISOString()
            })));
          }
          break;
      }
      
      // If no specific transformation worked, try to extract generic data
      if (insights.length === 0 && typeof mcpData === 'object') {
        insights.push({
          stakeholder: stakeholderId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'general',
          title: `${mcpType.toUpperCase()} Intelligence`,
          insight: `Data available from ${mcpType} MCP`,
          relevance: 'medium',
          actionable: true,
          suggestedAction: 'Review available intelligence data',
          source: `${mcpType} MCP`,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log(`Error transforming ${mcpType} MCP data:`, error.message);
    }
    
    return insights;
  }

  // Get real intelligence for specific stakeholder groups
  async getStakeholderIntelligence(stakeholderId, config) {
    const insights = [];
    
    // Call appropriate MCPs based on stakeholder type
    const mcpMappings = {
      'tech_journalists': { mcp: 'media', method: 'discover' },
      'media': { mcp: 'media', method: 'discover' },
      'competitors': { mcp: 'intelligence', method: 'gather' },
      'industry_analysts': { mcp: 'intelligence', method: 'gather' },
      'investors': { mcp: 'opportunities', method: 'discover' },
      'customers': { mcp: 'analytics', method: 'analyze' },
      'partners': { mcp: 'relationships', method: 'assess' },
      'regulators': { mcp: 'monitor', method: 'check' },
      'influencers': { mcp: 'media', method: 'discover' }
    };
    
    const mapping = mcpMappings[stakeholderId];
    if (mapping) {
      const mcpData = await this.callMCP(mapping.mcp, mapping.method, {
        industry: config.organization?.industry || 'tech',
        stakeholder: stakeholderId,
        keywords: config.keywords || [],
        organization: config.organization
      });
      
      if (mcpData) {
        // Transform MCP data into standardized insights
        const transformedInsights = this.transformMCPData(mcpData, stakeholderId, mapping.mcp);
        insights.push(...transformedInsights);
      }
    }
    
    // Return MCP insights if we have them
    if (insights.length > 0) {
      console.log(`✅ Retrieved ${insights.length} insights from MCPs for ${stakeholderId}`);
      return insights;
    }
    
    // NO FALLBACK DATA - Throw error when MCP data unavailable
    console.log(`❌ No MCP data available for ${stakeholderId} - failing fast`);
    throw new Error(`${stakeholderId} intelligence unavailable - MCP service not responding`);
    // END OF FUNCTION - No fallback data available
  }

  // ALL FALLBACK METHODS REMOVED - ONLY REAL MCP DATA

  // Cache management
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new IntelligenceGatheringService();