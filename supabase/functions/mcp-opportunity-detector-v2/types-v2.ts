// Opportunity Engine V2 Types
// Execution-ready opportunity format aligned with platform capabilities

export type ContentType =
  | 'media_pitch'
  | 'media_list'
  | 'social_post'
  | 'thought_leadership'
  | 'press_release'
  | 'blog_post'
  | 'image'
  | 'presentation'
  | 'email_campaign'
  | 'partnership_outreach'
  | 'user_action'

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'tiktok'

export type Urgency = 'immediate' | 'this_week' | 'this_month' | 'ongoing'

export interface ContentBrief {
  // Core content parameters
  angle: string
  key_points: string[]
  tone: string
  length: string
  cta: string

  // Optional metadata
  target_audience?: string
  visual_suggestions?: string[]
  data_to_include?: string[]
  examples?: string[]
}

export interface ContentItem {
  // Content type and targeting
  type: ContentType
  topic: string
  target?: string // For media_pitch: journalist/outlet, for social: audience segment
  platform?: SocialPlatform // For social_post

  // Detailed brief for generation
  brief: ContentBrief

  // Execution metadata
  urgency: Urgency
  estimated_effort?: string // "5 minutes", "1 hour", "1 day"
  dependencies?: string[] // IDs of other content items this depends on
}

export interface StakeholderCampaign {
  // Stakeholder identification
  stakeholder_name: string
  stakeholder_priority: 1 | 2 | 3 | 4
  stakeholder_description?: string

  // Influence lever
  lever_name: string
  lever_priority: 1 | 2 | 3 | 4
  lever_description?: string

  // Content to generate
  content_items: ContentItem[]
}

export interface ExecutionTimeline {
  immediate: string[] // Content items to do today/tomorrow
  this_week: string[] // Content items for this week
  this_month: string[] // Content items for this month
  ongoing: string[] // Recurring or long-term items
}

export interface SuccessMetric {
  metric: string
  target: string
  measurement_method?: string
  timeframe?: string
}

export interface ExecutionPlan {
  stakeholder_campaigns: StakeholderCampaign[]
  execution_timeline: ExecutionTimeline
  success_metrics: SuccessMetric[]
  total_content_items?: number
}

export interface MediaTargeting {
  // Journalist targeting guidance for when opportunity is executed
  primary_journalist_types: string[]  // e.g., "PR trade journalists", "tech journalists covering AI"
  target_industries: string[]  // e.g., ["public_relations"], ["technology", "healthcare"]
  target_outlets: string[]  // e.g., ["PRWeek", "PR News"], ["TechCrunch", "The Verge"]
  reasoning: string  // Why these journalists would care about this opportunity
  beat_keywords: string[]  // Keywords to filter journalists by beat (e.g., "PR tech", "enterprise software")
}

export interface StrategicContext {
  // What happened
  trigger_events: string[]
  market_dynamics: string

  // Why it matters
  why_now: string
  competitive_advantage: string

  // Timing
  time_window: string
  expiration_date?: string

  // Impact
  expected_impact: string
  risk_if_missed: string

  // Media targeting (for when user executes opportunity)
  media_targeting?: MediaTargeting
}

export interface PresentationData {
  gamma_url?: string
  slides_count?: number
  outline?: any
  generation_status?: 'pending' | 'generating' | 'generated' | 'failed'
  generation_error?: string
}

export interface OpportunityV2 {
  // Core identification
  opportunity_id?: string
  title: string
  description: string

  // Strategic analysis
  strategic_context: StrategicContext

  // Execution plan
  execution_plan: ExecutionPlan

  // Presentation
  presentation?: PresentationData

  // Scoring and metadata
  score: number
  urgency: 'high' | 'medium' | 'low'
  category: string
  confidence_factors: string[]

  // Execution tracking
  auto_executable: boolean
  executed?: boolean
  campaign_session_id?: string

  // Detection metadata
  detection_metadata: {
    detected_at: string
    trigger_events: string[]
    pattern_matched: string
    version: 2
  }
}

// Helper type for database storage
export interface OpportunityV2Database {
  id: string
  organization_id: string
  title: string
  description: string

  // V2 fields
  strategic_context: StrategicContext
  execution_plan: ExecutionPlan
  presentation_url?: string
  presentation_data?: PresentationData
  time_window: string
  expected_impact: string

  // Scoring
  score: number
  urgency: string
  category: string
  confidence_factors: string[]

  // Execution
  auto_executable: boolean
  executed: boolean
  campaign_session_id?: string

  // Metadata
  version: 2
  status: string
  created_at: string
  updated_at: string
}

// Helper functions
export function createContentBrief(params: {
  angle: string
  keyPoints: string[]
  tone: string
  length: string
  cta: string
}): ContentBrief {
  return {
    angle: params.angle,
    key_points: params.keyPoints,
    tone: params.tone,
    length: params.length,
    cta: params.cta
  }
}

export function estimateContentEffort(type: ContentType): string {
  const effortMap: Record<ContentType, string> = {
    media_pitch: '15 minutes',
    social_post: '5 minutes',
    thought_leadership: '2 hours',
    press_release: '1 hour',
    blog_post: '2 hours',
    image: '30 minutes',
    presentation: '2 hours',
    email_campaign: '1 hour',
    partnership_outreach: '1 hour',
    user_action: '30 minutes'
  }
  return effortMap[type] || '1 hour'
}

export function calculateTotalEffort(executionPlan: ExecutionPlan): string {
  const items = executionPlan.stakeholder_campaigns.flatMap(c => c.content_items)
  const totalMinutes = items.reduce((total, item) => {
    const effort = estimateContentEffort(item.type)
    const minutes = parseEffortToMinutes(effort)
    return total + minutes
  }, 0)

  if (totalMinutes < 60) return `${totalMinutes} minutes`
  if (totalMinutes < 480) return `${Math.round(totalMinutes / 60)} hours`
  return `${Math.round(totalMinutes / 480)} days`
}

function parseEffortToMinutes(effort: string): number {
  const match = effort.match(/(\d+)\s*(minute|hour|day)/)
  if (!match) return 60

  const value = parseInt(match[1])
  const unit = match[2]

  if (unit === 'minute') return value
  if (unit === 'hour') return value * 60
  if (unit === 'day') return value * 480
  return 60
}
