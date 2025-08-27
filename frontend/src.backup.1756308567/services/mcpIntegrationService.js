// MCP Integration Service for Niv Assistant
// This service provides a unified interface to all SignalDesk MCPs

class MCPIntegrationService {
  constructor() {
    this.mcpEndpoints = {
      // Core Intelligence MCPs
      intelligence: {
        name: 'signaldesk-intelligence',
        priority: 0.9,
        tools: {
          gatherIntelligence: 'gather_intelligence',
          analyzeCompetitors: 'analyze_competitors',
          trackEmergingTopics: 'track_emerging_topics',
          monitorMarketChanges: 'monitor_market_changes'
        }
      },
      
      relationships: {
        name: 'signaldesk-relationships',
        priority: 0.7,
        tools: {
          trackJournalists: 'track_journalist_relationships',
          assessHealth: 'assess_relationship_health',
          mapInfluencers: 'map_influencer_network',
          predictInterest: 'predict_journalist_interest'
        }
      },
      
      analytics: {
        name: 'signaldesk-analytics',
        priority: 0.6,
        tools: {
          calculateValue: 'calculate_media_value',
          analyzeSentiment: 'analyze_sentiment',
          measureROI: 'measure_roi',
          benchmark: 'benchmark_performance'
        }
      },
      
      // Content & Campaign MCPs
      content: {
        name: 'signaldesk-content',
        priority: 0.5,
        tools: {
          generate: 'generate_content',
          crisisStatement: 'create_crisis_statement',
          localize: 'localize_content',
          optimize: 'optimize_messaging'
        }
      },
      
      campaigns: {
        name: 'signaldesk-campaigns',
        priority: 0.6,
        tools: {
          plan: 'plan_campaign',
          manageTasks: 'manage_tasks',
          coordinate: 'coordinate_teams',
          trackMilestones: 'track_milestones'
        }
      },
      
      media: {
        name: 'signaldesk-media',
        priority: 0.7,
        tools: {
          discover: 'discover_journalists',
          pitch: 'generate_pitch',
          trackOutreach: 'track_outreach',
          analyzeCoverage: 'analyze_coverage'
        }
      },
      
      // Enhanced MCPs
      entities: {
        name: 'signaldesk-entities',
        priority: 0.8,
        tools: {
          recognize: 'recognize_entities',
          enrich: 'enrich_entity_profile',
          trackEvolution: 'track_entity_evolution',
          findConnections: 'find_entity_connections',
          matchToOrg: 'match_entities_to_org',
          updateIntel: 'update_entity_intelligence',
          predictBehavior: 'predict_entity_behavior',
          classifyIndustry: 'classify_industry',
          mapNetwork: 'map_organization_network',
          calculateInfluence: 'calculate_influence_score'
        }
      },
      
      crisis: {
        name: 'signaldesk-crisis',
        priority: 1.0,
        tools: {
          detectSignals: 'detect_crisis_signals',
          assessSeverity: 'assess_crisis_severity',
          generateResponse: 'generate_crisis_response',
          coordinateWarRoom: 'coordinate_war_room',
          monitorEvolution: 'monitor_crisis_evolution',
          predictCascade: 'predict_crisis_cascade',
          holdingStatement: 'generate_holding_statement'
        }
      },
      
      social: {
        name: 'signaldesk-social',
        priority: 0.8,
        tools: {
          monitorSentiment: 'monitor_social_sentiment',
          detectViral: 'detect_viral_moments',
          trackInfluencers: 'track_influencer_activity',
          generateContent: 'generate_social_content',
          schedulePosts: 'schedule_social_posts',
          analyzeEngagement: 'analyze_social_engagement',
          detectCrises: 'detect_social_crises'
        }
      },
      
      stakeholderGroups: {
        name: 'signaldesk-stakeholder-groups',
        priority: 0.7,
        tools: {
          detectCoalition: 'detect_coalition_formation',
          trackEvolution: 'track_coalition_evolution',
          predictActions: 'predict_group_actions',
          analyzeInfluence: 'analyze_group_influence',
          mapNetworks: 'map_stakeholder_networks',
          identifyLeaders: 'identify_group_leaders',
          monitorMessaging: 'monitor_group_messaging'
        }
      },
      
      narratives: {
        name: 'signaldesk-narratives',
        priority: 0.8,
        tools: {
          trackEvolution: 'track_narrative_evolution',
          detectVacuum: 'detect_narrative_vacuum',
          measureStrength: 'measure_narrative_strength',
          predictSpread: 'predict_narrative_spread',
          identifyDrivers: 'identify_narrative_drivers',
          createCounter: 'create_counter_narrative',
          trackAdoption: 'track_narrative_adoption'
        }
      },
      
      regulatory: {
        name: 'signaldesk-regulatory',
        priority: 0.9,
        tools: {
          monitorChanges: 'monitor_regulatory_changes',
          predictTrends: 'predict_regulatory_trends',
          analyzeImpact: 'analyze_compliance_impact',
          trackLobbying: 'track_lobbying_activity',
          identifyAllies: 'identify_regulatory_allies',
          generateResponse: 'generate_regulatory_response',
          monitorEnforcement: 'monitor_enforcement_actions'
        }
      },
      
      orchestrator: {
        name: 'signaldesk-orchestrator',
        priority: 1.0,
        tools: {
          shareIntelligence: 'share_intelligence',
          coordinatedAnalysis: 'coordinated_analysis',
          assessUrgency: 'assess_urgency',
          coordinateResponse: 'coordinate_response',
          allocateResources: 'allocate_resources',
          escalateCritical: 'escalate_critical',
          recordOutcome: 'record_outcome',
          updatePatterns: 'update_patterns',
          improvePredictions: 'improve_predictions',
          shareLearnings: 'share_learnings'
        }
      },
      
      // Additional MCPs
      opportunities: {
        name: 'signaldesk-opportunities',
        priority: 0.8,
        tools: {
          discover: 'discover_opportunities',
          analyzeValue: 'analyze_opportunity_value',
          generatePitch: 'generate_pitch_suggestions',
          trackOutcomes: 'track_opportunity_outcomes'
        }
      },
      
      memory: {
        name: 'signaldesk-memory',
        priority: 0.5,
        tools: {
          store: 'store_context',
          retrieve: 'retrieve_context',
          update: 'update_knowledge_base',
          search: 'search_history'
        }
      },
      
      monitor: {
        name: 'signaldesk-monitor',
        priority: 0.9,
        tools: {
          stakeholders: 'monitor_stakeholders',
          detectSignals: 'detect_signals',
          generateAlerts: 'generate_alerts',
          trackCascades: 'track_cascades'
        }
      },
      
      scraper: {
        name: 'signaldesk-scraper',
        priority: 0.6,
        tools: {
          scrapeWeb: 'scrape_web',
          predictCascade: 'predict_cascade',
          monitorSources: 'monitor_sources',
          extractEntities: 'extract_entities'
        }
      }
    };
    
    // Intent mapping for automatic MCP selection
    this.intentMap = {
      crisis: ['crisis', 'emergency', 'scandal', 'urgent', 'damage'],
      media: ['journalist', 'reporter', 'media', 'press', 'pitch'],
      social: ['social media', 'twitter', 'linkedin', 'viral', 'trending'],
      regulatory: ['regulation', 'compliance', 'policy', 'legislation'],
      stakeholder: ['stakeholder', 'coalition', 'group', 'alliance'],
      intelligence: ['competitor', 'market', 'industry', 'trend'],
      campaign: ['campaign', 'project', 'timeline', 'milestone'],
      content: ['write', 'draft', 'content', 'release', 'statement']
    };
  }
  
