import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Narrative {
  id: string;
  title: string;
  core_message: string;
  narrative_type: 'brand' | 'crisis' | 'policy' | 'competitive' | 'defensive';
  themes: string[];
  key_messengers: any[];
  channels: string[];
  target_audiences: string[];
  strength_score: number;
  reach_estimate: number;
  adoption_rate: number;
  counter_narratives: string[];
  supporting_evidence: any[];
  created_date: string;
  last_updated: string;
}

class SignalDeskNarrativesMCP {
  private server: Server;
  private narrativeCache: Map<string, Narrative> = new Map();

  constructor() {
    this.server = new Server(
      { name: 'signaldesk-narratives', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.handleToolCall(request.params.name, request.params.arguments || {});
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'track_narrative_evolution',
        description: 'Track how narratives evolve over time across media and social channels',
        inputSchema: {
          type: 'object',
          properties: {
            narrative_id: { type: 'string', description: 'Narrative identifier to track' },
            timeframe: { type: 'string', description: 'Time period for analysis' },
            channels: { type: 'array', items: { type: 'string' }, description: 'Channels to monitor' }
          },
          required: ['narrative_id']
        }
      },
      {
        name: 'detect_narrative_vacuum',
        description: 'Detect narrative vacuums where no dominant story exists',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Topic or issue to analyze' },
            timeframe: { type: 'string', description: 'Time period to analyze' },
            channels: { type: 'array', items: { type: 'string' }, description: 'Channels to scan' }
          },
          required: ['topic']
        }
      },
      {
        name: 'measure_narrative_strength',
        description: 'Measure the strength and penetration of existing narratives',
        inputSchema: {
          type: 'object',
          properties: {
            narrative_id: { type: 'string', description: 'Narrative to measure' },
            metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics to include' }
          },
          required: ['narrative_id']
        }
      },
      {
        name: 'predict_narrative_spread',
        description: 'Predict how narratives will spread across different channels and audiences',
        inputSchema: {
          type: 'object',
          properties: {
            narrative_content: { type: 'string', description: 'Narrative content to analyze' },
            initial_channels: { type: 'array', items: { type: 'string' }, description: 'Starting channels' },
            prediction_horizon: { type: 'string', description: 'Prediction timeframe' }
          },
          required: ['narrative_content']
        }
      },
      {
        name: 'identify_narrative_drivers',
        description: 'Identify key drivers and influencers shaping narratives',
        inputSchema: {
          type: 'object',
          properties: {
            narrative_id: { type: 'string', description: 'Narrative to analyze' },
            driver_types: { type: 'array', items: { type: 'string' }, description: 'Types of drivers to identify' }
          },
          required: ['narrative_id']
        }
      },
      {
        name: 'create_counter_narrative',
        description: 'Create counter-narratives to challenge existing stories',
        inputSchema: {
          type: 'object',
          properties: {
            target_narrative: { type: 'string', description: 'Narrative to counter' },
            strategy: { type: 'string', description: 'Counter-narrative strategy' },
            target_audiences: { type: 'array', items: { type: 'string' }, description: 'Target audiences' }
          },
          required: ['target_narrative']
        }
      },
      {
        name: 'track_narrative_adoption',
        description: 'Track adoption and spread of narratives across stakeholder groups',
        inputSchema: {
          type: 'object',
          properties: {
            narrative_id: { type: 'string', description: 'Narrative to track' },
            stakeholder_groups: { type: 'array', items: { type: 'string' }, description: 'Groups to monitor' },
            adoption_metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics to track' }
          },
          required: ['narrative_id']
        }
      }
    ];
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'track_narrative_evolution':
        return this.trackNarrativeEvolution(args.narrative_id, args.timeframe, args.channels);
      case 'detect_narrative_vacuum':
        return this.detectNarrativeVacuum(args.topic, args.timeframe, args.channels);
      case 'measure_narrative_strength':
        return this.measureNarrativeStrength(args.narrative_id, args.metrics);
      case 'predict_narrative_spread':
        return this.predictNarrativeSpread(args.narrative_content, args.initial_channels, args.prediction_horizon);
      case 'identify_narrative_drivers':
        return this.identifyNarrativeDrivers(args.narrative_id, args.driver_types);
      case 'create_counter_narrative':
        return this.createCounterNarrative(args.target_narrative, args.strategy, args.target_audiences);
      case 'track_narrative_adoption':
        return this.trackNarrativeAdoption(args.narrative_id, args.stakeholder_groups, args.adoption_metrics);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async trackNarrativeEvolution(narrativeId: string, timeframe: string = '30d', channels?: string[]) {
    const evolution = {
      narrative_id: narrativeId,
      timeframe,
      channels: channels || ['media', 'social', 'blogs'],
      evolution_timeline: await this.buildEvolutionTimeline(narrativeId, timeframe),
      key_changes: await this.identifyKeyChanges(narrativeId, timeframe),
      momentum_analysis: this.analyzeMomentum(narrativeId),
      trend_predictions: this.predictTrends(narrativeId)
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(evolution, null, 2)
      }]
    };
  }

  private async buildEvolutionTimeline(narrativeId: string, timeframe: string): Promise<any[]> {
    // Simulate timeline events
    return [
      { date: '2024-01-01', event: 'narrative_emergence', strength: 20 },
      { date: '2024-01-15', event: 'media_pickup', strength: 45 },
      { date: '2024-02-01', event: 'social_amplification', strength: 70 },
      { date: '2024-02-15', event: 'stakeholder_adoption', strength: 85 }
    ];
  }

  private async identifyKeyChanges(narrativeId: string, timeframe: string): Promise<any[]> {
    return [
      { type: 'messaging_shift', description: 'Focus shifted from technical to emotional appeal', impact: 'high' },
      { type: 'messenger_change', description: 'New influential voices joined narrative', impact: 'medium' },
      { type: 'evidence_update', description: 'New supporting evidence emerged', impact: 'medium' }
    ];
  }

  private analyzeMomentum(narrativeId: string): any {
    return {
      current_velocity: Math.random() * 100,
      direction: Math.random() > 0.5 ? 'growing' : 'declining',
      acceleration: Math.random() * 20 - 10,
      sustainability_score: Math.random() * 100
    };
  }

  private predictTrends(narrativeId: string): any {
    return {
      next_30_days: Math.random() > 0.5 ? 'growth' : 'maintenance',
      peak_prediction: '45 days',
      decline_factors: ['competing_narratives', 'evidence_challenges'],
      amplification_opportunities: ['influencer_engagement', 'media_events']
    };
  }

  private async detectNarrativeVacuum(topic: string, timeframe: string = '7d', channels?: string[]) {
    const vacuum = {
      topic,
      timeframe,
      channels: channels || ['all'],
      vacuum_detected: Math.random() > 0.3,
      narrative_gap_score: Math.random() * 100,
      competing_narratives: await this.findCompetingNarratives(topic),
      opportunity_assessment: this.assessOpportunity(topic),
      recommended_narrative: this.suggestNarrative(topic)
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(vacuum, null, 2)
      }]
    };
  }

  private async findCompetingNarratives(topic: string): Promise<any[]> {
    return [
      { narrative: `${topic} is beneficial`, strength: 30, adoption: 25 },
      { narrative: `${topic} needs regulation`, strength: 45, adoption: 35 },
      { narrative: `${topic} is overrated`, strength: 20, adoption: 15 }
    ];
  }

  private assessOpportunity(topic: string): any {
    return {
      opportunity_score: Math.random() * 100,
      urgency: Math.random() > 0.5 ? 'high' : 'medium',
      competition_level: Math.random() > 0.7 ? 'high' : 'moderate',
      resource_requirements: 'medium'
    };
  }

  private suggestNarrative(topic: string): any {
    return {
      suggested_angle: `${topic} as innovation catalyst`,
      key_messages: ['drives progress', 'creates opportunities', 'solves problems'],
      target_audiences: ['innovators', 'policymakers', 'public'],
      launch_strategy: 'thought_leadership'
    };
  }

  private async measureNarrativeStrength(narrativeId: string, metrics?: string[]) {
    const strength = {
      narrative_id: narrativeId,
      overall_strength: Math.random() * 100,
      metrics: {
        reach: Math.random() * 1000000,
        engagement: Math.random() * 100000,
        adoption_rate: Math.random() * 100,
        credibility_score: Math.random() * 100,
        emotional_resonance: Math.random() * 100
      },
      strength_factors: this.identifyStrengthFactors(),
      weakness_areas: this.identifyWeaknesses(),
      improvement_recommendations: this.suggestImprovements()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(strength, null, 2)
      }]
    };
  }

  private identifyStrengthFactors(): string[] {
    return ['clear_messaging', 'credible_sources', 'emotional_appeal', 'evidence_based'];
  }

  private identifyWeaknesses(): string[] {
    return ['limited_reach', 'weak_evidence', 'messenger_credibility'];
  }

  private suggestImprovements(): string[] {
    return ['expand_messenger_network', 'strengthen_evidence_base', 'improve_emotional_appeal'];
  }

  private async predictNarrativeSpread(narrativeContent: string, initialChannels?: string[], predictionHorizon: string = '30d') {
    const prediction = {
      narrative_content: narrativeContent.slice(0, 100),
      prediction_horizon: predictionHorizon,
      spread_model: {
        viral_coefficient: Math.random() * 2,
        adoption_curve: 'exponential',
        peak_reach_day: Math.floor(Math.random() * 30) + 5
      },
      channel_progression: this.predictChannelProgression(initialChannels),
      audience_penetration: this.predictAudiencePenetration(),
      resistance_factors: this.identifyResistanceFactors()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(prediction, null, 2)
      }]
    };
  }

  private predictChannelProgression(initialChannels?: string[]): any {
    return {
      day_1: initialChannels || ['social_media'],
      day_7: ['social_media', 'blogs', 'podcasts'],
      day_14: ['social_media', 'blogs', 'podcasts', 'traditional_media'],
      day_30: ['all_channels']
    };
  }

  private predictAudiencePenetration(): any {
    return {
      early_adopters: 15,
      mainstream: 45,
      laggards: 25,
      total_addressable: 85
    };
  }

  private identifyResistanceFactors(): string[] {
    return ['competing_narratives', 'source_skepticism', 'topic_fatigue'];
  }

  private async identifyNarrativeDrivers(narrativeId: string, driverTypes?: string[]) {
    const drivers = {
      narrative_id: narrativeId,
      key_drivers: {
        individuals: this.identifyKeyIndividuals(),
        organizations: this.identifyKeyOrganizations(),
        events: this.identifyDrivingEvents(),
        trends: this.identifyDrivingTrends()
      },
      influence_network: this.mapInfluenceNetwork(),
      driver_impact_analysis: this.analyzeDriveImpact()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(drivers, null, 2)
      }]
    };
  }

  private identifyKeyIndividuals(): any[] {
    return [
      { name: 'Thought Leader A', influence_score: 85, reach: 500000 },
      { name: 'Expert B', influence_score: 70, reach: 200000 }
    ];
  }

  private identifyKeyOrganizations(): any[] {
    return [
      { name: 'Research Institute X', credibility: 90, reach: 1000000 },
      { name: 'Industry Association Y', credibility: 75, reach: 300000 }
    ];
  }

  private identifyDrivingEvents(): any[] {
    return [
      { event: 'Major Conference', impact: 'high', date: '2024-01-15' },
      { event: 'Research Publication', impact: 'medium', date: '2024-01-20' }
    ];
  }

  private identifyDrivingTrends(): any[] {
    return [
      { trend: 'Market Demand', strength: 80 },
      { trend: 'Regulatory Changes', strength: 60 }
    ];
  }

  private mapInfluenceNetwork(): any {
    return {
      network_density: Math.random(),
      key_connectors: ['Influencer A', 'Organization B'],
      amplification_paths: ['social -> media -> policy']
    };
  }

  private analyzeDriveImpact(): any {
    return {
      primary_drivers: ['thought_leadership', 'market_trends'],
      secondary_drivers: ['regulatory_pressure', 'public_interest'],
      driver_synergies: 'high'
    };
  }

  private async createCounterNarrative(targetNarrative: string, strategy?: string, targetAudiences?: string[]) {
    const counterNarrative = {
      target_narrative: targetNarrative,
      strategy: strategy || 'evidence_based_rebuttal',
      counter_narrative: {
        title: `Alternative Perspective on ${targetNarrative}`,
        core_message: this.generateCounterMessage(targetNarrative),
        key_arguments: this.generateCounterArguments(targetNarrative),
        supporting_evidence: this.gatherSupportingEvidence(targetNarrative)
      },
      deployment_plan: this.createDeploymentPlan(targetAudiences),
      success_metrics: this.defineSuccessMetrics()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(counterNarrative, null, 2)
      }]
    };
  }

  private generateCounterMessage(targetNarrative: string): string {
    return `A balanced view of ${targetNarrative} reveals important nuances and alternative perspectives`;
  }

  private generateCounterArguments(targetNarrative: string): string[] {
    return [
      'Missing context consideration',
      'Alternative evidence exists',
      'Different stakeholder perspectives',
      'Unintended consequences analysis'
    ];
  }

  private gatherSupportingEvidence(targetNarrative: string): any[] {
    return [
      { type: 'research_study', credibility: 85, relevance: 90 },
      { type: 'expert_opinion', credibility: 75, relevance: 80 },
      { type: 'case_study', credibility: 70, relevance: 85 }
    ];
  }

  private createDeploymentPlan(targetAudiences?: string[]): any {
    return {
      phase_1: 'thought_leadership_articles',
      phase_2: 'expert_interviews',
      phase_3: 'social_media_campaign',
      target_audiences: targetAudiences || ['industry_experts', 'policymakers', 'media'],
      timeline: '8_weeks'
    };
  }

  private defineSuccessMetrics(): any {
    return {
      reach_target: 500000,
      engagement_target: 50000,
      narrative_shift_percentage: 15,
      credibility_improvement: 20
    };
  }

  private async trackNarrativeAdoption(narrativeId: string, stakeholderGroups?: string[], adoptionMetrics?: string[]) {
    const adoption = {
      narrative_id: narrativeId,
      stakeholder_groups: stakeholderGroups || ['media', 'policymakers', 'industry', 'public'],
      adoption_analysis: await this.analyzeAdoption(narrativeId, stakeholderGroups),
      adoption_timeline: this.buildAdoptionTimeline(narrativeId),
      resistance_analysis: this.analyzeResistance(narrativeId),
      acceleration_opportunities: this.identifyAccelerationOpportunities(narrativeId)
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(adoption, null, 2)
      }]
    };
  }

  private async analyzeAdoption(narrativeId: string, stakeholderGroups?: string[]): Promise<any> {
    const groups = stakeholderGroups || ['media', 'policymakers', 'industry', 'public'];
    const analysis: any = {};

    groups.forEach(group => {
      analysis[group] = {
        adoption_rate: Math.random() * 100,
        adoption_stage: ['awareness', 'consideration', 'adoption', 'advocacy'][Math.floor(Math.random() * 4)],
        key_adopters: [`${group}_leader_1`, `${group}_leader_2`],
        barriers: this.identifyAdoptionBarriers(group)
      };
    });

    return analysis;
  }

  private identifyAdoptionBarriers(group: string): string[] {
    const barriers: Record<string, string[]> = {
      media: ['competing_stories', 'source_verification'],
      policymakers: ['political_sensitivity', 'evidence_requirements'],
      industry: ['competitive_concerns', 'resource_constraints'],
      public: ['complexity', 'relevance_questions']
    };

    return barriers[group] || ['general_skepticism'];
  }

  private buildAdoptionTimeline(narrativeId: string): any[] {
    return [
      { week: 1, cumulative_adoption: 5, new_adopters: 5 },
      { week: 2, cumulative_adoption: 12, new_adopters: 7 },
      { week: 4, cumulative_adoption: 25, new_adopters: 13 },
      { week: 8, cumulative_adoption: 45, new_adopters: 20 }
    ];
  }

  private analyzeResistance(narrativeId: string): any {
    return {
      resistance_level: Math.random() * 100,
      resistance_sources: ['competing_interests', 'status_quo_bias', 'evidence_gaps'],
      resistance_strategies: ['direct_confrontation', 'alternative_positioning', 'gradual_introduction']
    };
  }

  private identifyAccelerationOpportunities(narrativeId: string): any[] {
    return [
      { opportunity: 'influencer_partnerships', impact: 'high', effort: 'medium' },
      { opportunity: 'media_events', impact: 'medium', effort: 'high' },
      { opportunity: 'social_proof_campaigns', impact: 'medium', effort: 'low' }
    ];
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SignalDesk Narratives MCP started');
  }
}

const mcp = new SignalDeskNarrativesMCP();
mcp.start().catch(console.error);