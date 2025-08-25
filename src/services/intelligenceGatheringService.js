// Intelligence Gathering Service
// This service actually fetches real intelligence data from various sources
import intelligenceOrchestratorService from './intelligenceOrchestratorService';

class IntelligenceGatheringService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://backend-orchestrator.vercel.app';
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.orchestrator = intelligenceOrchestratorService;
  }

  // Call MCP Edge Functions directly
  async callMCP(server, method, params) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/${server}-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
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

    // Try using the orchestrator first for optimal 4-phase flow
    if (config.organization?.name) {
      console.log('🎯 Using Intelligence Orchestrator for optimal flow');
      try {
        const orchestratedResult = await this.orchestrator.orchestrateIntelligence(
          {
            name: config.organization.name,
            industry: config.organization.industry || config.industry
          },
          'full'
        );

        if (orchestratedResult.success) {
          // Transform orchestrated result to match expected format
          return this.transformOrchestratedResult(orchestratedResult);
        }
      } catch (error) {
        console.log('Orchestrator failed, falling back to individual MCPs:', error);
      }
    }

    // Fallback to individual MCP calls
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
        case 'pr':  // Handle both 'intelligence' and 'pr' MCP types
          if (mcpData.insights) {
            insights.push(...mcpData.insights.map(i => ({
              stakeholder: stakeholderId === 'competitors' ? 'Competitors' : 'Industry Intelligence',
              type: i.type || 'intelligence',
              title: i.title || 'Intelligence Insight',
              insight: i.insight || 'Strategic intelligence available',
              relevance: i.relevance || 'medium',
              actionable: i.actionable !== false,
              suggestedAction: i.suggestedAction || i.action || 'Review and analyze implications',
              source: i.source || 'PR Intelligence MCP',
              data: i.data,  // Include any additional data
              timestamp: i.timestamp || new Date().toISOString()
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
          
        case 'news':
          // Handle news-intelligence Edge Function response
          if (mcpData.industryNews || mcpData.breakingNews || mcpData.trends) {
            // Add industry news
            if (mcpData.industryNews) {
              insights.push(...mcpData.industryNews.slice(0, 5).map(n => ({
                stakeholder: 'News & Trends',
                type: 'industry_news',
                title: n.title,
                insight: n.description || 'Industry news update',
                relevance: n.relevance || 'medium',
                actionable: true,
                suggestedAction: 'Monitor for PR angles and opportunities',
                source: n.source || 'News Intelligence',
                url: n.url,
                timestamp: n.publishedAt || new Date().toISOString()
              })));
            }
            // Add breaking news
            if (mcpData.breakingNews) {
              insights.push(...mcpData.breakingNews.slice(0, 3).map(n => ({
                stakeholder: 'Breaking News',
                type: 'breaking_news',
                title: n.title,
                insight: n.description || 'Breaking news alert',
                relevance: 'high',
                actionable: true,
                suggestedAction: 'Assess impact and prepare response if needed',
                source: n.source || 'News Intelligence',
                url: n.url,
                timestamp: n.publishedAt || new Date().toISOString()
              })));
            }
            // Add trending topics
            if (mcpData.trends) {
              insights.push(...mcpData.trends.slice(0, 3).map(t => ({
                stakeholder: 'Trending Topics',
                type: 'trend',
                title: t.title,
                insight: `${t.comments || 0} comments, ${t.score || 0} engagement`,
                relevance: 'high',
                actionable: true,
                suggestedAction: 'Consider joining the conversation',
                source: t.source || 'Social Media',
                url: t.url,
                timestamp: t.publishedAt || new Date().toISOString()
              })));
            }
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
      // Media stakeholders
      'tech_journalists': { mcp: 'media', method: 'discover' },
      'media': { mcp: 'media', method: 'discover' },
      'influencers': { mcp: 'media', method: 'discover' },
      
      // Competitive & Industry
      'competitors': { mcp: 'pr', method: 'gather' },
      'industry_analysts': { mcp: 'pr', method: 'gather' },
      
      // Financial stakeholders
      'investors': { mcp: 'opportunities', method: 'discover' },
      'board': { mcp: 'opportunities', method: 'discover' },
      
      // Customer & Partner relationships
      'customers': { mcp: 'analytics', method: 'analyze' },
      'partners': { mcp: 'relationships', method: 'assess' },
      'suppliers': { mcp: 'relationships', method: 'assess' },
      
      // Regulatory & Compliance
      'regulators': { mcp: 'monitor', method: 'check' },
      'activists': { mcp: 'monitor', method: 'check' },
      
      // Internal stakeholders
      'employees': { mcp: 'analytics', method: 'analyze' },
      
      // Community & Academic
      'community': { mcp: 'media', method: 'discover' },
      'academics': { mcp: 'relationships', method: 'assess' }
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
    
    // Return empty array instead of throwing error
    console.log(`⚠️ No MCP data available for ${stakeholderId} - returning empty array`);
    return [];
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

  // Transform orchestrated result to match the expected format
  transformOrchestratedResult(orchestratedResult) {
    const insights = orchestratedResult.insights || {};
    const intelligence = orchestratedResult.intelligence || {};
    
    return {
      stakeholderInsights: this.extractStakeholderInsights(insights.stakeholder),
      industryTrends: this.extractIndustryTrends(intelligence),
      competitiveIntel: this.extractCompetitiveIntel(insights.competitive),
      mediaOpportunities: this.extractMediaOpportunities(insights.opportunity),
      realTimeAlerts: this.extractRealTimeAlerts(insights.risk),
      predictions: insights.predictive || {},
      statistics: orchestratedResult.stats || {},
      timestamp: orchestratedResult.timestamp || new Date().toISOString()
    };
  }

  extractStakeholderInsights(stakeholderData) {
    if (!stakeholderData) return [];
    
    const insights = [];
    if (stakeholderData.groups) {
      stakeholderData.groups.forEach(group => {
        insights.push({
          stakeholder: group.name || 'Unknown',
          sentiment: stakeholderData.sentiment?.[group.name] || 'neutral',
          insights: group.insights || [],
          concerns: group.concerns || [],
          opportunities: group.opportunities || []
        });
      });
    }
    return insights;
  }

  extractIndustryTrends(intelligence) {
    const trends = [];
    if (intelligence.industry_trends) {
      trends.push(...intelligence.industry_trends);
    }
    if (intelligence.market_dynamics) {
      trends.push(...intelligence.market_dynamics);
    }
    return trends;
  }

  extractCompetitiveIntel(competitiveData) {
    if (!competitiveData) return [];
    
    const intel = [];
    if (competitiveData.competitors) {
      competitiveData.competitors.forEach(competitor => {
        intel.push({
          competitor: competitor.name || competitor,
          positioning: competitor.positioning || competitiveData.positioning?.[competitor.name],
          strengths: competitor.strengths || [],
          weaknesses: competitor.weaknesses || [],
          threats: competitor.threats || []
        });
      });
    }
    return intel;
  }

  extractMediaOpportunities(opportunityData) {
    if (!opportunityData) return [];
    
    const opportunities = [];
    ['immediate', 'strategic', 'market', 'partnerships'].forEach(type => {
      if (opportunityData[type]) {
        opportunityData[type].forEach(opp => {
          opportunities.push({
            type,
            opportunity: opp.description || opp,
            impact: opp.impact || 'medium',
            timeframe: opp.timeframe || 'short-term'
          });
        });
      }
    });
    return opportunities;
  }

  extractRealTimeAlerts(riskData) {
    if (!riskData) return [];
    
    const alerts = [];
    if (riskData.alerts) {
      alerts.push(...riskData.alerts);
    }
    if (riskData.immediate) {
      riskData.immediate.forEach(risk => {
        alerts.push({
          type: 'risk',
          severity: risk.severity || 'medium',
          message: risk.description || risk,
          timestamp: new Date().toISOString()
        });
      });
    }
    return alerts;
  }
}

export default new IntelligenceGatheringService();