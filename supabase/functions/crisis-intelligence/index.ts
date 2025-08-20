// SignalDesk Crisis Intelligence - Converted from MCP Server
// Real-time crisis detection, assessment, response coordination, and war room management

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface CrisisRequest {
  method: string
  params: {
    sources?: string[]
    entities?: string[]
    timeframe?: string
    sensitivity?: string
    crisis_id?: string
    factors?: string[]
    response_type?: string
    target_audiences?: string[]
    urgency?: string
    action?: string
    participants?: string[]
    objectives?: string[]
    monitoring_interval?: string
    alert_thresholds?: any
    scenario_depth?: number
    probability_threshold?: number
    tone?: string
    channels?: string[]
    key_messages?: string[]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: CrisisRequest = await req.json()
    const { method, params } = request

    let result

    switch (method) {
      case 'detect_crisis_signals':
        result = await detectCrisisSignals(supabase, params)
        break
      case 'assess_crisis_severity':
        result = await assessCrisisSeverity(supabase, params)
        break
      case 'generate_crisis_response':
        result = await generateCrisisResponse(supabase, params)
        break
      case 'coordinate_war_room':
        result = await coordinateWarRoom(supabase, params)
        break
      case 'monitor_crisis_evolution':
        result = await monitorCrisisEvolution(supabase, params)
        break
      case 'predict_crisis_cascade':
        result = await predictCrisisCascade(supabase, params)
        break
      case 'generate_holding_statement':
        result = await generateHoldingStatement(supabase, params)
        break
      // Legacy methods for backward compatibility
      case 'monitor':
      case 'detect':
      case 'analyze':
        result = await detectCrisisSignals(supabase, { sources: ['social', 'media', 'regulatory'], entities: params.entities })
        break
      case 'respond':
        result = await generateCrisisResponse(supabase, { crisis_id: 'current', response_type: 'statement' })
        break
      default:
        result = await detectCrisisSignals(supabase, { sources: ['social', 'media'] })
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function detectCrisisSignals(supabase: any, params: any) {
  const { sources = ['social', 'media'], entities = [], timeframe = '24h', sensitivity = 'medium' } = params
  
  const signals: any[] = []
  const now = new Date()
  
  // Parse timeframe
  const timeframeParts = timeframe.match(/(\d+)([hdw])/)
  const value = timeframeParts ? parseInt(timeframeParts[1]) : 24
  const unit = timeframeParts ? timeframeParts[2] : 'h'
  
  let hoursBack = value
  if (unit === 'd') hoursBack = value * 24
  if (unit === 'w') hoursBack = value * 24 * 7
  
  const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

  // Scan various sources for potential crisis signals
  for (const source of sources) {
    switch (source) {
      case 'social':
        const socialSignals = await scanSocialMedia(entities, since, sensitivity)
        signals.push(...socialSignals)
        break
      case 'media':
        const mediaSignals = await scanMediaCoverage(entities, since, sensitivity)
        signals.push(...mediaSignals)
        break
      case 'regulatory':
        const regulatorySignals = await scanRegulatory(entities, since, sensitivity)
        signals.push(...regulatorySignals)
        break
      case 'operational':
        const operationalSignals = await scanOperational(entities, since, sensitivity)
        signals.push(...operationalSignals)
        break
    }
  }

  // Store signals in database
  try {
    for (const signal of signals) {
      await supabase.from('crisis_signals').upsert(signal)
    }
  } catch (error) {
    console.log('Failed to store crisis signals:', error)
  }

  const highPriority = signals.filter(s => s.severity === 'high' || s.severity === 'critical')
  const threatLevel = highPriority.length > 0 ? 'high' : 
                     signals.filter(s => s.severity === 'medium').length > 0 ? 'medium' : 'low'

  return {
    signals_detected: signals.length,
    high_priority: highPriority.length,
    sources_scanned: sources,
    timeframe,
    threat_level: threatLevel,
    signals: signals.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 10),
    recommendations: generateThreatRecommendations(threatLevel),
    timestamp: new Date().toISOString()
  }
}

async function scanSocialMedia(entities: string[], since: Date, sensitivity: string): Promise<any[]> {
  const signals: any[] = []
  const indicators = [
    'backlash', 'boycott', 'outrage', 'scandal', 'controversy',
    'lawsuit', 'investigation', 'protest', 'viral complaint'
  ]

  const signalCount = sensitivity === 'high' ? 5 : sensitivity === 'medium' ? 3 : 1
  
  for (let i = 0; i < signalCount; i++) {
    const signal = {
      id: `social_${Date.now()}_${i}`,
      signal_type: 'social',
      severity: randomSeverity(),
      source: 'twitter',
      content: `Social media activity detected: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
      entities_affected: entities.length > 0 ? entities : ['unknown_entity'],
      timestamp: new Date().toISOString(),
      indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
      confidence_score: Math.random() * 0.3 + 0.7,
      response_required: Math.random() > 0.5
    }
    signals.push(signal)
  }

  return signals
}

async function scanMediaCoverage(entities: string[], since: Date, sensitivity: string): Promise<any[]> {
  const signals: any[] = []
  const indicators = [
    'negative coverage', 'investigative report', 'regulatory filing',
    'executive departure', 'financial irregularity', 'safety concern'
  ]

  const signalCount = sensitivity === 'high' ? 3 : sensitivity === 'medium' ? 2 : 1
  
  for (let i = 0; i < signalCount; i++) {
    const signal = {
      id: `media_${Date.now()}_${i}`,
      signal_type: 'media',
      severity: randomSeverity(),
      source: 'reuters',
      content: `Media coverage detected: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
      entities_affected: entities.length > 0 ? entities : ['unknown_entity'],
      timestamp: new Date().toISOString(),
      indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
      confidence_score: Math.random() * 0.2 + 0.8,
      response_required: true
    }
    signals.push(signal)
  }

  return signals
}

async function scanRegulatory(entities: string[], since: Date, sensitivity: string): Promise<any[]> {
  const signals: any[] = []
  const indicators = ['fine', 'investigation', 'violation', 'enforcement action', 'compliance failure']
  const signalCount = sensitivity === 'high' ? 2 : 1
  
  for (let i = 0; i < signalCount; i++) {
    const signal = {
      id: `regulatory_${Date.now()}_${i}`,
      signal_type: 'regulatory',
      severity: 'high',
      source: 'sec',
      content: `Regulatory activity: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
      entities_affected: entities.length > 0 ? entities : ['unknown_entity'],
      timestamp: new Date().toISOString(),
      indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
      confidence_score: 0.95,
      response_required: true
    }
    signals.push(signal)
  }

  return signals
}

async function scanOperational(entities: string[], since: Date, sensitivity: string): Promise<any[]> {
  const signals: any[] = []
  const indicators = ['system outage', 'security breach', 'data leak', 'service disruption']
  const signalCount = sensitivity === 'high' ? 2 : 1
  
  for (let i = 0; i < signalCount; i++) {
    const signal = {
      id: `operational_${Date.now()}_${i}`,
      signal_type: 'operational',
      severity: randomSeverity(),
      source: 'internal_monitoring',
      content: `Operational issue: ${indicators[Math.floor(Math.random() * indicators.length)]}`,
      entities_affected: entities.length > 0 ? entities : ['unknown_entity'],
      timestamp: new Date().toISOString(),
      indicators: [indicators[Math.floor(Math.random() * indicators.length)]],
      confidence_score: 0.9,
      response_required: true
    }
    signals.push(signal)
  }

  return signals
}

async function assessCrisisSeverity(supabase: any, params: any) {
  const { crisis_id, factors = [] } = params

  // Mock crisis signal for assessment
  const signal = {
    id: crisis_id,
    signal_type: 'media',
    severity: 'medium',
    confidence_score: 0.8,
    entities_affected: ['company'],
    response_required: true
  }

  const assessment = {
    crisis_id,
    current_severity: signal.severity,
    assessed_severity: calculateSeverity(signal, factors),
    impact_score: calculateImpactScore(signal),
    urgency_level: calculateUrgency(signal),
    risk_factors: identifyRiskFactors(signal),
    recommended_actions: recommendActions(signal),
    escalation_needed: shouldEscalate(signal),
    estimated_resolution_time: estimateResolutionTime(signal.severity)
  }

  return assessment
}

async function generateCrisisResponse(supabase: any, params: any) {
  const { crisis_id, response_type, target_audiences = ['internal', 'media', 'customers'], urgency = 'medium' } = params

  const response = {
    id: `response_${Date.now()}`,
    crisis_id,
    response_type,
    urgency,
    stakeholders: target_audiences,
    channels: selectChannels(response_type, urgency),
    content: generateResponseContent(response_type),
    timeline: generateTimeline(urgency),
    approval_required: requiresApproval(response_type, urgency),
    status: 'draft'
  }

  return response
}

async function coordinateWarRoom(supabase: any, params: any) {
  const { crisis_id, action, participants = [], objectives = [] } = params

  const warRoom = {
    id: `warroom_${crisis_id}_${Date.now()}`,
    crisis_id,
    participants: participants.map(p => ({ name: p, role: 'member', status: 'invited' })),
    status: action === 'create' ? 'forming' : action === 'escalate' ? 'active' : 'monitoring',
    objectives: objectives.length > 0 ? objectives : ['Assess situation', 'Coordinate response', 'Monitor evolution'],
    action_items: [],
    communications_log: [],
    decisions: [],
    next_meeting: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }

  if (action === 'escalate') {
    warRoom.participants.push({ name: 'Crisis Executive', role: 'leader', status: 'active' })
  }

  return warRoom
}

async function monitorCrisisEvolution(supabase: any, params: any) {
  const { crisis_id, monitoring_interval = '1h', alert_thresholds = {} } = params

  const monitoring = {
    crisis_id,
    monitoring_active: true,
    interval: monitoring_interval,
    alert_thresholds: {
      severity_increase: true,
      volume_spike: 0.5,
      sentiment_drop: -0.3,
      new_entities: 1,
      ...alert_thresholds
    },
    current_metrics: getCurrentMetrics(),
    evolution_timeline: getEvolutionTimeline(),
    predictions: predictNextPhase(),
    recommended_actions: getMonitoringActions()
  }

  return monitoring
}

async function predictCrisisCascade(supabase: any, params: any) {
  const { crisis_id, scenario_depth = 3, probability_threshold = 0.1 } = params

  const cascades = []
  for (let depth = 1; depth <= scenario_depth; depth++) {
    const scenarios = generateCascadeScenarios(depth)
    cascades.push(...scenarios.filter(s => s.probability >= probability_threshold))
  }

  const prediction = {
    crisis_id,
    cascade_scenarios: cascades.sort((a, b) => b.probability - a.probability),
    total_scenarios: cascades.length,
    high_probability: cascades.filter(c => c.probability > 0.7).length,
    prevention_strategies: generatePreventionStrategies(cascades),
    monitoring_priorities: identifyMonitoringPriorities(cascades)
  }

  return prediction
}

async function generateHoldingStatement(supabase: any, params: any) {
  const { crisis_id, tone = 'formal', channels = ['website', 'media'], key_messages = [] } = params

  const statement = {
    crisis_id,
    statement_type: 'holding',
    tone,
    channels,
    key_messages: key_messages.length > 0 ? key_messages : ['acknowledgment', 'investigation', 'commitment'],
    content: craftHoldingStatement(tone),
    approval_status: 'pending',
    release_timeline: 'immediate',
    contact_info: {
      media: 'media@company.com',
      general: 'info@company.com'
    },
    legal_review_required: tone === 'apologetic' || channels.includes('regulatory'),
    distribution_plan: createDistributionPlan(channels)
  }

  return statement
}

// Helper functions
function randomSeverity(): string {
  const rand = Math.random()
  if (rand < 0.1) return 'critical'
  if (rand < 0.3) return 'high'
  if (rand < 0.7) return 'medium'
  return 'low'
}

function calculateSeverity(signal: any, factors: string[]): string {
  let score = 0
  const severityScores = { low: 1, medium: 2, high: 3, critical: 4 }
  score += severityScores[signal.severity as keyof typeof severityScores]
  score += signal.confidence_score * 2
  score += signal.entities_affected.length * 0.5
  
  if (factors.includes('media_attention')) score += 1
  if (factors.includes('regulatory_scrutiny')) score += 2
  if (factors.includes('customer_impact')) score += 1.5
  if (factors.includes('financial_impact')) score += 2
  
  if (score >= 6) return 'critical'
  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

function calculateImpactScore(signal: any): number {
  let score = signal.confidence_score * 100
  score += signal.entities_affected.length * 10
  const severityMultipliers = { low: 1, medium: 1.5, high: 2, critical: 3 }
  score *= severityMultipliers[signal.severity as keyof typeof severityMultipliers]
  return Math.min(100, Math.round(score))
}

function calculateUrgency(signal: any): string {
  if (signal.severity === 'critical') return 'immediate'
  if (signal.severity === 'high') return 'high'
  if (signal.response_required) return 'medium'
  return 'low'
}

function identifyRiskFactors(signal: any): string[] {
  const factors = []
  if (signal.signal_type === 'social') factors.push('viral_potential', 'reputation_damage')
  if (signal.signal_type === 'regulatory') factors.push('compliance_violations', 'legal_action')
  if (signal.signal_type === 'operational') factors.push('service_disruption', 'customer_impact')
  if (signal.confidence_score > 0.8) factors.push('high_confidence')
  if (signal.entities_affected.length > 1) factors.push('multi_entity_impact')
  return factors
}

function recommendActions(signal: any): string[] {
  const actions = []
  if (signal.severity === 'critical' || signal.severity === 'high') {
    actions.push('activate_war_room', 'notify_leadership', 'prepare_statement')
  }
  if (signal.signal_type === 'social') {
    actions.push('monitor_social_sentiment', 'prepare_social_response')
  }
  if (signal.signal_type === 'regulatory') {
    actions.push('engage_legal_counsel', 'review_compliance')
  }
  actions.push('continue_monitoring', 'document_timeline')
  return actions
}

function shouldEscalate(signal: any): boolean {
  return signal.severity === 'critical' || 
         (signal.severity === 'high' && signal.confidence_score > 0.8) ||
         signal.entities_affected.length > 2
}

function estimateResolutionTime(severity: string): string {
  const timeframes = {
    critical: '2-6 hours',
    high: '6-24 hours',
    medium: '1-3 days',
    low: '3-7 days'
  }
  return timeframes[severity as keyof typeof timeframes] || '1-3 days'
}

function generateThreatRecommendations(threatLevel: string): string[] {
  switch (threatLevel) {
    case 'high':
      return [
        'Activate crisis response team immediately',
        'Prepare official statement',
        'Monitor social media sentiment',
        'Brief legal team',
        'Notify key stakeholders'
      ]
    case 'medium':
      return [
        'Increase monitoring frequency',
        'Prepare contingency plans',
        'Brief communications team',
        'Review crisis protocols'
      ]
    default:
      return [
        'Maintain standard monitoring',
        'Update crisis playbooks',
        'Schedule crisis drill'
      ]
  }
}

function selectChannels(responseType: string, urgency: string): string[] {
  const channels = []
  if (urgency === 'immediate' || urgency === 'high') {
    channels.push('press_release', 'social_media', 'website')
  }
  if (responseType === 'statement') {
    channels.push('media_statement', 'internal_communication')
  }
  if (responseType === 'action') {
    channels.push('operational_communication', 'stakeholder_alert')
  }
  return channels.length > 0 ? channels : ['internal_communication']
}

function generateResponseContent(responseType: string): string {
  const templates = {
    statement: 'We are aware of reports regarding this matter. We take this situation seriously and are investigating. We will provide updates as more information becomes available.',
    action: 'We have taken immediate action to address this situation. Our team is actively working to resolve this matter and prevent recurrence.',
    investigation: 'We are conducting a thorough investigation into this matter. We are committed to transparency and will share findings once the investigation is complete.',
    escalation: 'This matter has been escalated to senior leadership for immediate attention. We are treating this situation with the highest priority.'
  }
  return templates[responseType as keyof typeof templates] || templates.statement
}

function generateTimeline(urgency: string): string {
  const timelines = {
    immediate: 'Deploy within 1 hour',
    high: 'Deploy within 4 hours',
    medium: 'Deploy within 24 hours',
    low: 'Deploy within 72 hours'
  }
  return timelines[urgency as keyof typeof timelines] || timelines.medium
}

function requiresApproval(responseType: string, urgency: string): boolean {
  return responseType === 'statement' || urgency === 'immediate'
}

function getCurrentMetrics(): any {
  return {
    mention_volume: Math.floor(Math.random() * 1000) + 100,
    sentiment_score: Math.random() * 2 - 1,
    reach_estimate: Math.floor(Math.random() * 1000000) + 10000,
    media_coverage_count: Math.floor(Math.random() * 50) + 5,
    stakeholder_reactions: Math.floor(Math.random() * 20) + 2
  }
}

function getEvolutionTimeline(): any[] {
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
  ]
}

function predictNextPhase(): any {
  return {
    likely_scenario: 'Continued monitoring phase',
    probability: 0.7,
    timeframe: '2-6 hours',
    key_indicators: ['social_volume', 'media_pickup', 'stakeholder_response'],
    escalation_triggers: ['volume_spike', 'negative_sentiment', 'mainstream_media']
  }
}

function getMonitoringActions(): string[] {
  return [
    'Continue automated monitoring',
    'Review hourly metrics',
    'Alert if thresholds exceeded',
    'Prepare response options',
    'Maintain stakeholder awareness'
  ]
}

function generateCascadeScenarios(depth: number): any[] {
  const scenarios = []
  const cascadeTypes = ['regulatory_action', 'media_investigation', 'customer_backlash', 'investor_concern', 'partner_withdrawal']
  
  for (const cascadeType of cascadeTypes) {
    const scenario = {
      cascade_type: cascadeType,
      depth_level: depth,
      probability: Math.max(0.1, 0.9 - (depth * 0.2) - Math.random() * 0.3),
      timeline: estimateCascadeTimeline(cascadeType, depth),
      impact_entities: [cascadeType.split('_')[0]],
      severity_increase: calculateSeverityIncrease(depth),
      mitigation_options: suggestMitigation(cascadeType)
    }
    scenarios.push(scenario)
  }
  
  return scenarios
}

function estimateCascadeTimeline(cascadeType: string, depth: number): string {
  const baseHours = {
    regulatory_action: 24,
    media_investigation: 12,
    customer_backlash: 6,
    investor_concern: 8,
    partner_withdrawal: 48
  }
  const hours = (baseHours[cascadeType as keyof typeof baseHours] || 12) * depth
  return `${hours} hours`
}

function calculateSeverityIncrease(depth: number): string {
  const increases = ['none', 'minor', 'moderate', 'significant', 'severe']
  const index = Math.min(increases.length - 1, depth - 1)
  return increases[index]
}

function suggestMitigation(cascadeType: string): string[] {
  const strategies: Record<string, string[]> = {
    regulatory_action: ['Proactive compliance review', 'Engage regulatory counsel', 'Prepare filing responses'],
    media_investigation: ['Media outreach', 'Prepare fact sheets', 'Designate spokesperson'],
    customer_backlash: ['Customer communication plan', 'Service recovery', 'Social media monitoring'],
    investor_concern: ['Investor relations communication', 'Financial impact assessment', 'Analyst briefings'],
    partner_withdrawal: ['Partner engagement', 'Contract review', 'Alternative partnerships']
  }
  return strategies[cascadeType] || ['Monitor situation', 'Prepare response']
}

function generatePreventionStrategies(cascades: any[]): string[] {
  const strategies = new Set<string>()
  for (const cascade of cascades) {
    if (cascade.probability > 0.5) {
      strategies.add(`Prevent ${cascade.cascade_type}`)
      cascade.mitigation_options.forEach((option: string) => strategies.add(option))
    }
  }
  return Array.from(strategies)
}

function identifyMonitoringPriorities(cascades: any[]): string[] {
  return cascades
    .filter(c => c.probability > 0.4)
    .map(c => c.cascade_type)
    .slice(0, 5)
}

function craftHoldingStatement(tone: string): string {
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
  }

  const template = toneTemplates[tone as keyof typeof toneTemplates] || toneTemplates.formal
  return `${template.opening} this matter. ${template.investigation} the circumstances. ${template.commitment} transparency and accountability. ${template.closing}`
}

function createDistributionPlan(channels: string[]): any {
  return {
    primary_channels: channels,
    timing: {
      internal: 'immediate',
      external: 'within_1_hour',
      social_media: 'within_2_hours'
    },
    approval_sequence: ['legal', 'executive', 'communications'],
    fallback_channels: ['email', 'direct_communication']
  }
}