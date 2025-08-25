/**
 * Intelligence Orchestrator V4 - Elite Analysis Architecture
 * Fast collection via Edge Function + Deep analysis via MCP
 */

class IntelligenceOrchestratorV4 {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';
    
    console.log('🎯 V4 Elite Orchestrator initialized');
  }

  /**
   * Run elite intelligence analysis
   * 1. Fast collection from Edge Function
   * 2. Deep analysis from MCP (if available)
   * 3. Fallback to synthesis if MCP unavailable
   */
  async orchestrate(config) {
    const organization = config.organization || config;
    console.log(`🚀 V4 Elite Analysis starting for ${organization.name}`);
    
    try {
      // PHASE 1: FAST COLLECTION (30s limit)
      console.log('📡 Phase 1: Fast Intelligence Collection');
      
      const collectionResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-collection-v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`
        },
        body: JSON.stringify({ 
          organization,
          entities: {
            competitors: config.competitors || [],
            regulators: config.regulators || [],
            activists: config.activists || [],
            media_outlets: config.media_outlets || [],
            investors: config.investors || [],
            analysts: config.analysts || []
          }
        })
      });

      if (!collectionResponse.ok) {
        throw new Error(`Collection failed: ${collectionResponse.status}`);
      }

      const collectionData = await collectionResponse.json();
      console.log('✅ Collection complete:', {
        signals: collectionData.intelligence?.raw_signals?.length || 0,
        sources: collectionData.intelligence?.metadata?.sources || []
      });

      // PHASE 2: DEEP ANALYSIS
      let analysisResult;
      
      // Try MCP analysis first (if MCP server is running)
      try {
        console.log('🧠 Phase 2a: Attempting MCP Deep Analysis');
        analysisResult = await this.callMCPAnalysis(collectionData.intelligence, organization);
        console.log('✅ MCP Analysis successful');
      } catch (mcpError) {
        console.log('⚠️ MCP not available, falling back to Edge Function synthesis');
        
        // Fallback to Edge Function synthesis
        analysisResult = await this.callEdgeSynthesis(collectionData.intelligence, organization);
      }

      // PHASE 3: FORMAT FOR DISPLAY
      const formattedResult = this.formatForDisplay(analysisResult, collectionData);
      
      return {
        success: true,
        ...formattedResult,
        metadata: {
          organization: organization.name,
          timestamp: new Date().toISOString(),
          pipeline_version: 'v4-elite',
          analysis_type: analysisResult.analysis_type || 'synthesis'
        }
      };

    } catch (error) {
      console.error('❌ V4 Orchestration error:', error);
      
      return {
        success: false,
        error: error.message,
        analysis: this.getEmptyAnalysis()
      };
    }
  }

  async callMCPAnalysis(intelligence, organization) {
    // Call MCP server for deep analysis
    // This would connect to the local MCP server
    try {
      const response = await fetch('http://localhost:3100/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signals: intelligence.raw_signals,
          organization
        }),
        timeout: 10000 // 10 second timeout for MCP check
      });

      if (!response.ok) {
        throw new Error('MCP not available');
      }

      const analysis = await response.json();
      return {
        ...analysis,
        analysis_type: 'mcp-deep'
      };
    } catch (error) {
      throw new Error('MCP analysis failed');
    }
  }

  async callEdgeSynthesis(intelligence, organization) {
    // Transform raw signals into format expected by synthesis
    const transformedIntelligence = {
      entity_actions: {
        all: intelligence.raw_signals.filter(s => s.entity).map(signal => ({
          entity: signal.entity,
          type: signal.entity_type || 'other',
          action: signal.title,
          description: signal.content,
          source: signal.source,
          url: signal.url,
          timestamp: signal.published || new Date().toISOString(),
          impact: 'medium',
          relevance: 0.7
        }))
      },
      topic_trends: {
        all: this.extractTopicTrends(intelligence.raw_signals)
      }
    };

    const synthesisResponse = await fetch(`${this.supabaseUrl}/functions/v1/intelligence-synthesis-v4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`
      },
      body: JSON.stringify({
        intelligence: transformedIntelligence,
        organization
      })
    });

    if (!synthesisResponse.ok) {
      throw new Error(`Synthesis failed: ${synthesisResponse.status}`);
    }

    const synthesisData = await synthesisResponse.json();
    return {
      ...synthesisData,
      analysis_type: 'edge-synthesis'
    };
  }

  extractTopicTrends(signals) {
    const topicCounts = new Map();
    const trendKeywords = ['AI', 'sustainability', 'privacy', 'security', 'innovation', 'growth'];
    
    signals.forEach(signal => {
      const text = (signal.title + ' ' + (signal.content || '')).toLowerCase();
      trendKeywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          const count = topicCounts.get(keyword) || 0;
          topicCounts.set(keyword, count + 1);
        }
      });
    });

    return Array.from(topicCounts.entries()).map(([topic, count]) => ({
      topic,
      trend: count > 3 ? 'increasing' : 'stable',
      mentions: count,
      sources: [...new Set(signals.filter(s => 
        (s.title + ' ' + (s.content || '')).toLowerCase().includes(topic.toLowerCase())
      ).map(s => s.source))]
    }));
  }

  formatForDisplay(analysisResult, collectionData) {
    // If we have MCP deep analysis, use that structure
    if (analysisResult.analysis_type === 'mcp-deep') {
      return {
        analysis: analysisResult,
        raw_count: collectionData.intelligence?.raw_signals?.length || 0
      };
    }

    // Otherwise format synthesis result for elite display
    return {
      analysis: {
        signal_analysis: this.extractSignalAnalysis(analysisResult),
        pattern_recognition: this.extractPatterns(analysisResult),
        stakeholder_impact: this.extractStakeholderImpact(analysisResult),
        strategic_implications: this.extractStrategicImplications(analysisResult),
        response_strategy: this.extractResponseStrategy(analysisResult),
        elite_insights: this.extractEliteInsights(analysisResult)
      },
      tabs: analysisResult.tabs,
      opportunities: analysisResult.opportunities,
      raw_count: collectionData.intelligence?.raw_signals?.length || 0
    };
  }

  extractSignalAnalysis(result) {
    const signals = [];
    
    if (result.tabs?.executive?.immediate_actions) {
      result.tabs.executive.immediate_actions.forEach(action => {
        signals.push({
          signal: action,
          what_happened: action,
          so_what: 'Requires strategic response',
          now_what: 'Develop action plan',
          magnitude: 'high',
          velocity: 'fast',
          credibility: 85,
          relevance: 90
        });
      });
    }

    return signals;
  }

  extractPatterns(result) {
    const patterns = [];
    
    if (result.tabs?.competitive?.competitor_actions?.length > 2) {
      patterns.push({
        type: 'competitive_acceleration',
        signals_connected: result.tabs.competitive.competitor_actions.map(a => a.action),
        insight: 'Multiple competitors moving simultaneously',
        confidence: 85,
        implications: ['Market inflection point', 'Window for differentiation closing']
      });
    }

    if (result.tabs?.market?.market_trends?.length > 0) {
      patterns.push({
        type: 'narrative_shift',
        signals_connected: result.tabs.market.market_trends.map(t => t.topic),
        insight: 'Market narrative evolving',
        confidence: 75,
        implications: ['Opportunity to lead conversation', 'Risk of being left behind']
      });
    }

    return patterns;
  }

  extractStakeholderImpact(result) {
    return {
      customers: {
        perception_shift: result.tabs?.executive?.competitive_highlight || 'Monitoring competition',
        concern_level: 'medium',
        likely_questions: ['How does this affect us?'],
        messaging_needs: ['Reassurance', 'Differentiation'],
        proof_points_required: ['Success stories', 'Roadmap']
      },
      media: {
        perception_shift: result.tabs?.media?.sentiment_trend || 'Following story',
        concern_level: 'medium',
        likely_questions: ['What\'s your response?'],
        messaging_needs: ['Clear position', 'Thought leadership'],
        proof_points_required: ['Data', 'Expert commentary']
      },
      investors: {
        perception_shift: 'Evaluating impact',
        concern_level: 'low',
        likely_questions: ['How does this affect growth?'],
        messaging_needs: ['Strategic vision', 'Financial stability'],
        proof_points_required: ['Metrics', 'Projections']
      }
    };
  }

  extractStrategicImplications(result) {
    return {
      reputation: {
        current_state: result.tabs?.executive?.headline || 'Stable',
        trajectory: 'stable',
        intervention_required: result.tabs?.executive?.immediate_actions?.length > 0 ? 'respond' : 'monitor',
        key_vulnerabilities: result.tabs?.competitive?.competitive_gaps || []
      },
      competitive_position: {
        relative_strength: 'challenger',
        momentum: 'maintaining',
        defendable_advantages: ['Market presence', 'Customer trust'],
        exposed_flanks: result.tabs?.competitive?.competitive_gaps?.map(g => g.gap) || []
      },
      market_narrative: {
        we_control: ['Our story', 'Customer success'],
        they_control: result.tabs?.competitive?.competitor_actions?.map(a => a.entity) || [],
        contested_ground: ['Market leadership', 'Innovation'],
        narrative_opportunities: result.tabs?.market?.opportunities || []
      }
    };
  }

  extractResponseStrategy(result) {
    const hasUrgentActions = result.tabs?.executive?.immediate_actions?.length > 0;
    
    return {
      immediate_24h: {
        priority: hasUrgentActions ? 'high' : 'medium',
        actions: result.tabs?.executive?.immediate_actions || ['Monitor situation'],
        messaging: result.tabs?.competitive?.key_messages || ['Stay on message'],
        channels: ['Internal', 'Social monitoring'],
        success_metrics: ['Response time', 'Message consistency']
      },
      short_term_7d: {
        priority: 'medium',
        actions: ['Develop comprehensive response', 'Media outreach'],
        messaging: result.tabs?.competitive?.pr_strategy ? [result.tabs.competitive.pr_strategy] : [],
        channels: ['Press release', 'Blog'],
        success_metrics: ['Media coverage', 'Sentiment']
      }
    };
  }

  extractEliteInsights(result) {
    const insights = {
      hidden_connections: [],
      non_obvious_risks: [],
      asymmetric_opportunities: [],
      narrative_leverage_points: [],
      strategic_blindspots: []
    };

    // Extract non-obvious insights from the data
    if (result.tabs?.competitive?.competitor_actions?.length > 3) {
      insights.hidden_connections.push('Coordinated competitive movement suggests industry shift');
    }

    if (result.tabs?.market?.market_trends?.some(t => t.trend === 'increasing')) {
      insights.asymmetric_opportunities.push('First-mover advantage on emerging trends');
    }

    if (result.tabs?.forward?.predictions?.length > 0) {
      insights.narrative_leverage_points.push(...result.tabs.forward.predictions.map(p => p.trigger));
    }

    return insights;
  }

  getEmptyAnalysis() {
    return {
      signal_analysis: [],
      pattern_recognition: [],
      stakeholder_impact: {
        customers: this.getEmptyStakeholderImpact(),
        media: this.getEmptyStakeholderImpact(),
        investors: this.getEmptyStakeholderImpact()
      },
      strategic_implications: {
        reputation: { current_state: 'Unknown', trajectory: 'stable', intervention_required: 'monitor', key_vulnerabilities: [] },
        competitive_position: { relative_strength: 'unknown', momentum: 'maintaining', defendable_advantages: [], exposed_flanks: [] },
        market_narrative: { we_control: [], they_control: [], contested_ground: [], narrative_opportunities: [] }
      },
      response_strategy: {
        immediate_24h: { priority: 'low', actions: [], messaging: [], channels: [], success_metrics: [] },
        short_term_7d: { priority: 'low', actions: [], messaging: [], channels: [], success_metrics: [] }
      },
      elite_insights: {
        hidden_connections: [],
        non_obvious_risks: [],
        asymmetric_opportunities: [],
        narrative_leverage_points: [],
        strategic_blindspots: []
      }
    };
  }

  getEmptyStakeholderImpact() {
    return {
      perception_shift: 'No data',
      concern_level: 'low',
      likely_questions: [],
      messaging_needs: [],
      proof_points_required: []
    };
  }
}

export default new IntelligenceOrchestratorV4();