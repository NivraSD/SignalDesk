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

interface CrisisSignal {
  id: string;
  signal_type: 'social' | 'media' | 'regulatory' | 'operational' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  content: string;
  entities_affected: string[];
  timestamp: string;
  indicators: string[];
  confidence_score: number;
  response_required: boolean;
}

interface CrisisResponse {
  id: string;
  crisis_id: string;
  response_type: 'statement' | 'action' | 'investigation' | 'escalation';
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  stakeholders: string[];
  channels: string[];
  content: string;
  timeline: string;
  approval_required: boolean;
  status: 'draft' | 'pending' | 'approved' | 'deployed';
}

interface WarRoom {
  id: string;
  crisis_id: string;
  participants: any[];
  status: 'forming' | 'active' | 'monitoring' | 'resolved';
  objectives: string[];
  action_items: any[];
  communications_log: any[];
  decisions: any[];
  next_meeting: string;
}

class SignalDeskCrisisMCP {
  private server: Server;
  private crisisCache: Map<string, CrisisSignal> = new Map();
  private warRooms: Map<string, WarRoom> = new Map();

  constructor() {
    this.server = new Server(
      { name: 'signaldesk-crisis', version: '1.0.0' },
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
        name: 'detect_crisis_signals',
        description: 'Detect and analyze potential crisis signals from multiple sources',
        inputSchema: {
          type: 'object',
          properties: {
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: 'Sources to monitor (social, media, regulatory, operational)'
            },
            entities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Entities to monitor for crisis signals'
            },
            timeframe: { type: 'string', description: 'Time period to analyze (e.g., "24h", "7d")' },
            sensitivity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Detection sensitivity level' }
          },
          required: ['sources']
        }
      },
      {
        name: 'assess_crisis_severity',
        description: 'Assess the severity and potential impact of a crisis',
        inputSchema: {
          type: 'object',
          properties: {
            crisis_id: { type: 'string', description: 'Crisis identifier' },
            factors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Additional factors to consider in assessment'
            }
          },
          required: ['crisis_id']
        }
      },
      {
        name: 'generate_crisis_response',
        description: 'Generate appropriate response options for a crisis situation',
        inputSchema: {
          type: 'object',
          properties: {
            crisis_id: { type: 'string', description: 'Crisis identifier' },
            response_type: { 
              type: 'string', 
              enum: ['statement', 'action', 'investigation', 'escalation'],
              description: 'Type of response to generate'
            },
            target_audiences: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target audiences for the response'
            },
            urgency: { type: 'string', enum: ['low', 'medium', 'high', 'immediate'], description: 'Response urgency' }
          },
          required: ['crisis_id', 'response_type']
        }
      },
      {
        name: 'coordinate_war_room',
        description: 'Set up and coordinate crisis response war room',
        inputSchema: {
          type: 'object',
          properties: {
            crisis_id: { type: 'string', description: 'Crisis identifier' },
            action: { 
              type: 'string', 
              enum: ['create', 'update', 'escalate', 'deactivate'],
              description: 'War room action to take'
            },
            participants: {
              type: 'array',
              items: { type: 'string' },
              description: 'Participants to include in war room'
            },
            objectives: {
              type: 'array',
              items: { type: 'string' },
              description: 'War room objectives'
            }
          },
          required: ['crisis_id', 'action']
        }
      },
      {
        name: 'monitor_crisis_evolution',
        description: 'Monitor how a crisis is evolving over time',
        inputSchema: {
          type: 'object',
          properties: {
            crisis_id: { type: 'string', description: 'Crisis identifier' },
            monitoring_interval: { type: 'string', description: 'How often to check (e.g., "15m", "1h")' },
            alert_thresholds: {
              type: 'object',
              description: 'Thresholds for escalation alerts'
            }
          },
          required: ['crisis_id']
        }
      },
      {
        name: 'predict_crisis_cascade',
        description: 'Predict potential cascade effects and secondary crises',
        inputSchema: {
          type: 'object',
          properties: {
            crisis_id: { type: 'string', description: 'Initial crisis identifier' },
            scenario_depth: { type: 'number', description: 'How many cascade levels to predict' },
            probability_threshold: { type: 'number', description: 'Minimum probability to include in predictions' }
          },
          required: ['crisis_id']
        }
      },
      {
        name: 'generate_holding_statement',
        description: 'Generate immediate holding statement for crisis communication',
        inputSchema: {
          type: 'object',
          properties: {
            crisis_id: { type: 'string', description: 'Crisis identifier' },
            tone: { type: 'string', enum: ['formal', 'empathetic', 'authoritative', 'apologetic'], description: 'Statement tone' },
            channels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Channels where statement will be published'
            },
            key_messages: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key messages to include'
            }
          },
          required: ['crisis_id']
        }
      }
    ];
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'detect_crisis_signals':
        return this.detectCrisisSignals(args.sources, args.entities, args.timeframe, args.sensitivity);
      case 'assess_crisis_severity':
        return this.assessCrisisSeverity(args.crisis_id, args.factors);
      case 'generate_crisis_response':
        return this.generateCrisisResponse(args.crisis_id, args.response_type, args.target_audiences, args.urgency);
      case 'coordinate_war_room':
        return this.coordinateWarRoom(args.crisis_id, args.action, args.participants, args.objectives);
      case 'monitor_crisis_evolution':
        return this.monitorCrisisEvolution(args.crisis_id, args.monitoring_interval, args.alert_thresholds);
      case 'predict_crisis_cascade':
        return this.predictCrisisCascade(args.crisis_id, args.scenario_depth, args.probability_threshold);
      case 'generate_holding_statement':
        return this.generateHoldingStatement(args.crisis_id, args.tone, args.channels, args.key_messages);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async detectCrisisSignals(sources: string[], entities?: string[], timeframe: string = '24h', sensitivity: string = 'medium') {
    const signals: CrisisSignal[] = [];
    const now = new Date();
    const timeframeParts = timeframe.match(/(\d+)([hdw])/);
    const value = timeframeParts ? parseInt(timeframeParts[1]) : 24;
    const unit = timeframeParts ? timeframeParts[2] : 'h';
    
    let hoursBack = value;
    if (unit === 'd') hoursBack = value * 24;
    if (unit === 'w') hoursBack = value * 24 * 7;
    
    const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    // Query various sources for potential crisis signals
    for (const source of sources) {
      switch (source) {
        case 'social':
          const socialSignals = await this.scanSocialMedia(entities, since, sensitivity);
          signals.push(...socialSignals);
          break;
        case 'media':
          const mediaSignals = await this.scanMediaCoverage(entities, since, sensitivity);
          signals.push(...mediaSignals);
          break;
        case 'regulatory':
          const regulatorySignals = await this.scanRegulatory(entities, since, sensitivity);
          signals.push(...regulatorySignals);
          break;
        case 'operational':
          const operationalSignals = await this.scanOperational(entities, since, sensitivity);
          signals.push(...operationalSignals);
          break;
      }
    }

    // Store signals in database
    for (const signal of signals) {
      await supabase.from('crisis_signals').upsert(signal);
      this.crisisCache.set(signal.id, signal);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          signals_detected: signals.length,
          high_priority: signals.filter(s => s.severity === 'high' || s.severity === 'critical').length,
          sources_scanned: sources,
          timeframe,
          signals: signals.sort((a, b) => b.confidence_score - a.confidence_score)
        }, null, 2)
      }]
    };
  }

  private async scanSocialMedia(entities?: string[], since?: Date, sensitivity?: string): Promise<CrisisSignal[]> {
    const signals: CrisisSignal[] = [];
    
    // Simulate social media scanning
    const indicators = [
      'backlash', 'boycott', 'outrage', 'scandal', 'controversy',
      'lawsuit', 'investigation', 'protest', 'viral complaint'
    ];

    // Create sample signals based on sensitivity
    const signalCount = sensitivity === 'high' ? 5 : sensitivity === 'medium' ? 3 : 1;
    
    for (let i = 0; i < signalCount; i++) {
      const signal: CrisisSignal = {
        id: `social_${Date.now()}_${i}`,
        signal_type: 'social',
        severity: this.randomSeverity(),
        source: 'twitter',
        content: `Social media activity detected: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
        entities_affected: entities || ['unknown_entity'],
        timestamp: new Date().toISOString(),
        indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
        confidence_score: Math.random() * 0.3 + 0.7,
        response_required: Math.random() > 0.5
      };
      signals.push(signal);
    }

    return signals;
  }

  private async scanMediaCoverage(entities?: string[], since?: Date, sensitivity?: string): Promise<CrisisSignal[]> {
    const signals: CrisisSignal[] = [];
    
    const indicators = [
      'negative coverage', 'investigative report', 'regulatory filing',
      'executive departure', 'financial irregularity', 'safety concern'
    ];

    const signalCount = sensitivity === 'high' ? 3 : sensitivity === 'medium' ? 2 : 1;
    
    for (let i = 0; i < signalCount; i++) {
      const signal: CrisisSignal = {
        id: `media_${Date.now()}_${i}`,
        signal_type: 'media',
        severity: this.randomSeverity(),
        source: 'reuters',
        content: `Media coverage detected: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
        entities_affected: entities || ['unknown_entity'],
        timestamp: new Date().toISOString(),
        indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
        confidence_score: Math.random() * 0.2 + 0.8,
        response_required: true
      };
      signals.push(signal);
    }

    return signals;
  }

  private async scanRegulatory(entities?: string[], since?: Date, sensitivity?: string): Promise<CrisisSignal[]> {
    const signals: CrisisSignal[] = [];
    
    const indicators = ['fine', 'investigation', 'violation', 'enforcement action', 'compliance failure'];
    const signalCount = sensitivity === 'high' ? 2 : 1;
    
    for (let i = 0; i < signalCount; i++) {
      const signal: CrisisSignal = {
        id: `regulatory_${Date.now()}_${i}`,
        signal_type: 'regulatory',
        severity: 'high',
        source: 'sec',
        content: `Regulatory activity: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
        entities_affected: entities || ['unknown_entity'],
        timestamp: new Date().toISOString(),
        indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
        confidence_score: 0.95,
        response_required: true
      };
      signals.push(signal);
    }

    return signals;
  }

  private async scanOperational(entities?: string[], since?: Date, sensitivity?: string): Promise<CrisisSignal[]> {
    const signals: CrisisSignal[] = [];
    
    const indicators = ['system outage', 'security breach', 'data leak', 'service disruption'];
    const signalCount = sensitivity === 'high' ? 2 : 1;
    
    for (let i = 0; i < signalCount; i++) {
      const signal: CrisisSignal = {
        id: `operational_${Date.now()}_${i}`,
        signal_type: 'operational',
        severity: this.randomSeverity(),
        source: 'internal_monitoring',
        content: `Operational issue: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
        entities_affected: entities || ['unknown_entity'],
        timestamp: new Date().toISOString(),
        indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
        confidence_score: 0.9,
        response_required: true
      };
      signals.push(signal);
    }

    return signals;
  }

  private randomSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const rand = Math.random();
    if (rand < 0.1) return 'critical';
    if (rand < 0.3) return 'high';
    if (rand < 0.7) return 'medium';
    return 'low';
  }

  private async assessCrisisSeverity(crisisId: string, factors?: string[]) {
    let signal = this.crisisCache.get(crisisId);
    
    if (!signal) {
      const { data, error } = await supabase
        .from('crisis_signals')
        .select('*')
        .eq('id', crisisId)
        .single();
      
      if (error || !data) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Crisis signal not found' })
          }]
        };
      }
      signal = data as CrisisSignal;
      this.crisisCache.set(crisisId, signal);
    }

    const assessment = {
      crisis_id: crisisId,
      current_severity: signal.severity,
      assessed_severity: this.calculateSeverity(signal, factors),
      impact_score: this.calculateImpactScore(signal),
      urgency_level: this.calculateUrgency(signal),
      risk_factors: this.identifyRiskFactors(signal),
      recommended_actions: this.recommendActions(signal),
      escalation_needed: this.shouldEscalate(signal),
      estimated_resolution_time: this.estimateResolutionTime(signal)
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(assessment, null, 2)
      }]
    };
  }

  private calculateSeverity(signal: CrisisSignal, factors?: string[]): string {
    let score = 0;
    
    // Base severity score
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    score += severityScores[signal.severity];
    
    // Confidence impact
    score += signal.confidence_score * 2;
    
    // Entity impact
    score += signal.entities_affected.length * 0.5;
    
    // Additional factors
    if (factors) {
      if (factors.includes('media_attention')) score += 1;
      if (factors.includes('regulatory_scrutiny')) score += 2;
      if (factors.includes('customer_impact')) score += 1.5;
      if (factors.includes('financial_impact')) score += 2;
    }
    
    if (score >= 6) return 'critical';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private calculateImpactScore(signal: CrisisSignal): number {
    let score = 0;
    score += signal.confidence_score * 100;
    score += signal.entities_affected.length * 10;
    
    const severityMultipliers = { low: 1, medium: 1.5, high: 2, critical: 3 };
    score *= severityMultipliers[signal.severity];
    
    return Math.min(100, Math.round(score));
  }

  private calculateUrgency(signal: CrisisSignal): string {
    if (signal.severity === 'critical') return 'immediate';
    if (signal.severity === 'high') return 'high';
    if (signal.response_required) return 'medium';
    return 'low';
  }

  private identifyRiskFactors(signal: CrisisSignal): string[] {
    const factors = [];
    
    if (signal.signal_type === 'social') factors.push('viral_potential', 'reputation_damage');
    if (signal.signal_type === 'regulatory') factors.push('compliance_violations', 'legal_action');
    if (signal.signal_type === 'operational') factors.push('service_disruption', 'customer_impact');
    if (signal.confidence_score > 0.8) factors.push('high_confidence');
    if (signal.entities_affected.length > 1) factors.push('multi_entity_impact');
    
    return factors;
  }

  private recommendActions(signal: CrisisSignal): string[] {
    const actions = [];
    
    if (signal.severity === 'critical' || signal.severity === 'high') {
      actions.push('activate_war_room', 'notify_leadership', 'prepare_statement');
    }
    
    if (signal.signal_type === 'social') {
      actions.push('monitor_social_sentiment', 'prepare_social_response');
    }
    
    if (signal.signal_type === 'regulatory') {
      actions.push('engage_legal_counsel', 'review_compliance');
    }
    
    actions.push('continue_monitoring', 'document_timeline');
    
    return actions;
  }

  private shouldEscalate(signal: CrisisSignal): boolean {
    return signal.severity === 'critical' || 
           (signal.severity === 'high' && signal.confidence_score > 0.8) ||
           signal.entities_affected.length > 2;
  }

  private estimateResolutionTime(signal: CrisisSignal): string {
    const timeframes = {
      critical: '2-6 hours',
      high: '6-24 hours',
      medium: '1-3 days',
      low: '3-7 days'
    };
    
    return timeframes[signal.severity];
  }

  private async generateCrisisResponse(crisisId: string, responseType: string, targetAudiences?: string[], urgency: string = 'medium') {
    const signal = await this.getCrisisSignal(crisisId);
    if (!signal) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Crisis signal not found' })
        }]
      };
    }

    const response: CrisisResponse = {
      id: `response_${Date.now()}`,
      crisis_id: crisisId,
      response_type: responseType as any,
      urgency: urgency as any,
      stakeholders: targetAudiences || ['internal', 'media', 'customers'],
      channels: this.selectChannels(responseType, urgency),
      content: this.generateResponseContent(signal, responseType, targetAudiences),
      timeline: this.generateTimeline(urgency),
      approval_required: this.requiresApproval(responseType, urgency),
      status: 'draft'
    };

    // Store response
    await supabase.from('crisis_responses').insert(response);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }]
    };
  }

  private async getCrisisSignal(crisisId: string): Promise<CrisisSignal | null> {
    if (this.crisisCache.has(crisisId)) {
      return this.crisisCache.get(crisisId)!;
    }

    const { data, error } = await supabase
      .from('crisis_signals')
      .select('*')
      .eq('id', crisisId)
      .single();

    if (error || !data) return null;
    
    const signal = data as CrisisSignal;
    this.crisisCache.set(crisisId, signal);
    return signal;
  }

  private selectChannels(responseType: string, urgency: string): string[] {
    const channels = [];
    
    if (urgency === 'immediate' || urgency === 'high') {
      channels.push('press_release', 'social_media', 'website');
    }
    
    if (responseType === 'statement') {
      channels.push('media_statement', 'internal_communication');
    }
    
    if (responseType === 'action') {
      channels.push('operational_communication', 'stakeholder_alert');
    }
    
    return channels.length > 0 ? channels : ['internal_communication'];
  }

  private generateResponseContent(signal: CrisisSignal, responseType: string, audiences?: string[]): string {
    const templates = {
      statement: `We are aware of reports regarding ${signal.content}. We take this matter seriously and are investigating. We will provide updates as more information becomes available.`,
      action: `We have taken immediate action to address ${signal.content}. Our team is actively working to resolve this situation and prevent recurrence.`,
      investigation: `We are conducting a thorough investigation into ${signal.content}. We are committed to transparency and will share findings once the investigation is complete.`,
      escalation: `This matter has been escalated to senior leadership for immediate attention. We are treating this situation with the highest priority.`
    };

    return templates[responseType as keyof typeof templates] || templates.statement;
  }

  private generateTimeline(urgency: string): string {
    const timelines = {
      immediate: 'Deploy within 1 hour',
      high: 'Deploy within 4 hours',
      medium: 'Deploy within 24 hours',
      low: 'Deploy within 72 hours'
    };
    
    return timelines[urgency as keyof typeof timelines] || timelines.medium;
  }

  private requiresApproval(responseType: string, urgency: string): boolean {
    return responseType === 'statement' || urgency === 'immediate';
  }

  private async coordinateWarRoom(crisisId: string, action: string, participants?: string[], objectives?: string[]) {
    let warRoom = this.warRooms.get(crisisId);

    switch (action) {
      case 'create':
        if (warRoom) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'War room already exists for this crisis' })
            }]
          };
        }

        warRoom = {
          id: `warroom_${crisisId}_${Date.now()}`,
          crisis_id: crisisId,
          participants: participants?.map(p => ({ name: p, role: 'member', status: 'invited' })) || [],
          status: 'forming',
          objectives: objectives || ['Assess situation', 'Coordinate response', 'Monitor evolution'],
          action_items: [],
          communications_log: [],
          decisions: [],
          next_meeting: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        };

        this.warRooms.set(crisisId, warRoom);
        await supabase.from('war_rooms').insert(warRoom);
        break;

      case 'update':
        if (!warRoom) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'War room not found' })
            }]
          };
        }

        if (participants) {
          warRoom.participants.push(...participants.map(p => ({ name: p, role: 'member', status: 'invited' })));
        }
        if (objectives) {
          warRoom.objectives.push(...objectives);
        }
        
        await supabase.from('war_rooms').update(warRoom).eq('id', warRoom.id);
        break;

      case 'escalate':
        if (warRoom) {
          warRoom.status = 'active';
          warRoom.participants.push({ name: 'Crisis Executive', role: 'leader', status: 'active' });
        }
        break;

      case 'deactivate':
        if (warRoom) {
          warRoom.status = 'resolved';
        }
        break;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(warRoom, null, 2)
      }]
    };
  }

  private async monitorCrisisEvolution(crisisId: string, monitoringInterval: string = '1h', alertThresholds?: any) {
    const monitoring = {
      crisis_id: crisisId,
      monitoring_active: true,
      interval: monitoringInterval,
      alert_thresholds: alertThresholds || {
        severity_increase: true,
        volume_spike: 0.5,
        sentiment_drop: -0.3,
        new_entities: 1
      },
      current_metrics: await this.getCurrentMetrics(crisisId),
      evolution_timeline: await this.getEvolutionTimeline(crisisId),
      predictions: await this.predictNextPhase(crisisId),
      recommended_actions: this.getMonitoringActions(crisisId)
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(monitoring, null, 2)
      }]
    };
  }

  private async getCurrentMetrics(crisisId: string): Promise<any> {
    return {
      mention_volume: Math.floor(Math.random() * 1000) + 100,
      sentiment_score: Math.random() * 2 - 1, // -1 to 1
      reach_estimate: Math.floor(Math.random() * 1000000) + 10000,
      media_coverage_count: Math.floor(Math.random() * 50) + 5,
      stakeholder_reactions: Math.floor(Math.random() * 20) + 2
    };
  }

  private async getEvolutionTimeline(crisisId: string): Promise<any[]> {
    return [
      {
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        event: 'Crisis signal detected',
        severity: 'medium',
        source: 'automated_monitoring'
      },
      {
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        event: 'Social media activity increased',
        severity: 'medium',
        source: 'social_monitoring'
      },
      {
        timestamp: new Date().toISOString(),
        event: 'Current status assessment',
        severity: 'medium',
        source: 'system'
      }
    ];
  }

  private async predictNextPhase(crisisId: string): Promise<any> {
    return {
      likely_scenario: 'Continued monitoring phase',
      probability: 0.7,
      timeframe: '2-6 hours',
      key_indicators: ['social_volume', 'media_pickup', 'stakeholder_response'],
      escalation_triggers: ['volume_spike', 'negative_sentiment', 'mainstream_media']
    };
  }

  private getMonitoringActions(crisisId: string): string[] {
    return [
      'Continue automated monitoring',
      'Review hourly metrics',
      'Alert if thresholds exceeded',
      'Prepare response options',
      'Maintain stakeholder awareness'
    ];
  }

  private async predictCrisisCascade(crisisId: string, scenarioDepth: number = 3, probabilityThreshold: number = 0.1) {
    const cascades = [];
    const signal = await this.getCrisisSignal(crisisId);
    
    if (!signal) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Crisis signal not found' })
        }]
      };
    }

    // Generate cascade scenarios
    for (let depth = 1; depth <= scenarioDepth; depth++) {
      const scenarios = this.generateCascadeScenarios(signal, depth);
      cascades.push(...scenarios.filter(s => s.probability >= probabilityThreshold));
    }

    const prediction = {
      crisis_id: crisisId,
      cascade_scenarios: cascades.sort((a, b) => b.probability - a.probability),
      total_scenarios: cascades.length,
      high_probability: cascades.filter(c => c.probability > 0.7).length,
      prevention_strategies: this.generatePreventionStrategies(cascades),
      monitoring_priorities: this.identifyMonitoringPriorities(cascades)
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(prediction, null, 2)
      }]
    };
  }

  private generateCascadeScenarios(signal: CrisisSignal, depth: number): any[] {
    const scenarios = [];
    const cascadeTypes = ['regulatory_action', 'media_investigation', 'customer_backlash', 'investor_concern', 'partner_withdrawal'];
    
    for (const cascadeType of cascadeTypes) {
      const scenario = {
        cascade_type: cascadeType,
        depth_level: depth,
        probability: Math.max(0.1, 0.9 - (depth * 0.2) - Math.random() * 0.3),
        timeline: this.estimateCascadeTimeline(cascadeType, depth),
        impact_entities: this.identifyAffectedEntities(signal, cascadeType),
        severity_increase: this.calculateSeverityIncrease(cascadeType, depth),
        mitigation_options: this.suggestMitigation(cascadeType)
      };
      scenarios.push(scenario);
    }
    
    return scenarios;
  }

  private estimateCascadeTimeline(cascadeType: string, depth: number): string {
    const baseHours = {
      regulatory_action: 24,
      media_investigation: 12,
      customer_backlash: 6,
      investor_concern: 8,
      partner_withdrawal: 48
    };
    
    const hours = (baseHours[cascadeType as keyof typeof baseHours] || 12) * depth;
    return `${hours} hours`;
  }

  private identifyAffectedEntities(signal: CrisisSignal, cascadeType: string): string[] {
    const baseEntities = [...signal.entities_affected];
    
    if (cascadeType === 'regulatory_action') {
      baseEntities.push('regulatory_bodies', 'compliance_teams');
    } else if (cascadeType === 'media_investigation') {
      baseEntities.push('journalists', 'news_outlets');
    }
    
    return baseEntities;
  }

  private calculateSeverityIncrease(cascadeType: string, depth: number): string {
    const increases = ['none', 'minor', 'moderate', 'significant', 'severe'];
    const index = Math.min(increases.length - 1, depth - 1);
    return increases[index];
  }

  private suggestMitigation(cascadeType: string): string[] {
    const strategies: Record<string, string[]> = {
      regulatory_action: ['Proactive compliance review', 'Engage regulatory counsel', 'Prepare filing responses'],
      media_investigation: ['Media outreach', 'Prepare fact sheets', 'Designate spokesperson'],
      customer_backlash: ['Customer communication plan', 'Service recovery', 'Social media monitoring'],
      investor_concern: ['Investor relations communication', 'Financial impact assessment', 'Analyst briefings'],
      partner_withdrawal: ['Partner engagement', 'Contract review', 'Alternative partnerships']
    };
    
    return strategies[cascadeType] || ['Monitor situation', 'Prepare response'];
  }

  private generatePreventionStrategies(cascades: any[]): string[] {
    const strategies = new Set<string>();
    
    for (const cascade of cascades) {
      if (cascade.probability > 0.5) {
        strategies.add(`Prevent ${cascade.cascade_type}`);
        cascade.mitigation_options.forEach((option: string) => strategies.add(option));
      }
    }
    
    return Array.from(strategies);
  }

  private identifyMonitoringPriorities(cascades: any[]): string[] {
    return cascades
      .filter(c => c.probability > 0.4)
      .map(c => c.cascade_type)
      .slice(0, 5);
  }

  private async generateHoldingStatement(crisisId: string, tone: string = 'formal', channels?: string[], keyMessages?: string[]) {
    const signal = await this.getCrisisSignal(crisisId);
    if (!signal) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: 'Crisis signal not found' })
        }]
      };
    }

    const statement = {
      crisis_id: crisisId,
      statement_type: 'holding',
      tone,
      channels: channels || ['website', 'media'],
      key_messages: keyMessages || ['acknowledgment', 'investigation', 'commitment'],
      content: this.craftHoldingStatement(signal, tone, keyMessages),
      approval_status: 'pending',
      release_timeline: 'immediate',
      contact_info: {
        media: 'media@company.com',
        general: 'info@company.com'
      },
      legal_review: this.requiresLegalReview(signal.signal_type),
      distribution_plan: this.createDistributionPlan(channels || ['website', 'media'])
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(statement, null, 2)
      }]
    };
  }

  private craftHoldingStatement(signal: CrisisSignal, tone: string, keyMessages?: string[]): string {
    const toneTemplates = {
      formal: {
        opening: "We are aware of",
        investigation: "We are conducting a thorough review",
        commitment: "We remain committed to",
        closing: "We will provide updates as appropriate."
      },
      empathetic: {
        opening: "We understand the concerns regarding",
        investigation: "We are taking this matter seriously and investigating",
        commitment: "We care deeply about",
        closing: "We appreciate your patience as we work to address this situation."
      },
      authoritative: {
        opening: "We have been informed of",
        investigation: "We are immediately investigating",
        commitment: "We maintain our commitment to",
        closing: "We will take appropriate action based on our findings."
      },
      apologetic: {
        opening: "We sincerely apologize for",
        investigation: "We are working diligently to understand",
        commitment: "We are committed to making this right and",
        closing: "We will take all necessary steps to prevent this in the future."
      }
    };

    const template = toneTemplates[tone as keyof typeof toneTemplates] || toneTemplates.formal;
    
    return `${template.opening} ${signal.content.toLowerCase()}. ${template.investigation} the circumstances. ${template.commitment} transparency and accountability. ${template.closing}`;
  }

  private requiresLegalReview(signalType: string): boolean {
    return signalType === 'regulatory' || signalType === 'operational';
  }

  private createDistributionPlan(channels: string[]): any {
    return {
      primary_channels: channels,
      timing: {
        internal: 'immediate',
        external: 'within_1_hour',
        social_media: 'within_2_hours'
      },
      approval_sequence: ['legal', 'executive', 'communications'],
      fallback_channels: ['email', 'direct_communication']
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SignalDesk Crisis MCP started');
  }
}

const mcp = new SignalDeskCrisisMCP();
mcp.start().catch(console.error);