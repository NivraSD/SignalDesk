// NIV Strategic Pipeline Type Definitions

// ============================================
// 1. NIV Discovery Context
// ============================================
export interface NivDiscoveryContext {
  // Organization Profile
  organization: {
    id: string
    name: string
    industry: string
    subIndustry?: string
    positioning: string
    strengths: string[]
    vulnerabilities: string[]
    currentNarratives: string[]
  }

  // Competitive Landscape
  competitors: {
    direct: CompetitorProfile[]
    indirect: CompetitorProfile[]
    emerging: CompetitorProfile[]
  }

  // Market Environment
  market: {
    trends: MarketTrend[]
    opportunities: MarketOpportunity[]
    threats: MarketThreat[]
    regulatory: RegulatoryItem[]
  }

  // Strategic Assets
  assets: {
    narratives: string[]
    keyMessages: string[]
    channels: ChannelAsset[]
    stakeholders: StakeholderGroup[]
    mediaRelationships: MediaRelationship[]
  }

  // Historical Context
  history: {
    recentCampaigns: CampaignHistory[]
    successPatterns: SuccessPattern[]
    lessonsLearned: Lesson[]
    crisisHistory?: CrisisEvent[]
  }

  // Session Context
  session: {
    conversationId: string
    userIntent: string
    previousDecisions: Decision[]
    constraints: Constraint[]
    timestamp: string
  }
}

// ============================================
// 2. NIV Strategic Framework
// ============================================
export interface NivStrategicFramework {
  // Discovery context flows through
  discoveryContext: NivDiscoveryContext

  // Strategic Core
  strategy: {
    objective: string
    rationale: string
    successMetrics: Metric[]
    risks: Risk[]
    assumptions: string[]
    timeHorizon: 'immediate' | 'short-term' | 'long-term'
  }

  // Narrative Architecture
  narrative: {
    coreStory: string
    supportingMessages: Message[]
    proofPoints: ProofPoint[]
    positioning: PositionStatement
    toneAndVoice: ToneGuideline
  }

  // Execution Blueprint
  execution: {
    channels: {
      primary: ChannelStrategy[]
      secondary: ChannelStrategy[]
    }
    timeline: {
      phases: Phase[]
      milestones: Milestone[]
      dependencies: Dependency[]
    }
    resources: {
      required: Resource[]
      optional: Resource[]
      budget?: BudgetItem[]
    }
  }

  // Intelligence Support
  intelligence: {
    competitorMoves: CompetitorAction[]
    marketSignals: MarketSignal[]
    timingConsiderations: TimingFactor[]
    opportunities: OpportunityWindow[]
  }

  // Handoff Instructions
  handoff: {
    targetComponent: 'campaign' | 'plan' | 'execute' | 'opportunity'
    executionType: string
    priority: 'urgent' | 'high' | 'normal' | 'low'
    specialInstructions: string[]
    expectedOutcomes: string[]
  }
}

// ============================================
// 3. Component Handoff Protocol
// ============================================
export interface ComponentHandoff {
  // Source tracking
  source: {
    component: 'niv'
    sessionId: string
    timestamp: string
    version: string
  }

  // Full context preservation
  context: {
    discovery: NivDiscoveryContext
    framework: NivStrategicFramework
    orchestration?: OrchestrationResult
  }

  // Component-specific payload
  payload: {
    // For Campaign Intelligence
    campaign?: {
      brief: string
      category: string
      type: string
      timeline: Timeline
      assets: Asset[]
      stakeholders: StakeholderGroup[]
      budget?: number
    }

    // For Plan component
    project?: {
      name: string
      phases: Phase[]
      tasks: Task[]
      milestones: Milestone[]
      dependencies: Dependency[]
      resources: Resource[]
    }

    // For Execute component
    content?: {
      pieces: ContentPiece[]
      calendar: ContentCalendar
      templates: Template[]
      guidelines: Guideline[]
      approvalFlow?: ApprovalFlow
    }

    // For Opportunity Engine
    opportunity?: {
      window: OpportunityWindow
      trigger: Trigger
      response: ResponsePlan
      timeline: Timeline
      successCriteria: SuccessCriteria[]
    }
  }

