/**
 * Data Formatter Service
 * Single source of truth for formatting intelligence data for display
 */

class DataFormatterService {
  /**
   * Format orchestrator response for display
   * This is the ONLY place where data should be transformed
   */
  formatForDisplay(orchestratorResponse) {
    console.log('🎨 Formatting orchestrator response for display');
    
    const intelligence = orchestratorResponse.intelligence || {};
    const stats = orchestratorResponse.statistics || {};
    
    // Build properly formatted tabs
    const formattedData = {
      // CRITICAL: Include success field so claudeIntelligenceServiceV2 uses this data
      success: true,
      
      // Overview Tab - MUST have these exact fields
      overview: this.formatOverviewTab(intelligence),
      
      // Competition Tab
      competition: this.formatCompetitionTab(intelligence),
      
      // Stakeholders Tab
      stakeholders: this.formatStakeholdersTab(intelligence),
      
      // Topics Tab
      topics: this.formatTopicsTab(intelligence),
      
      // Predictions Tab
      predictions: this.formatPredictionsTab(intelligence),
      
      // Tab format for display component
      tabs: {
        overview: this.formatOverviewTab(intelligence),
        competition: this.formatCompetitionTab(intelligence),
        stakeholders: this.formatStakeholdersTab(intelligence),
        topics: this.formatTopicsTab(intelligence),
        predictions: this.formatPredictionsTab(intelligence)
      },
      
      // Keep stats for reference
      stats: {
        competitors: intelligence.competitors?.length || 0,
        articles: stats.articles_processed || 0,
        websites: stats.websites_scraped || 0,
        sources: stats.sources_used || 0,
        insights_stored: intelligence.key_insights?.length || 0
      },
      
      // Keep raw data for debugging
      raw: orchestratorResponse
    };
    
    console.log('✅ Formatted data structure:', {
      success: formattedData.success,
      hasOverview: !!formattedData.overview,
      overviewHasExecutiveSummary: !!formattedData.overview.executive_summary,
      executiveSummaryType: typeof formattedData.overview.executive_summary,
      tabKeys: Object.keys(formattedData.tabs),
      tabCount: Object.keys(formattedData.tabs).length
    });
    
    return formattedData;
  }
  
  formatOverviewTab(intelligence) {
    // Extract PR strategy summary from synthesis
    let executiveSummaryText = '';
    
    // Check if we have rich synthesized analysis
    if (intelligence.synthesized?.pr_strategy_summary) {
      executiveSummaryText = intelligence.synthesized.pr_strategy_summary;
    } else if (intelligence.synthesized?.executive_summary) {
      executiveSummaryText = intelligence.synthesized.executive_summary;
    } else if (typeof intelligence.executive_summary === 'string') {
      executiveSummaryText = intelligence.executive_summary;
    } else {
      executiveSummaryText = 'Executive PR intelligence analysis in progress. Synthesizing insights from competitive landscape, stakeholder sentiment, media narratives, and predictive scenarios.';
    }
    
    return {
      executive_summary: executiveSummaryText,
      key_insights: this.extractArray(
        intelligence.synthesized?.key_insights || 
        intelligence.key_insights
      ),
      critical_alerts: this.extractArray(
        intelligence.synthesized?.critical_alerts || 
        intelligence.alerts || 
        intelligence.critical_alerts
      ),
      recommended_actions: this.extractArray(
        intelligence.synthesized?.recommendations || 
        intelligence.recommendations
      ),
      // Add second opinion if available
      alternative_perspective: intelligence.synthesized?.divergent_views?.[0] || null
    };
  }
  
  formatCompetitionTab(intelligence) {
    // Extract rich competitive analysis from synthesis
    const competitiveData = intelligence.synthesized?.competitive_analysis || {};
    
    // Build competitor profiles
    const competitorProfiles = {};
    if (intelligence.competitors && Array.isArray(intelligence.competitors)) {
      intelligence.competitors.forEach(comp => {
        const name = typeof comp === 'string' ? comp : comp.name;
        if (name) {
          competitorProfiles[name] = {
            threat_level: comp.threat_level || 'medium',
            market_position: comp.market_position || { position: 'competitive' },
            latest_developments: comp.developments || competitiveData.competitor_moves || [],
            opportunities: comp.opportunities || []
          };
        }
      });
    }
    
    return {
      competitive_landscape: {
        summary: competitiveData.landscape_summary || 
                 intelligence.competitive_landscape_summary || 
                 'Analyzing competitive dynamics and PR positioning opportunities',
        competitor_profiles: competitorProfiles,
        opportunities: this.extractArray(
          competitiveData.positioning_opportunities || 
          intelligence.competitive_opportunities
        ),
        threats: this.extractArray(competitiveData.reputation_threats),
        second_opinion: competitiveData.second_opinion
      }
    };
  }
  
  formatStakeholdersTab(intelligence) {
    const stakeholderData = intelligence.synthesized?.stakeholder_analysis || {};
    const defaultGroups = ['investors', 'customers', 'employees', 'media', 'regulators'];
    
    return {
      sentiment_overview: stakeholderData.sentiment_overview || 
                         'Analyzing stakeholder sentiment and engagement priorities',
      groups: intelligence.stakeholder_groups || defaultGroups,
      group_priorities: stakeholderData.group_priorities || {},
      sentiment: stakeholderData.sentiment || intelligence.stakeholder_sentiment || {},
      concerns: this.extractArray(
        stakeholderData.concerns || 
        intelligence.stakeholder_concerns || 
        intelligence.alerts
      ),
      engagement_strategy: this.extractArray(stakeholderData.engagement_strategy),
      messaging_frameworks: stakeholderData.messaging_frameworks || {},
      second_opinion: stakeholderData.second_opinion
    };
  }
  
  formatTopicsTab(intelligence) {
    const narrativeData = intelligence.synthesized?.narrative_analysis || {};
    
    return {
      trending_overview: narrativeData.trending_overview || 
                        'Analyzing media narratives and content opportunities',
      trending_topics: this.extractArray(
        intelligence.industry_trends || 
        intelligence.trending_topics
      ),
      media_coverage: this.extractArray(
        intelligence.breaking_news || 
        intelligence.media_coverage
      ),
      narrative_opportunities: this.extractArray(narrativeData.narrative_opportunities),
      content_angles: this.extractArray(narrativeData.content_angles),
      media_risks: this.extractArray(narrativeData.media_risks),
      sentiment_analysis: intelligence.sentiment_analysis || {},
      key_narratives: this.extractArray(
        intelligence.discussions || 
        intelligence.key_narratives
      ),
      second_opinion: narrativeData.second_opinion
    };
  }
  
  formatPredictionsTab(intelligence) {
    const predictiveData = intelligence.synthesized?.predictive_analysis || {};
    
    return {
      scenario_overview: predictiveData.scenario_overview || 
                        'Analyzing future scenarios and cascade effects',
      likely_scenarios: this.extractArray(
        predictiveData.likely_scenarios || 
        intelligence.predicted_scenarios
      ),
      cascade_effects: this.extractArray(predictiveData.cascade_effects),
      proactive_strategies: this.extractArray(predictiveData.proactive_strategies),
      trends: this.extractArray(
        intelligence.industry_trends || 
        intelligence.emerging_trends
      ),
      timeline: this.extractArray(intelligence.timeline),
      confidence: intelligence.confidence_levels || {},
      second_opinion: predictiveData.second_opinion
    };
  }
  
  /**
   * Helper to extract and clean arrays
   */
  extractArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return [data];
    return [];
  }
}

// Export singleton
const dataFormatterService = new DataFormatterService();
export default dataFormatterService;