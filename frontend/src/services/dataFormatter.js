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
      hasOverview: !!formattedData.overview,
      overviewHasExecutiveSummary: !!formattedData.overview.executive_summary,
      executiveSummaryType: typeof formattedData.overview.executive_summary,
      tabKeys: Object.keys(formattedData.tabs)
    });
    
    return formattedData;
  }
  
  formatOverviewTab(intelligence) {
    // Extract executive summary - MUST be a string
    let executiveSummaryText = '';
    
    if (typeof intelligence.executive_summary === 'string') {
      executiveSummaryText = intelligence.executive_summary;
    } else if (intelligence.executive_summary?.summary) {
      executiveSummaryText = intelligence.executive_summary.summary;
    } else if (intelligence.executive_summary?.analysis) {
      executiveSummaryText = intelligence.executive_summary.analysis;
    } else if (intelligence.synthesized?.executive_summary) {
      executiveSummaryText = typeof intelligence.synthesized.executive_summary === 'string'
        ? intelligence.synthesized.executive_summary
        : intelligence.synthesized.executive_summary?.analysis || '';
    } else {
      executiveSummaryText = 'Executive intelligence analysis in progress. Data is being synthesized from multiple sources.';
    }
    
    return {
      executive_summary: executiveSummaryText,
      key_insights: this.extractArray(intelligence.key_insights),
      critical_alerts: this.extractArray(intelligence.alerts || intelligence.critical_alerts),
      recommended_actions: this.extractArray(
        intelligence.recommendations || 
        intelligence.recommended_actions || 
        intelligence.immediate_opportunities
      )
    };
  }
  
  formatCompetitionTab(intelligence) {
    // Build competitor profiles from various sources
    const competitorProfiles = {};
    
    if (intelligence.competitors && Array.isArray(intelligence.competitors)) {
      intelligence.competitors.forEach(comp => {
        const name = typeof comp === 'string' ? comp : comp.name;
        if (name) {
          competitorProfiles[name] = {
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
                 intelligence.industry_context || 
                 'Competitive landscape analysis in progress',
        competitor_profiles: competitorProfiles,
        opportunities: this.extractArray(intelligence.competitive_opportunities)
      }
    };
  }
  
  formatStakeholdersTab(intelligence) {
    const defaultGroups = ['investors', 'customers', 'employees', 'media', 'regulators'];
    
    return {
      groups: intelligence.stakeholder_groups || defaultGroups,
      sentiment: intelligence.stakeholder_sentiment || {},
      concerns: this.extractArray(intelligence.stakeholder_concerns || intelligence.alerts),
      communications: this.extractArray(intelligence.stakeholder_communications)
    };
  }
  
  formatTopicsTab(intelligence) {
    return {
      trending_topics: this.extractArray(intelligence.industry_trends || intelligence.trending_topics),
      media_coverage: this.extractArray(intelligence.breaking_news || intelligence.media_coverage),
      sentiment_analysis: intelligence.sentiment_analysis || {},
      key_narratives: this.extractArray(intelligence.discussions || intelligence.key_narratives)
    };
  }
  
  formatPredictionsTab(intelligence) {
    return {
      trends: this.extractArray(intelligence.industry_trends || intelligence.emerging_trends),
      scenarios: this.extractArray(intelligence.predicted_scenarios),
      timeline: this.extractArray(intelligence.timeline),
      confidence: intelligence.confidence_levels || {}
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