  // Execution instructions
  instructions: {
    immediate: string[]
    scheduled: ScheduledInstruction[]
    conditional: ConditionalInstruction[]
  }

  // Tracking and feedback
  tracking: {
    expectedOutcomes: Outcome[]
    successMetrics: Metric[]
    feedbackLoop: string
    reportingCadence: string
  }
}

// ============================================
// Supporting Type Definitions
// ============================================

export interface CompetitorProfile {
  id: string
  name: string
  type: 'direct' | 'indirect' | 'emerging'
  recentMoves: string[]
  strengths: string[]
  weaknesses: string[]
  marketPosition: string
  narratives: string[]
}

export interface MarketTrend {
  id: string
  name: string
  direction: 'rising' | 'stable' | 'declining'
  impact: 'high' | 'medium' | 'low'
  relevance: number // 0-1
  timeframe: string
}

export interface MarketOpportunity {
  id: string
  title: string
  description: string
  window: string
  requirements: string[]
  potentialImpact: 'transformative' | 'significant' | 'moderate' | 'minor'
}

export interface MarketThreat {
  id: string
  name: string
  probability: number // 0-1
  impact: 'critical' | 'high' | 'medium' | 'low'
  timeframe: string
  mitigation?: string
}

export interface RegulatoryItem {
  id: string
  name: string
  status: 'proposed' | 'pending' | 'active' | 'enforcement'
  relevance: 'direct' | 'indirect'
  complianceRequired: boolean
  deadline?: string
}

export interface ChannelAsset {
  id: string
  name: string
  type: 'owned' | 'earned' | 'paid' | 'shared'
  reach: number
  engagement: number
  effectiveness: number // 0-1
}

export interface StakeholderGroup {
  id: string
  name: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  currentSentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  influence: number // 0-1
  concerns: string[]
  priorities: string[]
}

export interface MediaRelationship {
  id: string
  outlet: string
  journalist?: string
  beat: string
  relationship: 'strong' | 'developing' | 'neutral' | 'challenging'
  lastInteraction?: string
  topics: string[]
}

export interface CampaignHistory {
  id: string
  name: string
  date: string
  type: string
  outcome: 'successful' | 'mixed' | 'unsuccessful'
  keyLearnings: string[]
  metrics?: Record<string, any>
}

export interface SuccessPattern {
  id: string
  pattern: string
  context: string
  frequency: number
  reliability: number // 0-1
}

export interface Lesson {
  id: string
  lesson: string
  context: string
  category: string
  applicability: string[]
}

export interface CrisisEvent {
  id: string
  date: string
  type: string
  severity: 'critical' | 'major' | 'moderate' | 'minor'
  response: string
  outcome: string
  learnings: string[]
}

export interface Decision {
  id: string
  decision: string
  rationale: string
  timestamp: string
  outcome?: string
}

export interface Constraint {
  id: string
  type: 'budget' | 'timeline' | 'resource' | 'policy' | 'legal' | 'other'
  description: string
  impact: string
}

export interface Metric {
  id: string
  name: string
  target: number | string
  current?: number | string
  unit: string
  trackingMethod: string
}

export interface Risk {
  id: string
  description: string
  probability: 'high' | 'medium' | 'low'
  impact: 'critical' | 'major' | 'moderate' | 'minor'
  mitigation: string
  owner?: string
}

export interface Message {
  id: string
  text: string
  audience: string[]
  priority: number
  supportingEvidence: string[]
}

export interface ProofPoint {
  id: string
  claim: string
  evidence: string
  source: string
  strength: 'strong' | 'moderate' | 'developing'
}

export interface PositionStatement {
  statement: string
  differentiators: string[]
  comparison?: string
}

export interface ToneGuideline {
  overall: string
  doList: string[]
  dontList: string[]
  examples?: string[]
}

