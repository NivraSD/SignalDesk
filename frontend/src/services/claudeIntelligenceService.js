// Claude Intelligence Service
// Orchestrates MCPs and synthesizes insights aligned with organization goals

class ClaudeIntelligenceService {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
  }

  async gatherAndAnalyze(config, timeframe = '24h') {
    const organization = config.organization || {};
    const goals = config.goals || {};
    
    console.log('🎯 Gathering intelligence for goals:', Object.entries(goals).filter(([k,v]) => v).map(([k]) => k));
    
    // Step 1: Gather raw data from MCPs
    const mcpData = await this.orchestrateMCPs(organization, timeframe);
    
    // Step 2: Send to Claude for goal-aligned synthesis
    const synthesizedIntelligence = await this.synthesizeWithClaude(mcpData, organization, goals, timeframe);
    
    return synthesizedIntelligence;
  }

  async orchestrateMCPs(organization, timeframe) {
    console.log('📊 Orchestrating MCPs for', organization.name);
    
    // Call multiple MCPs in parallel for comprehensive data gathering
    const mcpCalls = [
      this.callMCP('pr', 'gather', { organization }), // Competitor intelligence
      this.callMCP('news', 'gather', { organization }), // News and trends
      this.callMCP('media', 'discover', { organization }), // Media coverage
      this.callMCP('opportunities', 'discover', { organization }), // Opportunities
      this.callMCP('analytics', 'analyze', { organization }), // Analytics
      this.callMCP('relationships', 'assess', { organization }), // Stakeholder relationships
      this.callMCP('monitor', 'check', { organization }), // Monitoring and alerts
    ];

    const results = await Promise.allSettled(mcpCalls);
    
    // Organize results by type
    const mcpData = {
      competitive: results[0].status === 'fulfilled' ? results[0].value : null,
      news: results[1].status === 'fulfilled' ? results[1].value : null,
      media: results[2].status === 'fulfilled' ? results[2].value : null,
      opportunities: results[3].status === 'fulfilled' ? results[3].value : null,
      analytics: results[4].status === 'fulfilled' ? results[4].value : null,
      stakeholder: results[5].status === 'fulfilled' ? results[5].value : null,
      monitoring: results[6].status === 'fulfilled' ? results[6].value : null,
    };

    console.log('✅ MCP data gathered:', Object.keys(mcpData).filter(k => mcpData[k]).join(', '));
    
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

  async synthesizeWithClaude(mcpData, organization, goals, timeframe) {
    console.log('🧠 Synthesizing with Claude for goal-aligned insights');
    
    try {
      // Call different synthesis types in parallel
      const synthesisPromises = [
        this.callClaudeSynthesizer('competitor', mcpData.competitive, organization, goals, timeframe),
        this.callClaudeSynthesizer('stakeholder', {
          relationships: mcpData.stakeholder,
          media: mcpData.media
        }, organization, goals, timeframe),
        this.callClaudeSynthesizer('narrative', {
          news: mcpData.news,
          media: mcpData.media,
          analytics: mcpData.analytics
        }, organization, goals, timeframe),
        this.callClaudeSynthesizer('predictive', mcpData, organization, goals, timeframe),
      ];

      const results = await Promise.allSettled(synthesisPromises);
      
      // Get executive summary based on all analyses
      const allAnalyses = {
        competitor: results[0].status === 'fulfilled' ? results[0].value : null,
        stakeholder: results[1].status === 'fulfilled' ? results[1].value : null,
        narrative: results[2].status === 'fulfilled' ? results[2].value : null,
        predictive: results[3].status === 'fulfilled' ? results[3].value : null,
      };

      const executiveSummary = await this.callClaudeSynthesizer(
        'executive_summary', 
        allAnalyses, 
        organization, 
        goals, 
        timeframe
      );

      return {
        ...allAnalyses,
        executive_summary: executiveSummary,
        raw_mcp_data: mcpData, // Keep raw data for reference
        analysis_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Claude synthesis failed:', error);
      
      // Fallback to structured MCP data if Claude fails
      return {
        competitor: this.extractCompetitorInsights(mcpData),
        stakeholder: this.extractStakeholderInsights(mcpData),
        narrative: this.extractNarrativeInsights(mcpData),
        predictive: this.extractPredictiveInsights(mcpData),
        executive_summary: {
          key_insight: "Analysis in progress",
          immediate_priorities: ["Gather more data", "Monitor competitors", "Engage stakeholders"]
        },
        raw_mcp_data: mcpData
      };
    }
  }

  async callClaudeSynthesizer(intelligenceType, mcpData, organization, goals, timeframe) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-intelligence-synthesizer`, {
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
          timeframe
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          return data.analysis;
        }
      }
      return null;
    } catch (error) {
      console.error(`Claude synthesis for ${intelligenceType} failed:`, error);
      return null;
    }
  }

  // Fallback methods to extract insights if Claude is unavailable
  extractCompetitorInsights(mcpData) {
    const insights = {
      key_movements: [],
      strategic_patterns: [],
      recommended_actions: [],
      competitive_advantage: "Analysis pending",
      priority_focus: "Monitor competitor activity"
    };

    if (mcpData.competitive?.insights) {
      insights.key_movements = mcpData.competitive.insights.slice(0, 3).map(i => ({
        competitor: i.title,
        action: i.insight,
        impact_on_goals: "Medium",
        threat_level: i.relevance === 'high' ? 'High' : 'Medium',
        opportunity: i.suggestedAction
      }));
    }

    return insights;
  }

  extractStakeholderInsights(mcpData) {
    const insights = {
      stakeholder_map: [],
      coalition_opportunities: [],
      risk_stakeholders: [],
      engagement_strategies: [],
      immediate_actions: []
    };

    if (mcpData.stakeholder || mcpData.media) {
      // Extract stakeholder data
      const stakeholders = [];
      
      if (mcpData.media?.journalists) {
        stakeholders.push({
          group: 'Media',
          sentiment: 'neutral',
          influence_level: 'High',
          goal_alignment: 'Medium',
          engagement_priority: 'High'
        });
      }

      insights.stakeholder_map = stakeholders;
    }

    return insights;
  }

  extractNarrativeInsights(mcpData) {
    const insights = {
      goal_narrative_alignment: {},
      whitespace_opportunities: [],
      messaging_recommendations: [],
      emerging_narratives: [],
      narrative_strategy: "Build consistent messaging"
    };

    if (mcpData.news?.trends) {
      insights.emerging_narratives = mcpData.news.trends.slice(0, 3).map(t => ({
        topic: t.topic,
        relevance: "High",
        action: "Monitor and engage"
      }));
    }

    return insights;
  }

  extractPredictiveInsights(mcpData) {
    const insights = {
      goal_impact_forecast: {},
      predicted_competitor_moves: [],
      cascade_risks: [],
      goal_vulnerabilities: [],
      proactive_recommendations: []
    };

    if (mcpData.monitoring?.alerts) {
      insights.cascade_risks = mcpData.monitoring.alerts.slice(0, 2).map(a => ({
        trigger: a.title,
        risk: a.insight,
        mitigation: a.suggestedAction
      }));
    }

    return insights;
  }
}

export default new ClaudeIntelligenceService();