  // Detect which MCPs are relevant for a given message
  detectRelevantMCPs(message) {
    const lowerMessage = message.toLowerCase();
    const relevantMCPs = new Set();
    
    // Check each intent category
    for (const [category, keywords] of Object.entries(this.intentMap)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          // Map category to MCPs
          switch(category) {
            case 'crisis':
              relevantMCPs.add('crisis');
              relevantMCPs.add('monitor');
              relevantMCPs.add('orchestrator');
              break;
            case 'media':
              relevantMCPs.add('media');
              relevantMCPs.add('relationships');
              break;
            case 'social':
              relevantMCPs.add('social');
              relevantMCPs.add('monitor');
              break;
            case 'regulatory':
              relevantMCPs.add('regulatory');
              relevantMCPs.add('entities');
              break;
            case 'stakeholder':
              relevantMCPs.add('stakeholderGroups');
              relevantMCPs.add('entities');
              break;
            case 'intelligence':
              relevantMCPs.add('intelligence');
              relevantMCPs.add('analytics');
              break;
            case 'campaign':
              relevantMCPs.add('campaigns');
              relevantMCPs.add('opportunities');
              break;
            case 'content':
              relevantMCPs.add('content');
              relevantMCPs.add('narratives');
              break;
          }
        }
      }
    }
    
    return Array.from(relevantMCPs);
  }
  
  // Get MCP recommendations for a specific task
  getMCPRecommendations(task) {
    const recommendations = [];
    const relevantMCPs = this.detectRelevantMCPs(task);
    
    for (const mcpKey of relevantMCPs) {
      const mcp = this.mcpEndpoints[mcpKey];
      if (mcp) {
        recommendations.push({
          mcp: mcp.name,
          priority: mcp.priority,
          tools: Object.keys(mcp.tools).map(toolKey => ({
            name: mcp.tools[toolKey],
            key: toolKey
          }))
        });
      }
    }
    
    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
  
  // Execute MCP tool (simulated - in production would make actual calls)
  async executeMCPTool(mcpKey, toolKey, params = {}) {
    const mcp = this.mcpEndpoints[mcpKey];
    if (!mcp) {
      throw new Error(`MCP ${mcpKey} not found`);
    }
    
    const tool = mcp.tools[toolKey];
    if (!tool) {
      throw new Error(`Tool ${toolKey} not found in MCP ${mcpKey}`);
    }
    
    // Log the execution
    console.log(`Executing ${mcp.name}.${tool} with params:`, params);
    
    // In production, this would make actual MCP calls
    // For now, return simulated response
    return {
      mcp: mcp.name,
      tool: tool,
      params: params,
      result: {
        status: 'success',
        data: this.getSimulatedResponse(mcpKey, toolKey, params)
      },
      timestamp: new Date().toISOString()
    };
  }
  
  // Orchestrate multiple MCP calls
  async orchestrateMCPCalls(task) {
    const recommendations = this.getMCPRecommendations(task);
    const results = [];
    
    // For crisis situations, use orchestrator
    if (task.toLowerCase().includes('crisis')) {
      const urgencyResult = await this.executeMCPTool('orchestrator', 'assessUrgency', { signal: task });
      results.push(urgencyResult);
      
      if (urgencyResult.result.data.urgency === 'critical') {
        const responseResult = await this.executeMCPTool('orchestrator', 'coordinateResponse', {
          situation: task,
          urgency: 'critical'
        });
        results.push(responseResult);
      }
    }
    
    // Execute relevant MCP tools
    for (const recommendation of recommendations.slice(0, 3)) { // Limit to top 3
      const mcpKey = Object.keys(this.mcpEndpoints).find(
        key => this.mcpEndpoints[key].name === recommendation.mcp
      );
      
      if (mcpKey && recommendation.tools.length > 0) {
        const result = await this.executeMCPTool(
          mcpKey,
          recommendation.tools[0].key,
          { context: task }
        );
        results.push(result);
      }
    }
    
    return results;
  }
  
  // Get simulated response for demo purposes
  getSimulatedResponse(mcpKey, toolKey, params) {
    const responses = {
      crisis: {
        detectSignals: { detected: false, riskLevel: 'low' },
        assessSeverity: { severity: 'medium', urgency: 'high' },
        generateResponse: { plan: 'Immediate response plan generated' }
      },
      media: {
        discover: { journalists: ['John Doe - TechCrunch', 'Jane Smith - WSJ'] },
        pitch: { pitch: 'Personalized pitch generated' }
      },
      intelligence: {
        gatherIntelligence: { insights: 'Market trending positive' },
        analyzeCompetitors: { competitors: ['Comp A', 'Comp B'] }
      }
    };
    
    return responses[mcpKey]?.[toolKey] || { status: 'completed' };
  }
  
  // Get MCP status
  getMCPStatus() {
    return Object.entries(this.mcpEndpoints).map(([key, mcp]) => ({
      key,
      name: mcp.name,
      priority: mcp.priority,
      toolCount: Object.keys(mcp.tools).length,
      status: 'active'
    }));
  }
  
  // Get tool documentation
  getToolDocumentation(mcpKey, toolKey) {
    const mcp = this.mcpEndpoints[mcpKey];
    if (!mcp) return null;
    
    const tool = mcp.tools[toolKey];
    if (!tool) return null;
    
    return {
      mcp: mcp.name,
      tool: tool,
      description: this.getToolDescription(mcpKey, toolKey),
      parameters: this.getToolParameters(mcpKey, toolKey)
    };
  }
  
  // Get tool description
  getToolDescription(mcpKey, toolKey) {
    const descriptions = {
      crisis: {
        detectSignals: 'Detect early warning signals of potential crises',
        assessSeverity: 'Evaluate the severity and urgency of a crisis',
        generateResponse: 'Generate comprehensive crisis response plan'
      },
      media: {
        discover: 'Find relevant journalists for your story',
        pitch: 'Generate personalized media pitches'
      }
    };
    
    return descriptions[mcpKey]?.[toolKey] || 'Tool for ' + toolKey;
  }
  
  // Get tool parameters
  getToolParameters(mcpKey, toolKey) {
    const parameters = {
      crisis: {
        detectSignals: ['context', 'sources', 'timeframe'],
        assessSeverity: ['situation', 'stakeholders', 'impact'],
        generateResponse: ['severity', 'audience', 'channels']
      },
      media: {
        discover: ['topic', 'publication', 'beat'],
        pitch: ['journalist', 'story', 'angle']
      }
    };
    
    return parameters[mcpKey]?.[toolKey] || ['context'];
  }
}

// Export singleton instance
const mcpService = new MCPIntegrationService();
export default mcpService;