export interface ChannelStrategy {
  channel: string
  purpose: string
  content: string[]
  frequency: string
  owner?: string
  budget?: number
}

export interface Phase {
  id: string
  name: string
  startDate: string
  endDate: string
  objectives: string[]
  deliverables: string[]
  tasks?: Task[]
}

export interface Milestone {
  id: string
  name: string
  date: string
  criteria: string[]
  dependencies?: string[]
}

export interface Dependency {
  id: string
  from: string
  to: string
  type: 'blocks' | 'informs' | 'requires'
  description?: string
}

export interface Resource {
  id: string
  type: 'human' | 'financial' | 'technical' | 'vendor'
  name: string
  quantity: number | string
  availability: string
  cost?: number
}

export interface BudgetItem {
  category: string
  amount: number
  justification: string
  flexibility: 'fixed' | 'flexible' | 'optional'
}

export interface CompetitorAction {
  competitorId: string
  competitorName: string
  action: string
  date: string
  significance: 'major' | 'moderate' | 'minor'
  response?: string
}

export interface MarketSignal {
  signal: string
  source: string
  strength: 'strong' | 'moderate' | 'weak'
  interpretation: string
  actionRequired: boolean
}

export interface TimingFactor {
  factor: string
  optimal: string
  avoid: string
  rationale: string
}

export interface OpportunityWindow {
  opportunity: string
  openDate: string
  closeDate: string
  requirements: string[]
  potentialReturn: string
}

export interface OrchestrationResult {
  plans: any[]
  synthesis: string
  recommendations: string[]
  nextSteps: string[]
}

export interface Timeline {
  start: string
  end: string
  phases: Phase[]
  criticalPath?: string[]
}

export interface Asset {
  id: string
  type: string
  name: string
  status: 'ready' | 'in-progress' | 'planned'
  location?: string
}

export interface Task {
  id: string
  name: string
  description: string
  assignee?: string
  dueDate: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  dependencies?: string[]
}

export interface ContentPiece {
  id: string
  type: string
  title: string
  status: 'draft' | 'review' | 'approved' | 'published'
  dueDate: string
  owner: string
  channels: string[]
}

export interface ContentCalendar {
  startDate: string
  endDate: string
  items: ContentCalendarItem[]
}

export interface ContentCalendarItem {
  date: string
  content: ContentPiece[]
  notes?: string
}

export interface Template {
  id: string
  name: string
  type: string
  structure: any
  guidelines: string[]
}

export interface Guideline {
  category: string
  rules: string[]
  examples?: string[]
}

export interface ApprovalFlow {
  steps: ApprovalStep[]
  currentStep?: number
  deadline?: string
}

export interface ApprovalStep {
  name: string
  approver: string
  status: 'pending' | 'approved' | 'rejected' | 'skipped'
  comments?: string
}

export interface Trigger {
  type: 'event' | 'date' | 'metric' | 'signal'
  condition: string
  detected: boolean
  timestamp?: string
}

export interface ResponsePlan {
  actions: string[]
  sequence: 'parallel' | 'sequential'
  timeframe: string
  resources: Resource[]
}

export interface SuccessCriteria {
  criterion: string
  measurement: string
  threshold: number | string
  timeframe: string
}

export interface ScheduledInstruction {
  instruction: string
  executeAt: string
  conditions?: string[]
}

export interface ConditionalInstruction {
  instruction: string
  condition: string
  fallback?: string
}

export interface Outcome {
  description: string
  probability: number // 0-1
  impact: string
  measurement: string
}

// ============================================
// State Management
// ============================================
export interface NivGlobalState {
  // Current strategic framework
  activeFramework: NivStrategicFramework | null

  // Component-specific outputs
  outputs: {
    campaign?: any
    plan?: any
    content?: any
    opportunity?: any
  }

  // Display preferences
  display: {
    showNivInsights: boolean
    autoPopulate: boolean
    preserveContext: boolean
  }

  // Session tracking
  session: {
    conversationId: string
    organizationId: string
    lastUpdate: Date
  }
}