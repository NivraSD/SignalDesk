// Claude Intelligence Service V2
// Enhanced with specialized personas, organizational context, and memory integration

import { getIndustryCompetitors, detectIndustryFromOrganization } from '../utils/industryCompetitors';
import aiIndustryExpansionService from './aiIndustryExpansionService';
import organizationProfileService from './organizationProfileService';
import tabIntelligenceService from './tabIntelligenceService';
import intelligentDiscoveryService from './intelligentDiscoveryService';
import intelligenceOrchestratorService from './intelligenceOrchestratorService';

class ClaudeIntelligenceServiceV2 {
  constructor() {
    this.supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co').trim().replace(/\n/g, '');
    this.supabaseKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8').trim().replace(/\n/g, '');
    
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

  /**
   * Helper function to extract stakeholders as an array from either array or object format
   */
  extractStakeholdersArray(stakeholders) {
    if (!stakeholders) return [];
    
    // If it's already an array, return it
    if (Array.isArray(stakeholders)) {
      return stakeholders;
    }
    
    // If it's an object with stakeholder groups, flatten all values
    if (typeof stakeholders === 'object') {
      const allStakeholders = [];
      for (const [category, items] of Object.entries(stakeholders)) {
        if (Array.isArray(items)) {
          allStakeholders.push(...items);
        } else if (typeof items === 'string') {
          allStakeholders.push(items);
        }
      }
      return allStakeholders;
    }
    
    return [];
  }

  async gatherAndAnalyze(config, timeframe = '24h', options = {}) {
    console.log('🔍 Starting intelligent analysis');
    
    // Check if this is minimal onboarding (new approach)
    const isMinimalOnboarding = localStorage.getItem('signaldesk_minimal') === 'true';
    
    // Extract basic info
    const orgName = config.organization?.name || config.organizationName || '';
    const website = config.organization?.website || config.website || '';
    const description = config.organization?.description || '';
    const goals = config.goals || {};
    const industry = config.organization?.industry || config.industry || '';
    
    console.log(`🏢 Analyzing ${orgName}`);
    console.log('🎯 Goals:', Object.keys(goals).filter(k => goals[k]));
    
    // Try using the Intelligence Orchestrator for optimal 4-phase flow
    // Check if orchestrator is enabled (can be disabled via options or localStorage)
    const useOrchestrator = options.useOrchestrator !== false && 
                           localStorage.getItem('signaldesk_use_orchestrator') !== 'false';
    
    if (orgName && useOrchestrator) {
      console.log('🚀 Using Intelligence Orchestrator for optimal 4-phase flow');
      try {
        const orchestratedResult = await intelligenceOrchestratorService.orchestrateIntelligence(
          { name: orgName, industry: industry },
          'full'
        );
        
        if (orchestratedResult.success) {
          console.log('✅ Orchestrator succeeded, using optimized intelligence');
          console.log('📊 Raw orchestrator result:', orchestratedResult);
          
          // Only use orchestrator if it has substantial data
          if (orchestratedResult.intelligence && 
              Object.keys(orchestratedResult.intelligence).length > 5 &&
              orchestratedResult.phases_completed?.synthesis) {
            // Transform orchestrated result to match expected format
            const transformed = this.transformOrchestratedResult(orchestratedResult, config);
            console.log('🔄 Transformed result:', transformed);
            return transformed;
          } else {
            console.log('⚠️ Orchestrator returned limited data, using full flow instead');
          }
        }
      } catch (error) {
        console.log('⚠️ Orchestrator failed, falling back to original flow:', error);
      }
    } else if (!useOrchestrator) {
      console.log('🔧 Orchestrator disabled, using original multi-step flow');
    }
    
    // Step 1: Intelligent Discovery (replaces broken onboarding)
    let discoveredIntelligence;
    if (isMinimalOnboarding || !config.intelligence?.stakeholders || 
        typeof config.intelligence?.stakeholders === 'string') {
      console.log('🤖 Using intelligent discovery to find real data...');
      discoveredIntelligence = await intelligentDiscoveryService.discoverCompanyIntelligence(
        orgName, website, description
      );
    } else {
      // Fallback to old config if somehow it has real data
      discoveredIntelligence = {
        company: config.organization,
        competitors: config.organization?.competitors || [],
        stakeholders: config.intelligence?.stakeholders || {},
        topics: config.intelligence?.topics || [],
        keywords: config.intelligence?.keywords || []
      };
    }
    
    // Build profile from discovered intelligence
    const enhancedOrganization = {
      ...discoveredIntelligence.company,
      name: orgName,
      competitors: discoveredIntelligence.competitors,
      stakeholders: discoveredIntelligence.stakeholders,
      topics: discoveredIntelligence.topics,
      keywords: discoveredIntelligence.keywords
    };
    
    const profile = await organizationProfileService.getOrBuildProfile(enhancedOrganization);
    console.log('📋 Organization Profile loaded:', profile.identity.name, 
                `(${profile.confidence_level})`);
    
    // Use profile to guide intelligence gathering
    const intelligenceGuidance = organizationProfileService.getIntelligenceGuidance(profile);
    
    // Use the discovered/enhanced organization as the full context
    const fullOrganization = enhancedOrganization;
    const detectedIndustry = fullOrganization.industry || industry || 'technology';
    
    console.log('🏭 Using industry:', detectedIndustry);
    console.log('🏢 Real Competitors:', fullOrganization.competitors);
    console.log('👥 Real Stakeholders:', fullOrganization.stakeholders);
    console.log('📝 Real Topics:', fullOrganization.topics);
    console.log('🔑 Smart Keywords:', fullOrganization.keywords);
    console.log('🎯 Full organization context:', fullOrganization);
    
    // Check cache first with full context
    const cacheKey = `${fullOrganization.name}_${detectedIndustry}_${timeframe}_${JSON.stringify(goals)}`;
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
    const analysisPromise = this.performAnalysis(fullOrganization, goals, timeframe, options, profile, intelligenceGuidance);
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

  async performAnalysis(organization, goals, timeframe, options, profile, intelligenceGuidance) {
    console.log('🎯 Gathering intelligence with specialized personas');
    console.log('📊 Organization:', organization.name, '| Industry:', organization.industry);
    console.log('🎯 Active goals:', Object.entries(goals).filter(([k,v]) => v).map(([k]) => k));
    console.log('📋 Using profile guidance:', intelligenceGuidance?.search_priorities?.slice(0, 3));
    
    // Step 1: Enhance organization data with Claude before MCP calls
    const enhancedOrganization = await this.enhanceOrganizationWithClaude(organization, goals);
    
    // Step 2: Gather raw data from MCPs with ENHANCED context
    const mcpData = await this.orchestrateMCPs(enhancedOrganization, timeframe);
    
    // Step 3: Determine which analyses need second opinions
    const criticalAnalyses = this.identifyCriticalAnalyses(mcpData, goals);
    
    // Step 4: Send to Claude V2 for persona-based synthesis with profile context
    const synthesizedIntelligence = await this.synthesizeWithClaudeV2(
      mcpData, 
      enhancedOrganization, 
      goals, 
      timeframe,
      criticalAnalyses,
      profile,
      intelligenceGuidance
    );
    
    // Step 5: Store key insights in memory
    await this.storeKeyInsights(synthesizedIntelligence, enhancedOrganization);
    
    // Generate tab-specific intelligence using profile
    const tabIntelligence = await tabIntelligenceService.generateTabIntelligence(
      enhancedOrganization,
      synthesizedIntelligence,
      profile
    );
    
    // Update profile with new intelligence
    await organizationProfileService.updateProfile(enhancedOrganization, synthesizedIntelligence);
    
    // Return enhanced intelligence with tab-specific content
    return {
      ...synthesizedIntelligence,
      profile: {
        confidence_level: profile.confidence_level,
        last_updated: profile.last_updated,
        established_facts: profile.established_facts
      },
      tabs: tabIntelligence,
      guidance: intelligenceGuidance
    };
  }

  async enhanceOrganizationWithClaude(organization, goals) {
    console.log('🔮 Enhancing organization data with AI Industry Expansion');
    
    try {
      // Use AI to EXPAND industry data, not necessarily to override the industry
      const fullAnalysis = await aiIndustryExpansionService.analyzeAndExpandIndustry({
        name: organization.name,
        website: organization.website,
        description: organization.description,
        industry: organization.industry // Pass user's industry selection
      });
      
      console.log('🎯 AI analysis complete for industry:', organization.industry || fullAnalysis.primary_industry);
      
      // Respect user's industry choice if provided
      const finalIndustry = organization.industry || fullAnalysis.primary_industry;
      
      return {
        ...organization,
        // Keep user's industry or use AI's if none provided
        industry: finalIndustry,
        subcategories: fullAnalysis.subcategories,
        
        // Use AI-discovered competitors instead of generic tech defaults
        competitors: [...new Set([
          ...(organization.competitors || []), 
          ...fullAnalysis.direct_competitors.slice(0, 8)
        ])],
        
        // Rich stakeholder data from AI
        stakeholders: [...new Set([
          ...this.extractStakeholdersArray(organization.stakeholders), 
          ...fullAnalysis.stakeholder_groups.slice(0, 6)
        ])],
        
        // Industry-specific topics and keywords
        topics: [...new Set([
          ...(organization.topics || []), 
          ...fullAnalysis.trending_topics.slice(0, 5)
        ])],
        keywords: [...new Set([
          ...(organization.keywords || []), 
          ...fullAnalysis.monitoring_keywords.slice(0, 10)
        ])],
        
        // Additional AI insights
        industryInsights: {
          media_outlets: fullAnalysis.media_outlets,
          industry_events: fullAnalysis.industry_events,
          regulatory_bodies: fullAnalysis.regulatory_bodies,
          ecosystem_players: fullAnalysis.ecosystem_players
        },
        
        enhancedAt: new Date().toISOString(),
        enhancementSource: 'ai_expansion'
      };
      
    } catch (error) {
      console.error('Failed to enhance organization with AI:', error);
      return await this.fallbackClaudeEnhancement(organization, goals);
    }
  }

  async fallbackClaudeEnhancement(organization, goals) {
    console.log('🔄 Using fallback Claude enhancement');
    
    try {
      const enhancementPrompt = `
        Organization: ${organization.name}
        Industry: ${organization.industry}
        Website: ${organization.website || 'Not provided'}
        
        This is NOT a technology company. Analyze the actual business and industry.
        Provide relevant competitors, stakeholders, and keywords specific to their industry.
        
        DO NOT default to tech companies like Google, Apple, Microsoft unless this is actually a tech company.
      `;
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-intelligence-synthesizer-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({
          intelligence_type: 'enhance_organization',
          organization,
          goals,
          prompt: enhancementPrompt
        })
      });
      
      if (response.ok) {
        const enhanced = await response.json();
        console.log('✨ Organization enhanced with fallback Claude insights');
        
        return {
          ...organization,
          competitors: [...new Set([...(organization.competitors || []), ...(enhanced.competitors || [])])],
          stakeholders: [...new Set([...this.extractStakeholdersArray(organization.stakeholders), ...this.extractStakeholdersArray(enhanced.stakeholders)])],
          topics: [...new Set([...(organization.topics || []), ...(enhanced.topics || [])])],
          keywords: [...new Set([...(organization.keywords || []), ...(enhanced.keywords || [])])],
          industryInsights: enhanced.industryInsights || {},
          enhancedAt: new Date().toISOString(),
          enhancementSource: 'claude_fallback'
        };
      }
    } catch (error) {
      console.error('Fallback enhancement also failed:', error);
    }
    
    // Return original if both enhancements fail
    return organization;
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

  async synthesizeWithClaudeV2(mcpData, organization, goals, timeframe, criticalAnalyses, profile, intelligenceGuidance) {
    console.log('🧠 Synthesizing with Claude V2 specialized personas');
    console.log('📋 Profile context:', profile?.identity?.name, profile?.confidence_level);
    
    try {
      // Call different synthesis types in parallel with V2 endpoint, including profile context
      const synthesisPromises = [
        this.callClaudeV2Synthesizer('competitor', mcpData.competitive, organization, goals, timeframe, 
          criticalAnalyses.includes('competitor'), profile, intelligenceGuidance),
        this.callClaudeV2Synthesizer('stakeholder', {
          relationships: mcpData.stakeholder,
          media: mcpData.media
        }, organization, goals, timeframe, 
          criticalAnalyses.includes('stakeholder'), profile, intelligenceGuidance),
        this.callClaudeV2Synthesizer('narrative', {
          news: mcpData.news,
          media: mcpData.media,
          analytics: mcpData.analytics
        }, organization, goals, timeframe,
          criticalAnalyses.includes('narrative'), profile, intelligenceGuidance),
        this.callClaudeV2Synthesizer('predictive', mcpData, organization, goals, timeframe,
          criticalAnalyses.includes('predictive'), profile, intelligenceGuidance),
      ];

      const results = await Promise.allSettled(synthesisPromises);
      
      // Get executive summary based on all analyses
      const allAnalyses = {
        competitor: results[0].status === 'fulfilled' ? results[0].value : null,
        stakeholder: results[1].status === 'fulfilled' ? results[1].value : null,
        narrative: results[2].status === 'fulfilled' ? results[2].value : null,
        predictive: results[3].status === 'fulfilled' ? results[3].value : null,
      };

      // Executive summary with second opinion and profile context
      const executiveSummary = await this.callClaudeV2Synthesizer(
        'executive_summary', 
        allAnalyses, 
        organization, 
        goals, 
        timeframe,
        criticalAnalyses.includes('executive_summary'),
        profile,
        intelligenceGuidance
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

  async callClaudeV2Synthesizer(intelligenceType, mcpData, organization, goals, timeframe, requiresSecondOpinion = false, profile = null, intelligenceGuidance = null) {
    // Log what we're sending to Claude
    console.log(`🚀 Sending to Claude ${intelligenceType}:`, {
      hasOrganization: !!organization,
      orgName: organization?.name,
      industry: organization?.industry,
      competitors: organization?.competitors,
      stakeholders: organization?.stakeholders,
      topics: organization?.topics,
      goalsCount: Object.keys(goals || {}).filter(k => goals[k]).length,
      hasMcpData: !!mcpData,
      hasProfile: !!profile,
      profileConfidence: profile?.confidence_level
    });
    
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
          requires_second_opinion: requiresSecondOpinion,
          profile: profile ? {
            established_facts: profile.established_facts,
            monitoring_targets: profile.monitoring_targets,
            objectives: profile.objectives,
            context_flags: profile.context
          } : null,
          guidance: intelligenceGuidance
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
    // Use organization name as fallback if no ID exists
    const memoryId = organization.id || organization.name?.toLowerCase().replace(/\s+/g, '_');
    const memoryKey = `signaldesk_memory_${memoryId}`;
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

  /**
   * Transform orchestrated result to match the expected format
   */
  transformOrchestratedResult(orchestratedResult, config) {
    const insights = orchestratedResult.insights || {};
    const intelligence = orchestratedResult.intelligence || {};
    const stats = orchestratedResult.stats || {};
    
    // Build the response in the expected format
    return {
      // Tab content
      tabIntelligence: {
        competition: {
          competitors: insights.competitive?.competitors || [],
          positioning: insights.competitive?.positioning || {},
          advantages: insights.competitive?.advantages || [],
          threats: insights.competitive?.threats || [],
          recommendations: insights.competitive?.recommendations || []
        },
        stakeholders: {
          groups: insights.stakeholder?.groups || [],
          sentiment: insights.stakeholder?.sentiment || {},
          concerns: insights.stakeholder?.concerns || [],
          communications: insights.stakeholder?.communications || []
        },
        topics: {
          trends: intelligence.industry_trends || [],
          emerging: intelligence.emerging_topics || [],
          discussions: intelligence.discussions || []
        },
        predictions: insights.predictive || {}
      },
      
      // Executive overview
      executiveOverview: intelligence.executive_summary || {
        key_insights: intelligence.key_insights || [],
        critical_actions: intelligence.critical_actions || [],
        opportunities: insights.opportunity?.immediate || [],
        risks: insights.risk?.immediate || []
      },
      
      // MCP data (from orchestrator)
      raw_mcp_data: {
        competitors_identified: stats.competitors || 0,
        websites_scraped: stats.websites || 0,
        articles_processed: stats.articles || 0,
        sources_used: stats.sources || 0
      },
      
      // Analysis metadata
      analysis_metadata: {
        timestamp: orchestratedResult.timestamp || new Date().toISOString(),
        orchestrator_used: true,
        phases_completed: orchestratedResult.phases || {},
        organization: orchestratedResult.organization,
        industry: orchestratedResult.industry,
        confidence_scores: intelligence.confidence_scores || {}
      },
      
      // Profile data
      profile: {
        organization: config.organization || {},
        goals: config.goals || {},
        stakeholders: insights.stakeholder?.groups || [],
        topics: intelligence.topics || [],
        keywords: intelligence.keywords || []
      }
    };
  }
}

export default new ClaudeIntelligenceServiceV2();