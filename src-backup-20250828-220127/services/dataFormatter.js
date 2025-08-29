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
    console.log('📥 Raw orchestrator response:', {
      hasIntelligence: !!orchestratorResponse.intelligence,
      intelligenceKeys: Object.keys(orchestratorResponse.intelligence || {}),
      hasSynthesized: !!orchestratorResponse.intelligence?.synthesized,
      synthesizedKeys: Object.keys(orchestratorResponse.intelligence?.synthesized || {})
    });
    
    const intelligence = orchestratorResponse.intelligence || {};
    const stats = orchestratorResponse.statistics || {};
    
    // Check if we have V6 PR impact structure, V5 analytical structure, or tabs
    const hasV6Keys = intelligence.synthesized && (
      'narrative_landscape' in intelligence.synthesized ||
      'competitive_dynamics' in intelligence.synthesized ||
      'stakeholder_sentiment' in intelligence.synthesized ||
      'media_momentum' in intelligence.synthesized ||
      'strategic_signals' in intelligence.synthesized
    );
    
    const isV6Structure = hasV6Keys;
    
    // Check V5 structure - entity-focused analytical structure
    const hasV5InSynthesized = intelligence.synthesized && (
      intelligence.synthesized.market_activity || 
      intelligence.synthesized.competitor_intelligence ||
      intelligence.synthesized.social_pulse ||
      intelligence.synthesized.industry_signals ||
      intelligence.synthesized.media_coverage
    );
    
    const hasV5InTabs = intelligence.tabs && (
      intelligence.tabs.market_activity ||
      intelligence.tabs.competitor_intelligence ||
      intelligence.tabs.social_pulse ||
      intelligence.tabs.industry_signals ||
      intelligence.tabs.media_coverage
    );
    
    const isV5Structure = !isV6Structure && !!(hasV5InSynthesized || hasV5InTabs);
    
    console.log('🔍 Data structure detection:', { 
      isV6Structure,
      isV5Structure,
      hasV6Keys,
      hasV5InSynthesized,
      hasV5InTabs,
      hasSynthesized: !!intelligence.synthesized,
      synthesizedKeys: intelligence.synthesized ? Object.keys(intelligence.synthesized) : [],
      tabKeys: intelligence.tabs ? Object.keys(intelligence.tabs) : [],
      hasV6Narrative: !!intelligence.synthesized?.narrative_landscape,
      hasV5Markets: !!intelligence.synthesized?.market_activity,
      intelligenceKeys: Object.keys(intelligence),
      synthesizedSample: intelligence.synthesized ? JSON.stringify(Object.keys(intelligence.synthesized).slice(0, 3)) : 'none'
    });
    
    // Build properly formatted tabs
    console.log('🎯 Tab selection:', {
      willUseV6: isV6Structure,
      willUseV5: isV5Structure,
      willUseLegacy: !isV6Structure && !isV5Structure
    });
    
    const formattedData = {
      // CRITICAL: Include success field so claudeIntelligenceServiceV2 uses this data
      success: true,
      
      // Tab format for display component - V6 PR Impact or V5 Analytical Structure
      tabs: isV6Structure ? {
        narrative_landscape: this.formatNarrativeLandscapeTab(intelligence),
        competitive_dynamics: this.formatCompetitiveDynamicsTab(intelligence),
        stakeholder_sentiment: this.formatStakeholderSentimentTab(intelligence),
        media_momentum: this.formatMediaMomentumTab(intelligence),
        strategic_signals: this.formatStrategicSignalsTab(intelligence)
      } : isV5Structure ? {
        market_activity: this.formatMarketActivityTab(intelligence),
        competitor_intelligence: this.formatCompetitorIntelTab(intelligence),
        social_pulse: this.formatSocialPulseTab(intelligence),
        industry_signals: this.formatIndustrySignalsTab(intelligence),
        media_coverage: this.formatMediaCoverageTab(intelligence)
      } : {
        // Fallback to legacy format for backward compatibility
        overview: this.formatOverviewTab(intelligence),
        competition: this.formatCompetitionTab(intelligence),
        stakeholders: this.formatStakeholdersTab(intelligence),
        topics: this.formatTopicsTab(intelligence),
        predictions: this.formatPredictionsTab(intelligence)
      },
      
      // Keep legacy top-level tabs for backward compatibility
      overview: this.formatOverviewTab(intelligence),
      competition: this.formatCompetitionTab(intelligence),
      stakeholders: this.formatStakeholdersTab(intelligence),
      topics: this.formatTopicsTab(intelligence),
      predictions: this.formatPredictionsTab(intelligence),
      
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
      tabCount: Object.keys(formattedData.tabs).length,
      isV5Structure,
      isV6Structure,
      actualTabsReturned: Object.keys(formattedData.tabs)
    });
    
    return formattedData;
  }
  
  formatOverviewTab(intelligence) {
    // Extract PR strategy summary from synthesis
    let executiveSummaryText = '';
    
    // Check if we have V4 analytical synthesis
    if (intelligence.synthesized?.overview?.data_summary) {
      executiveSummaryText = intelligence.synthesized.overview.data_summary;
    } else if (intelligence.synthesized?.executive_summary) {
      executiveSummaryText = intelligence.synthesized.executive_summary;
    } else if (typeof intelligence.executive_summary === 'string') {
      executiveSummaryText = intelligence.executive_summary;
    } else {
      executiveSummaryText = 'Intelligence analysis in progress.';
    }
    
    return {
      executive_summary: executiveSummaryText,
      key_insights: this.extractArray(
        intelligence.synthesized?.overview?.key_developments || 
        intelligence.synthesized?.key_insights || 
        intelligence.key_insights
      ),
      critical_alerts: this.extractArray(
        intelligence.synthesized?.overview?.notable_patterns || 
        intelligence.synthesized?.critical_alerts || 
        intelligence.critical_alerts
      ),
      recommended_actions: this.extractArray(
        intelligence.synthesized?.overview?.data_gaps || 
        [] // V4 doesn't make recommendations
      ),
      // Add second opinion if available
      alternative_perspective: intelligence.synthesized?.divergent_views?.[0] || null
    };
  }
  
  formatCompetitionTab(intelligence) {
    // Extract V4 competitive analysis from synthesis
    const competitiveData = intelligence.synthesized?.competition || intelligence.synthesized?.competitive_analysis || {};
    
    // Build competitor profiles
    const competitorProfiles = {};
    if (intelligence.competitors && Array.isArray(intelligence.competitors)) {
      intelligence.competitors.forEach(comp => {
        const name = typeof comp === 'string' ? comp : comp.name;
        if (name) {
          competitorProfiles[name] = {
            threat_level: comp.threat_level || 'medium',
            market_position: comp.market_position || { position: 'competitive' },
            latest_developments: comp.developments || competitiveData.competitor_activity || competitiveData.competitor_moves || [],
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
  
  // V5 Analytical Tab Formatters
  formatMarketActivityTab(intelligence) {
    const marketData = intelligence.synthesized?.market_activity || 
                      intelligence.tabs?.market_activity || {};
    return {
      summary: marketData.summary || 'No market activity data available',
      statistics: marketData.statistics || {
        total_articles: 0,
        sources: 0,
        time_range: 'N/A'
      },
      key_findings: marketData.key_findings || []
    };
  }

  formatCompetitorIntelTab(intelligence) {
    const competitorData = intelligence.synthesized?.competitor_intelligence || {};
    return {
      summary: competitorData.summary || 'No competitor intelligence available',
      competitors_tracked: competitorData.competitors_tracked || [],
      total_actions: competitorData.total_actions || 0,
      movements: competitorData.movements || []
    };
  }

  formatSocialPulseTab(intelligence) {
    const socialData = intelligence.synthesized?.social_pulse || {};
    return {
      summary: socialData.summary || 'No social media data available',
      sentiment_breakdown: socialData.sentiment_breakdown || {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      total_posts: socialData.total_posts || 0,
      trending_topics: socialData.trending_topics || [],
      key_discussions: socialData.key_discussions || []
    };
  }

  formatIndustrySignalsTab(intelligence) {
    const industryData = intelligence.synthesized?.industry_signals || {};
    return {
      summary: industryData.summary || 'No industry signals detected',
      indicators: industryData.indicators || [],
      hiring_activity: industryData.hiring_activity || {
        total_postings: 0,
        growth_rate: 'N/A'
      }
    };
  }

  formatMediaCoverageTab(intelligence) {
    const mediaData = intelligence.synthesized?.media_coverage || {};
    return {
      summary: mediaData.summary || 'No media coverage data available',
      coverage_volume: mediaData.coverage_volume || 0,
      source_count: mediaData.source_count || 0,
      sentiment_trend: mediaData.sentiment_trend || 'neutral',
      top_narratives: mediaData.top_narratives || []
    };
  }

  // V6 PR Impact Tab Formatters
  formatNarrativeLandscapeTab(intelligence) {
    const narrativeData = intelligence.synthesized?.narrative_landscape || {};
    return {
      current_position: narrativeData.current_position || 'Analyzing narrative position',
      narrative_control: narrativeData.narrative_control || 'contested',
      attention_flow: narrativeData.attention_flow || 'neutral',
      key_developments: narrativeData.key_developments || []
    };
  }

  formatCompetitiveDynamicsTab(intelligence) {
    const competitiveData = intelligence.synthesized?.competitive_dynamics || {};
    return {
      pr_positioning: competitiveData.pr_positioning || 'Analyzing competitive PR landscape',
      narrative_threats: competitiveData.narrative_threats || [],
      narrative_opportunities: competitiveData.narrative_opportunities || []
    };
  }

  formatStakeholderSentimentTab(intelligence) {
    const sentimentData = intelligence.synthesized?.stakeholder_sentiment || {};
    return {
      overall_trajectory: sentimentData.overall_trajectory || 'stable',
      pr_implications: sentimentData.pr_implications || 'Monitoring stakeholder sentiment',
      sentiment_drivers: sentimentData.sentiment_drivers || []
    };
  }

  formatMediaMomentumTab(intelligence) {
    const mediaData = intelligence.synthesized?.media_momentum || {};
    return {
      coverage_trajectory: mediaData.coverage_trajectory || 'stable',
      narrative_alignment: mediaData.narrative_alignment || 'mixed',
      pr_leverage_points: mediaData.pr_leverage_points || []
    };
  }

  formatStrategicSignalsTab(intelligence) {
    const signalsData = intelligence.synthesized?.strategic_signals || {};
    return {
      regulatory_implications: signalsData.regulatory_implications || 'Monitoring regulatory environment',
      industry_narrative_shifts: signalsData.industry_narrative_shifts || [],
      pr_action_triggers: signalsData.pr_action_triggers || []
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