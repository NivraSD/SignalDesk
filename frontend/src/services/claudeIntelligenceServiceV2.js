// Claude Intelligence Service V2
// Enhanced with specialized personas, organizational context, and memory integration

import { getIndustryCompetitors, detectIndustryFromOrganization } from '../utils/industryCompetitors';

class ClaudeIntelligenceServiceV2 {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
    
    // Track which personas are being used
    this.activePersonas = {
      competitive_strategist: false,
      stakeholder_psychologist: false,
      narrative_architect: false,
      risk_prophet: false,
      opportunity_hunter: false,
      executive_synthesizer: false
    };
    
    // Cache for recent analyses to avoid redundant calls
    this.analysisCache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes - shorter cache for real-time experience
    this.pendingRequests = new Map(); // Track pending requests to prevent duplicates
  }

  async gatherAndAnalyze(config, timeframe = '24h', options = {}) {
    // Extract ALL onboarding data - FIXED to match actual structure
    const organization = config.organization || {};
    const goals = config.goals || {};
    
    // Get org details from the CORRECT location in the config structure
    const orgName = organization.name || config.organizationName || '';
    const industry = organization.industry || config.industry || detectIndustryFromOrganization(orgName);
    const website = organization.website || config.website || '';
    
    console.log(`🏭 Industry detection for ${orgName}: ${industry}`);
    
    // Get industry-specific competitors and keywords
    const industryData = getIndustryCompetitors(industry);
    
    // Get stakeholders and topics from intelligence section
    const stakeholders = config.intelligence?.stakeholders || config.stakeholders || [];
    const additionalTopics = config.intelligence?.topics || config.monitoring?.topics || config.additionalTopics || [];
    const keywords = config.intelligence?.keywords || config.monitoring?.keywords || [];
    
    // Use industry-specific competitors if user didn't provide any
    const userCompetitors = config.targets?.competitors || config.competitors || [];
    const competitors = userCompetitors.length > 0 ? userCompetitors : industryData.primary.slice(0, 5);
    
    // Enhanced organization object with ALL context and industry data
    const fullOrganization = {
      ...organization,
      name: orgName,
      industry: industry,
      website: website,
      competitors: competitors,
      stakeholders: stakeholders,
      topics: [...additionalTopics, ...industryData.topics],
      keywords: [...keywords, ...industryData.keywords],
      emergingCompetitors: industryData.emerging.slice(0, 3),
      industryContext: industryData // Include full industry data for reference
    };
    
    console.log('🎯 Full organization context:', fullOrganization);
    console.log('🏢 Tracking competitors:', fullOrganization.competitors);
    
    // Check cache first with full context
    const cacheKey = `${fullOrganization.name}_${industry}_${timeframe}_${JSON.stringify(goals)}`;
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached && !options.forceRefresh) {
      console.log('📦 Using cached analysis');
      return cached;
    }

    // Check if request is already pending to prevent duplicates
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ Request already pending, waiting for result...');
      return await this.pendingRequests.get(cacheKey);
    }
    
    // Create a promise for this request to prevent duplicates
    const analysisPromise = this.performAnalysis(fullOrganization, goals, timeframe, options);
    this.pendingRequests.set(cacheKey, analysisPromise);
    
    try {
      const result = await analysisPromise;
      // Cache the result
      this.cacheAnalysis(cacheKey, result);
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  async performAnalysis(organization, goals, timeframe, options) {
    console.log('🎯 Gathering intelligence with specialized personas');
    console.log('📊 Organization:', organization.name, '| Industry:', organization.industry);
    console.log('🎯 Active goals:', Object.entries(goals).filter(([k,v]) => v).map(([k]) => k));
    
    // Step 1: Gather raw data from MCPs with FULL context
    const mcpData = await this.orchestrateMCPs(organization, timeframe);
    
    // Step 2: Determine which analyses need second opinions
    const criticalAnalyses = this.identifyCriticalAnalyses(mcpData, goals);
    
    // Step 3: Send to Claude V2 for persona-based synthesis
    const synthesizedIntelligence = await this.synthesizeWithClaudeV2(
      mcpData, 
      organization, 
      goals, 
      timeframe,
      criticalAnalyses
    );
    
    // Step 4: Store key insights in memory
    await this.storeKeyInsights(synthesizedIntelligence, organization);
    
    return synthesizedIntelligence;
  }

  identifyCriticalAnalyses(mcpData, goals) {
    const critical = [];
    
    // Competitor movements are always critical
    if (mcpData.competitive && Object.keys(mcpData.competitive).length > 0) {
      critical.push('competitor');
    }
    
    // Risk assessments need second opinions
    if (mcpData.monitoring?.alerts?.some(a => a.severity === 'critical')) {
      critical.push('predictive');
    }
    
    // Executive summaries for important goals
    if (goals.investor_relations || goals.crisis_preparedness) {
      critical.push('executive_summary');
    }
    
    return critical;
  }

  async orchestrateMCPs(organization, timeframe) {
    console.log('📊 Orchestrating MCPs for', organization.name);
    
    // Parallel MCP calls with enhanced parameters
    const mcpCalls = [
      this.callMCP('pr', 'gather', { 
        organization, 
        timeframe,
        focus: 'competitive_intelligence' 
      }),
      this.callMCP('news', 'gather', { 
        organization, 
        timeframe,
        focus: 'market_trends' 
      }),
      this.callMCP('media', 'discover', { 
        organization, 
        timeframe,
        focus: 'media_coverage' 
      }),
      this.callMCP('opportunities', 'discover', { 
        organization, 
        timeframe,
        focus: 'strategic_opportunities' 
      }),
      this.callMCP('analytics', 'analyze', { 
        organization, 
        timeframe,
        metrics: ['sentiment', 'reach', 'engagement'] 
      }),
      this.callMCP('relationships', 'assess', { 
        organization, 
        timeframe,
        stakeholders: 'all' 
      }),
      this.callMCP('monitor', 'check', { 
        organization, 
        timeframe,
        alert_level: 'all' 
      }),
    ];

    const results = await Promise.allSettled(mcpCalls);
    
    // Organize results by type with enhanced error handling
    const mcpData = {
      competitive: results[0].status === 'fulfilled' ? results[0].value : null,
      news: results[1].status === 'fulfilled' ? results[1].value : null,
      media: results[2].status === 'fulfilled' ? results[2].value : null,
      opportunities: results[3].status === 'fulfilled' ? results[3].value : null,
      analytics: results[4].status === 'fulfilled' ? results[4].value : null,
      stakeholder: results[5].status === 'fulfilled' ? results[5].value : null,
      monitoring: results[6].status === 'fulfilled' ? results[6].value : null,
    };

    // Log successful data gathering
    const successfulMCPs = Object.keys(mcpData).filter(k => mcpData[k]);
    console.log('✅ MCP data gathered from:', successfulMCPs.join(', '));
    
    // Warn about failed MCPs
    const failedMCPs = Object.keys(mcpData).filter(k => !mcpData[k]);
    if (failedMCPs.length > 0) {
      console.warn('⚠️ Failed to gather from:', failedMCPs.join(', '));
    }
    
    return mcpData;
  }

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
      return null;
    } catch (error) {
      console.log(`MCP ${server}.${method} failed:`, error.message);
      return null;
    }
  }

  async synthesizeWithClaudeV2(mcpData, organization, goals, timeframe, criticalAnalyses) {
    console.log('🧠 Synthesizing with Claude V2 specialized personas');
    
    try {
      // Call different synthesis types in parallel with V2 endpoint
      const synthesisPromises = [
        this.callClaudeV2Synthesizer('competitor', mcpData.competitive, organization, goals, timeframe, 
          criticalAnalyses.includes('competitor')),
        this.callClaudeV2Synthesizer('stakeholder', {
          relationships: mcpData.stakeholder,
          media: mcpData.media
        }, organization, goals, timeframe, 
          criticalAnalyses.includes('stakeholder')),
        this.callClaudeV2Synthesizer('narrative', {
          news: mcpData.news,
          media: mcpData.media,
          analytics: mcpData.analytics
        }, organization, goals, timeframe,
          criticalAnalyses.includes('narrative')),
        this.callClaudeV2Synthesizer('predictive', mcpData, organization, goals, timeframe,
          criticalAnalyses.includes('predictive')),
      ];

      const results = await Promise.allSettled(synthesisPromises);
      
      // Get executive summary based on all analyses
      const allAnalyses = {
        competitor: results[0].status === 'fulfilled' ? results[0].value : null,
        stakeholder: results[1].status === 'fulfilled' ? results[1].value : null,
        narrative: results[2].status === 'fulfilled' ? results[2].value : null,
        predictive: results[3].status === 'fulfilled' ? results[3].value : null,
      };

      // Executive summary with second opinion
      const executiveSummary = await this.callClaudeV2Synthesizer(
        'executive_summary', 
        allAnalyses, 
        organization, 
        goals, 
        timeframe,
        criticalAnalyses.includes('executive_summary')
      );

      // Track which personas were activated
      this.updateActivePersonas(allAnalyses);

      return {
        ...allAnalyses,
        executive_summary: executiveSummary,
        raw_mcp_data: mcpData,
        analysis_metadata: {
          timestamp: new Date().toISOString(),
          timeframe,
          personas_used: this.getActivePersonas(),
          critical_analyses: criticalAnalyses,
          confidence_scores: this.extractConfidenceScores(allAnalyses)
        }
      };

    } catch (error) {
      console.error('Claude V2 synthesis failed:', error);
      
      // Fallback to structured MCP data if Claude fails
      return this.getFallbackAnalysis(mcpData);
    }
  }

  async callClaudeV2Synthesizer(intelligenceType, mcpData, organization, goals, timeframe, requiresSecondOpinion = false) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-intelligence-synthesizer-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          intelligence_type: intelligenceType,
          mcp_data: mcpData,
          organization,
          goals,
          timeframe,
          requires_second_opinion: requiresSecondOpinion
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          // Log persona usage
          if (data.personas_used) {
            console.log(`📝 ${intelligenceType} analyzed by:`, data.personas_used.join(', '));
          }
          return data.analysis;
        } else {
          console.log(`⚠️ Claude V2 returned success=false for ${intelligenceType}:`, data.error);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Claude V2 HTTP error for ${intelligenceType} (${response.status}):`, errorText);
      }
      return null;
    } catch (error) {
      console.error(`Claude V2 synthesis for ${intelligenceType} failed:`, error);
      return null;
    }
  }

  async storeKeyInsights(intelligence, organization) {
    // Store critical insights in memory for future reference
    const keyInsights = [];
    
    if (intelligence.executive_summary?.key_insight) {
      keyInsights.push({
        type: 'executive_insight',
        content: intelligence.executive_summary.key_insight,
        confidence: intelligence.analysis_metadata?.confidence_scores?.executive || 0
      });
    }
    
    if (intelligence.competitor?.priority_focus) {
      keyInsights.push({
        type: 'competitive_priority',
        content: intelligence.competitor.priority_focus,
        confidence: intelligence.analysis_metadata?.confidence_scores?.competitor || 0
      });
    }
    
    if (intelligence.predictive?.cascade_risks?.length > 0) {
      keyInsights.push({
        type: 'risk_alert',
        content: intelligence.predictive.cascade_risks[0],
        confidence: intelligence.analysis_metadata?.confidence_scores?.predictive || 0
      });
    }
    
    // Store in localStorage for now (would be database in production)
    const memoryKey = `signaldesk_memory_${organization.id}`;
    const existingMemory = JSON.parse(localStorage.getItem(memoryKey) || '[]');
    
    keyInsights.forEach(insight => {
      existingMemory.push({
        ...insight,
        timestamp: new Date().toISOString(),
        organization_id: organization.id
      });
    });
    
    // Keep only last 100 insights
    const trimmedMemory = existingMemory.slice(-100);
    localStorage.setItem(memoryKey, JSON.stringify(trimmedMemory));
    
    console.log('💾 Stored', keyInsights.length, 'key insights in memory');
  }

  updateActivePersonas(analyses) {
    // Track which personas provided valuable input
    this.activePersonas = {
      competitive_strategist: !!analyses.competitor,
      stakeholder_psychologist: !!analyses.stakeholder,
      narrative_architect: !!analyses.narrative,
      risk_prophet: !!analyses.predictive,
      opportunity_hunter: !!analyses.predictive,
      executive_synthesizer: !!analyses.executive_summary
    };
  }

  getActivePersonas() {
    return Object.entries(this.activePersonas)
      .filter(([_, active]) => active)
      .map(([persona]) => persona);
  }

  extractConfidenceScores(analyses) {
    const scores = {};
    
    // Extract confidence from second opinions if available
    Object.entries(analyses).forEach(([key, value]) => {
      if (value?.consensus_level) {
        scores[key] = value.consensus_level;
      } else if (value?.overall_confidence) {
        scores[key] = value.overall_confidence;
      } else {
        scores[key] = 70; // Default confidence
      }
    });
    
    return scores;
  }

  getCachedAnalysis(key) {
    const cached = this.analysisCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.analysisCache.delete(key);
    return null;
  }

  cacheAnalysis(key, data) {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.analysisCache.size > 10) {
      const oldestKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(oldestKey);
    }
  }

  getFallbackAnalysis(mcpData) {
    // Structured fallback when Claude is unavailable
    return {
      competitor: {
        key_movements: [],
        strategic_patterns: ["Analysis temporarily unavailable"],
        recommended_actions: ["Continue monitoring"],
        competitive_advantage: "Under analysis",
        priority_focus: "Maintain current strategy"
      },
      stakeholder: {
        stakeholder_map: [],
        coalition_opportunities: [],
        risk_stakeholders: [],
        engagement_strategies: [],
        immediate_actions: ["Review stakeholder positions"]
      },
      narrative: {
        goal_narrative_alignment: {},
        whitespace_opportunities: [],
        messaging_recommendations: [],
        emerging_narratives: [],
        narrative_strategy: "Maintain consistent messaging"
      },
      predictive: {
        goal_impact_forecast: {},
        predicted_competitor_moves: [],
        cascade_risks: [],
        goal_vulnerabilities: [],
        proactive_recommendations: ["Continue monitoring"]
      },
      executive_summary: {
        key_insight: "Intelligence system processing",
        immediate_priorities: ["Gather more data", "Monitor developments"],
        biggest_opportunity: "Under analysis",
        biggest_risk: "Limited visibility",
        resource_allocation: {},
        thirty_day_strategy: "Maintain current operations while gathering intelligence"
      },
      raw_mcp_data: mcpData,
      analysis_metadata: {
        timestamp: new Date().toISOString(),
        fallback_mode: true,
        personas_used: [],
        confidence_scores: {}
      }
    };
  }
}

export default new ClaudeIntelligenceServiceV2();