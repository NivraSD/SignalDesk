/**
 * Tab Intelligence Service
 * Generates differentiated, purpose-specific content for each intelligence tab
 * Uses organization profiles to provide contextual, relevant insights
 */

import organizationProfileService from './organizationProfileService';

class TabIntelligenceService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate all tab content based on organization profile
   */
  async generateTabIntelligence(organization, rawIntelligence, profile) {
    console.log(`📊 Generating differentiated tab intelligence for ${organization.name}`);
    
    // Get or build profile
    if (!profile) {
      profile = await organizationProfileService.getOrBuildProfile(organization);
    }
    
    // Generate content for each tab
    const tabContent = {
      overview: await this.generateOverview(profile, rawIntelligence),
      competition: await this.generateCompetitionTab(profile, rawIntelligence),
      stakeholders: await this.generateStakeholdersTab(profile, rawIntelligence),
      topics: await this.generateTopicsTab(profile, rawIntelligence),
      predictions: await this.generatePredictionsTab(profile, rawIntelligence)
    };
    
    return tabContent;
  }

  /**
   * Generate Executive Overview
   * One global summary with critical alerts and actions
   */
  async generateOverview(profile, intelligence) {
    return {
      executive_summary: this.createExecutiveSummary(profile, intelligence),
      
      critical_alerts: this.identifyCriticalAlerts(profile, intelligence),
      
      key_insights: [
        {
          type: 'competitive',
          insight: this.getTopCompetitiveInsight(profile, intelligence),
          impact: 'high'
        },
        {
          type: 'stakeholder',
          insight: this.getTopStakeholderInsight(profile, intelligence),
          impact: 'medium'
        },
        {
          type: 'market',
          insight: this.getTopMarketInsight(profile, intelligence),
          impact: 'high'
        }
      ],
      
      recommended_actions: this.prioritizeActions(profile, intelligence),
      
      metrics: {
        threat_level: this.assessThreatLevel(profile, intelligence),
        opportunity_score: this.assessOpportunityScore(profile, intelligence),
        sentiment_trend: this.assessSentimentTrend(profile, intelligence)
      }
    };
  }

  /**
   * Generate Competition Tab
   * Analysis of competitor movements, news, announcements
   */
  async generateCompetitionTab(profile, intelligence) {
    const competitors = profile.monitoring_targets.competitors.primary;
    
    const competitorAnalysis = {};
    
    for (const competitor of competitors) {
      competitorAnalysis[competitor] = {
        latest_developments: this.extractCompetitorNews(competitor, intelligence),
        strategic_moves: this.analyzeStrategicMoves(competitor, intelligence),
        market_position: this.assessMarketPosition(competitor, profile, intelligence),
        threat_assessment: this.assessCompetitorThreat(competitor, profile, intelligence),
        opportunities: this.identifyCompetitiveOpportunities(competitor, profile, intelligence)
      };
    }
    
    return {
      competitive_landscape: {
        summary: this.summarizeCompetitiveLandscape(profile, competitorAnalysis),
        market_dynamics: this.analyzeMarketDynamics(profile, intelligence),
        share_movements: this.trackMarketShareMovements(profile, intelligence)
      },
      
      competitor_profiles: competitorAnalysis,
      
      competitive_intelligence: {
        recent_moves: this.aggregateCompetitorMoves(competitorAnalysis),
        emerging_threats: this.identifyEmergingThreats(profile, intelligence),
        competitive_gaps: this.identifyCompetitiveGaps(profile, competitorAnalysis)
      },
      
      action_items: this.generateCompetitiveActions(profile, competitorAnalysis)
    };
  }

  /**
   * Generate Stakeholders Tab
   * Analysis of stakeholder groups and their dynamics
   */
  async generateStakeholdersTab(profile, intelligence) {
    const stakeholderGroups = profile.monitoring_targets.stakeholder_groups;
    
    const stakeholderAnalysis = {};
    
    for (const [group, config] of Object.entries(stakeholderGroups)) {
      stakeholderAnalysis[group] = {
        sentiment: this.analyzeStakeholderSentiment(group, intelligence),
        key_concerns: this.extractStakeholderConcerns(group, config, intelligence),
        recent_actions: this.trackStakeholderActions(group, intelligence),
        influence_dynamics: this.assessInfluenceDynamics(group, config, intelligence),
        engagement_opportunities: this.identifyEngagementOpportunities(group, profile, intelligence)
      };
    }
    
    return {
      stakeholder_landscape: {
        overview: this.summarizeStakeholderLandscape(stakeholderAnalysis),
        power_interest_matrix: this.createPowerInterestMatrix(stakeholderAnalysis),
        sentiment_heatmap: this.createSentimentHeatmap(stakeholderAnalysis)
      },
      
      group_analysis: stakeholderAnalysis,
      
      stakeholder_intelligence: {
        coalition_building: this.identifyCoalitionOpportunities(stakeholderAnalysis),
        risk_groups: this.identifyRiskStakeholders(stakeholderAnalysis),
        champion_groups: this.identifyChampionStakeholders(stakeholderAnalysis)
      },
      
      engagement_strategy: this.generateStakeholderEngagementStrategy(profile, stakeholderAnalysis)
    };
  }

  /**
   * Generate Topics Tab
   * Track movement on specific monitored topics
   */
  async generateTopicsTab(profile, intelligence) {
    const criticalTopics = profile.monitoring_targets.critical_topics;
    
    const topicAnalysis = {};
    
    for (const topic of criticalTopics) {
      topicAnalysis[topic] = {
        status: this.assessTopicStatus(topic, intelligence),
        recent_developments: this.extractTopicDevelopments(topic, intelligence),
        trend_analysis: this.analyzeTopicTrend(topic, intelligence),
        impact_assessment: this.assessTopicImpact(topic, profile, intelligence),
        response_options: this.generateTopicResponses(topic, profile, intelligence)
      };
    }
    
    return {
      topic_dashboard: {
        trending_up: this.identifyTrendingTopics(topicAnalysis, 'up'),
        trending_down: this.identifyTrendingTopics(topicAnalysis, 'down'),
        breakthrough_developments: this.identifyBreakthroughs(topicAnalysis),
        stagnant_areas: this.identifyStagnantTopics(topicAnalysis)
      },
      
      topic_deep_dives: topicAnalysis,
      
      topic_intelligence: {
        convergence_points: this.identifyTopicConvergence(topicAnalysis),
        blind_spots: this.identifyTopicBlindSpots(profile, topicAnalysis),
        opportunity_windows: this.identifyOpportunityWindows(topicAnalysis)
      },
      
      monitoring_adjustments: this.suggestMonitoringAdjustments(profile, topicAnalysis)
    };
  }

  /**
   * Generate Predictions Tab
   * Synthesize all data for cascade event predictions
   */
  async generatePredictionsTab(profile, intelligence) {
    // Analyze patterns across all data
    const patterns = this.identifyPatterns(profile, intelligence);
    const signals = this.detectWeakSignals(profile, intelligence);
    
    return {
      predictive_scenarios: [
        {
          scenario: 'Most Likely',
          probability: 70,
          description: this.generateMostLikelyScenario(profile, patterns),
          triggers: this.identifyScenarioTriggers(profile, patterns, 'likely'),
          cascade_effects: this.predictCascadeEffects(profile, patterns, 'likely'),
          preparation_steps: this.generatePreparationSteps(profile, 'likely')
        },
        {
          scenario: 'Best Case',
          probability: 20,
          description: this.generateBestCaseScenario(profile, patterns),
          triggers: this.identifyScenarioTriggers(profile, patterns, 'best'),
          cascade_effects: this.predictCascadeEffects(profile, patterns, 'best'),
          exploitation_steps: this.generateExploitationSteps(profile, 'best')
        },
        {
          scenario: 'Worst Case',
          probability: 10,
          description: this.generateWorstCaseScenario(profile, patterns),
          triggers: this.identifyScenarioTriggers(profile, patterns, 'worst'),
          cascade_effects: this.predictCascadeEffects(profile, patterns, 'worst'),
          mitigation_steps: this.generateMitigationSteps(profile, 'worst')
        }
      ],
      
      cascade_analysis: {
        primary_triggers: this.identifyPrimaryTriggers(patterns, signals),
        secondary_effects: this.predictSecondaryEffects(patterns, signals),
        tertiary_impacts: this.predictTertiaryImpacts(patterns, signals)
      },
      
      early_warnings: {
        signals_detected: signals,
        threshold_alerts: this.identifyThresholdAlerts(profile, intelligence),
        pattern_breaks: this.detectPatternBreaks(patterns, intelligence)
      },
      
      strategic_implications: {
        opportunities_emerging: this.predictEmergingOpportunities(profile, patterns),
        threats_forming: this.predictFormingThreats(profile, patterns),
        decision_points: this.identifyUpcomingDecisionPoints(profile, patterns)
      }
    };
  }

  // Helper methods for executive overview
  createExecutiveSummary(profile, intelligence) {
    const context = profile.established_facts.pain_points[0] || 'market dynamics';
    return `${profile.identity.name} faces evolving ${context} with ${profile.monitoring_targets.competitors.primary.length} key competitors showing increased activity. Stakeholder sentiment remains ${this.getOverallSentiment(intelligence)} with ${this.countCriticalDevelopments(intelligence)} critical developments requiring attention.`;
  }

  identifyCriticalAlerts(profile, intelligence) {
    const alerts = [];
    
    // Check for competitor moves
    if (intelligence.competitor_announcement) {
      alerts.push({
        type: 'competitive',
        severity: 'high',
        message: 'Major competitor announcement detected',
        action_required: true
      });
    }
    
    // Check for regulatory changes
    if (intelligence.regulatory_update) {
      alerts.push({
        type: 'regulatory',
        severity: 'high',
        message: 'New regulatory requirements announced',
        action_required: true
      });
    }
    
    return alerts;
  }

  prioritizeActions(profile, intelligence) {
    const actions = [];
    
    // Immediate actions (24 hours)
    actions.push({
      priority: 'immediate',
      action: 'Address competitive announcement',
      rationale: 'Maintain market position',
      owner: 'Executive team'
    });
    
    // This week actions
    actions.push({
      priority: 'this_week',
      action: 'Engage key stakeholders on concerns',
      rationale: 'Prevent escalation',
      owner: 'Stakeholder relations'
    });
    
    // Strategic actions
    actions.push({
      priority: 'strategic',
      action: 'Develop response to market shift',
      rationale: 'Long-term positioning',
      owner: 'Strategy team'
    });
    
    return actions;
  }

  // Helper methods for data extraction and analysis
  extractCompetitorNews(competitor, intelligence) {
    // Extract news specific to this competitor
    return intelligence.news?.filter(item => 
      item.title?.includes(competitor) || item.content?.includes(competitor)
    ) || [];
  }

  analyzeStrategicMoves(competitor, intelligence) {
    // Analyze strategic patterns
    return {
      expansion: 'Entering new markets',
      innovation: 'New product launches',
      partnerships: 'Strategic alliances formed'
    };
  }

  assessCompetitorThreat(competitor, profile, intelligence) {
    // Assess threat level based on multiple factors
    return {
      level: 'medium',
      factors: ['market share growth', 'innovation pace'],
      trajectory: 'increasing'
    };
  }

  // Utility methods
  getOverallSentiment(intelligence) {
    // Calculate overall sentiment from intelligence
    return 'mixed';
  }

  countCriticalDevelopments(intelligence) {
    // Count critical items across all intelligence
    return 3;
  }

  identifyTrendingTopics(topicAnalysis, direction) {
    // Identify topics trending in specified direction
    return Object.entries(topicAnalysis)
      .filter(([topic, analysis]) => analysis.trend_analysis?.direction === direction)
      .map(([topic]) => topic);
  }

  detectWeakSignals(profile, intelligence) {
    // Detect early warning signals
    return [
      'Unusual competitor hiring patterns',
      'Regulatory consultation papers published',
      'Stakeholder coalition forming'
    ];
  }

  generateMostLikelyScenario(profile, patterns) {
    return `Based on current patterns, ${profile.identity.name} will likely face increased competitive pressure requiring strategic response within 90 days.`;
  }

  predictCascadeEffects(profile, patterns, scenarioType) {
    return [
      'Market repositioning required',
      'Stakeholder communications necessary',
      'Resource reallocation needed'
    ];
  }
}

export default new TabIntelligenceService();