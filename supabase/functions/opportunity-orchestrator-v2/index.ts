import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withCors, jsonResponse, errorResponse } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Try both API key names like NIV does
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Action-oriented opportunity categories for one-click execution
type OpportunityCategory =
  // V4: Pattern-Based Opportunities (Total-Spectrum)
  | 'CASCADE_READY'      // Narrative void detected, multi-vector seed planting opportunity
  | 'VOID_WINDOW'        // Strategic silence moment approaching
  | 'MIRROR_CRISIS'      // Predictable crisis to pre-position against
  | 'TROJAN_VEHICLE'     // Desired vehicle found with message embedding opportunity
  | 'NETWORK_PATH'       // Indirect influence chain accessible
  // Traditional Opportunities (Keep for backward compatibility)
  | 'PRESS_RELEASE'      // Write & distribute press release
  | 'SOCIAL_CAMPAIGN'    // Launch social media campaign
  | 'EXECUTIVE_OUTREACH' // CEO/exec engagement needed
  | 'CRISIS_RESPONSE'    // Immediate crisis management
  | 'CONTENT_CREATION'   // Blog/article/video needed
  | 'PARTNERSHIP_PLAY'   // Strategic partnership opportunity
  | 'TALENT_MOVE'        // Hiring or poaching opportunity
  | 'MARKET_POSITION'    // Market positioning statement

// Simplified, executable opportunity structure
interface ExecutableOpportunity {
  // Core Identity
  id: string
  title: string              // Clear, action-oriented title
  description: string        // 1-2 sentence context

  // Execution Type
  category: OpportunityCategory
  execution_type: 'manual' | 'assisted' | 'autonomous'

  // Timing
  urgency: 'high' | 'medium' | 'low'  // Simplified from critical/high/medium/low
  time_window: string        // "Next 24 hours", "This week"
  expires_at: string

  // The Playbook (for one-click execution)
  playbook: {
    template_id?: string     // Pre-built template to use
    key_messages: string[]   // Core messages to communicate (3-5 points)
    target_audience: string  // Who we're targeting
    channels: string[]       // Where to execute
    assets_needed: string[]  // What content/visuals needed
  }

  // Action Items
  action_items: Array<{
    step: number
    action: string
    owner: string
    deadline: string
  }>

  // User Actions (like Campaign Builder additionalTactics)
  user_actions?: Array<{
    type: string           // e.g., "executive-coffee", "analyst-briefing"
    who: string            // Person/role executing
    what: string           // Description of action
    where: string          // Channel (LinkedIn, email, in-person)
    when: string           // Timing relative to campaign
    estimatedEffort: string // Time required
    resources: string[]    // Supporting materials needed
  }>

  // Media Targets
  media_targets?: Array<{
    outlet: string
    tier: number
    journalist?: string
    beat?: string
    angle: string
    timing: string
  }>

  // Measurement
  success_metrics: string[]  // How we measure success
  expected_impact: string    // What we expect to achieve

  // Context
  trigger_event: string      // What triggered this opportunity
  competitor_context?: string // If competitor-related
  confidence: number         // 0-100 confidence score

  // Organization
  organization_id: string
  organization_name: string

  // Metadata
  score: number
  status: 'active' | 'in_progress' | 'completed' | 'expired'
  created_at: string
}

// Map personas to specific action types they create
const PERSONA_ACTION_MAPPING = {
  'Marcus Chen': {
    categories: ['PRESS_RELEASE', 'CRISIS_RESPONSE', 'CONTENT_CREATION'],
    focus: 'immediate PR response and narrative control',
    urgency_bias: 'high'
  },
  'Victoria Chen': {
    categories: ['EXECUTIVE_OUTREACH', 'PARTNERSHIP_PLAY', 'TALENT_MOVE'],
    focus: 'relationship building and strategic alliances',
    urgency_bias: 'medium'
  },
  'Sarah Kim': {
    categories: ['SOCIAL_CAMPAIGN', 'CONTENT_CREATION'],
    focus: 'viral content and social engagement',
    urgency_bias: 'high'
  },
  'Helena Cross': {
    categories: ['MARKET_POSITION', 'CONTENT_CREATION'],
    focus: 'trend surfing and narrative hijacking',
    urgency_bias: 'medium'
  },
  'Emma Rodriguez': {
    categories: ['MARKET_POSITION', 'PRESS_RELEASE'],
    focus: 'market positioning and competitive response',
    urgency_bias: 'medium'
  }
}

// Extract clean, actionable opportunities from synthesis
function extractActionableOpportunities(synthesis: any, enrichedData: any): ExecutableOpportunity[] {
  const opportunities: ExecutableOpportunity[] = []
  const orgName = enrichedData?.organization_name || 'Organization'
  const orgId = enrichedData?.organization_id || '1'

  // Helper to create opportunity from synthesis insight
  const createOpportunity = (
    insight: any,
    category: OpportunityCategory,
    persona: string
  ): ExecutableOpportunity | null => {

    // Skip if no clear action
    if (!insight || (!insight.action && !insight.response_required && !insight.opportunity)) {
      return null
    }

    const now = new Date()
    const personaConfig = PERSONA_ACTION_MAPPING[persona]

    // Determine urgency based on context
    let urgency: 'high' | 'medium' | 'low' = personaConfig.urgency_bias as any
    let timeWindow = 'This week'
    let hoursToExpire = 168 // 1 week default

    if (insight.urgency === 'immediate' || insight.window?.includes('24') || insight.window?.includes('48')) {
      urgency = 'high'
      timeWindow = 'Next 24-48 hours'
      hoursToExpire = 48
    } else if (insight.urgency === 'high' || insight.window?.includes('week')) {
      urgency = 'medium'
      timeWindow = 'This week'
      hoursToExpire = 168
    }

    const expiresAt = new Date(now.getTime() + hoursToExpire * 60 * 60 * 1000)

    // Build the playbook based on category
    const playbook = buildPlaybook(category, insight, orgName)

    // Generate action items
    const actionItems = generateActionItems(category, urgency, insight)

    return {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: generateTitle(category, insight, orgName),
      description: insight.description || insight.action || insight.response_required || 'Strategic opportunity identified',

      category,
      execution_type: determineExecutionType(category),

      urgency,
      time_window: timeWindow,
      expires_at: expiresAt.toISOString(),

      playbook,
      action_items: actionItems,

      success_metrics: generateSuccessMetrics(category),
      expected_impact: generateExpectedImpact(category, insight),

      trigger_event: insight.trigger || insight.event || 'Market intelligence signal',
      competitor_context: insight.competitor || insight.competitor_name,
      confidence: insight.confidence || 75,

      organization_id: orgId,
      organization_name: orgName,

      score: calculateScore(urgency, insight.confidence || 75),
      status: 'active',
      created_at: now.toISOString()
    }
  }

  // Process competitive moves (Marcus Chen - PR responses)
  if (synthesis.competitive_moves) {
    synthesis.competitive_moves.immediate_threats?.forEach((threat: any) => {
      const opp = createOpportunity(threat, 'CRISIS_RESPONSE', 'Marcus Chen')
      if (opp) opportunities.push(opp)
    })

    synthesis.competitive_moves.opportunities?.forEach((item: any) => {
      const opp = createOpportunity(item, 'PRESS_RELEASE', 'Marcus Chen')
      if (opp) opportunities.push(opp)
    })
  }

  // Process stakeholder dynamics (Victoria Chen - relationships)
  if (synthesis.stakeholder_dynamics?.engagement_opportunities) {
    synthesis.stakeholder_dynamics.engagement_opportunities.forEach((item: any) => {
      const opp = createOpportunity(item, 'EXECUTIVE_OUTREACH', 'Victoria Chen')
      if (opp) opportunities.push(opp)
    })
  }

  // Process media landscape (Sarah Kim - social/viral)
  if (synthesis.media_landscape?.trending_topics) {
    synthesis.media_landscape.trending_topics.forEach((topic: any) => {
      const opp = createOpportunity(topic, 'SOCIAL_CAMPAIGN', 'Sarah Kim')
      if (opp) opportunities.push(opp)
    })
  }

  // Process PR actions if present
  if (synthesis.pr_actions?.immediate) {
    synthesis.pr_actions.immediate.forEach((action: any) => {
      const opp = createOpportunity(
        { action, urgency: 'immediate', confidence: 85 },
        'PRESS_RELEASE',
        'Marcus Chen'
      )
      if (opp) opportunities.push(opp)
    })
  }

  // Process any detected opportunities from enrichment
  if (enrichedData?.opportunities) {
    enrichedData.opportunities.forEach((detectedOpp: any) => {
      const category = mapDetectedToCategory(detectedOpp.category)
      const persona = getPersonaForCategory(category)
      const opp = createOpportunity(detectedOpp, category, persona)
      if (opp) opportunities.push(opp)
    })
  }

  return opportunities
}

// Build actionable playbook based on category
function buildPlaybook(category: OpportunityCategory, insight: any, orgName: string): ExecutableOpportunity['playbook'] {
  const playbooks: Record<OpportunityCategory, ExecutableOpportunity['playbook']> = {
    PRESS_RELEASE: {
      template_id: 'pr_standard_release',
      key_messages: [
        `${orgName} responds to market developments`,
        'Leadership position reinforced',
        'Innovation continues to drive growth'
      ],
      target_audience: 'Media, investors, customers',
      channels: ['PR Newswire', 'Company blog', 'Email to journalists'],
      assets_needed: ['Press release', 'Executive quote', 'Supporting data']
    },

    SOCIAL_CAMPAIGN: {
      template_id: 'social_engagement',
      key_messages: [
        'Join the conversation',
        'Our perspective on trending topic',
        'Community engagement'
      ],
      target_audience: 'Social media followers, industry community',
      channels: ['Twitter/X', 'LinkedIn', 'Company blog'],
      assets_needed: ['Social posts', 'Graphics', 'Video (optional)']
    },

    EXECUTIVE_OUTREACH: {
      key_messages: [
        'Strategic partnership opportunity',
        'Mutual benefit proposition',
        'Industry leadership alignment'
      ],
      target_audience: 'C-suite executives, board members',
      channels: ['Direct email', 'LinkedIn message', 'Phone call'],
      assets_needed: ['Executive brief', 'Talking points', 'Meeting deck']
    },

    CRISIS_RESPONSE: {
      template_id: 'crisis_statement',
      key_messages: [
        'Immediate response to situation',
        'Our position and actions',
        'Commitment to stakeholders'
      ],
      target_audience: 'All stakeholders',
      channels: ['Press release', 'Social media', 'Employee communication'],
      assets_needed: ['Crisis statement', 'FAQ document', 'Executive statement']
    },

    CONTENT_CREATION: {
      template_id: 'thought_leadership',
      key_messages: [
        'Industry insights and expertise',
        'Forward-thinking perspective',
        'Value for audience'
      ],
      target_audience: 'Industry professionals, customers',
      channels: ['Company blog', 'LinkedIn', 'Industry publications'],
      assets_needed: ['Article/blog post', 'Infographic', 'Expert quotes']
    },

    PARTNERSHIP_PLAY: {
      key_messages: [
        'Strategic alliance benefits',
        'Market expansion opportunity',
        'Synergy potential'
      ],
      target_audience: 'Partner executives, stakeholders',
      channels: ['Executive meeting', 'Formal proposal', 'Joint announcement'],
      assets_needed: ['Partnership proposal', 'MOU draft', 'Joint press release']
    },

    TALENT_MOVE: {
      key_messages: [
        'Growth opportunity',
        'Innovation culture',
        'Industry leadership'
      ],
      target_audience: 'Target talent, recruiters',
      channels: ['LinkedIn', 'Executive search', 'Direct outreach'],
      assets_needed: ['Job posting', 'Company culture deck', 'Executive letter']
    },

    MARKET_POSITION: {
      template_id: 'market_positioning',
      key_messages: [
        'Market leadership stance',
        'Differentiation points',
        'Vision for future'
      ],
      target_audience: 'Analysts, investors, customers',
      channels: ['Analyst briefing', 'Press release', 'Website update'],
      assets_needed: ['Position paper', 'Market data', 'Executive talking points']
    },
    CASCADE_READY: {
      key_messages: ['Multi-vector narrative seeding'],
      target_audience: 'Multi-stakeholder',
      channels: ['Various channels'],
      assets_needed: ['NIV campaign blueprint']
    },
    VOID_WINDOW: {
      key_messages: ['Strategic positioning'],
      target_audience: 'Market observers',
      channels: ['Monitored silence'],
      assets_needed: ['Response readiness plan']
    },
    MIRROR_CRISIS: {
      key_messages: ['Preemptive solution positioning'],
      target_audience: 'Industry stakeholders',
      channels: ['Pre-positioning content'],
      assets_needed: ['Solution proof points']
    },
    TROJAN_VEHICLE: {
      key_messages: ['Message embedding'],
      target_audience: 'Target audience',
      channels: ['High-performing formats'],
      assets_needed: ['Content format analysis']
    },
    NETWORK_PATH: {
      key_messages: ['Indirect influence'],
      target_audience: 'Influencer network',
      channels: ['Relationship channels'],
      assets_needed: ['Network map']
    }
  }

  // Customize based on insight details
  const basePlaybook = playbooks[category]

  if (insight.key_messages && Array.isArray(insight.key_messages)) {
    basePlaybook.key_messages = insight.key_messages.slice(0, 5)
  }

  if (insight.target) {
    basePlaybook.target_audience = insight.target
  }

  return basePlaybook
}

// Generate specific action items based on category
function generateActionItems(category: OpportunityCategory, urgency: string, insight: any): ExecutableOpportunity['action_items'] {
  const baseDeadline = new Date()

  const actionTemplates: Record<OpportunityCategory, ExecutableOpportunity['action_items']> = {
    PRESS_RELEASE: [
      {
        step: 1,
        action: 'Draft press release with key messages',
        owner: 'PR Team',
        deadline: new Date(baseDeadline.getTime() + 4 * 60 * 60 * 1000).toISOString() // +4 hours
      },
      {
        step: 2,
        action: 'Get executive approval and quote',
        owner: 'CMO',
        deadline: new Date(baseDeadline.getTime() + 8 * 60 * 60 * 1000).toISOString() // +8 hours
      },
      {
        step: 3,
        action: 'Distribute via PR channels',
        owner: 'PR Team',
        deadline: new Date(baseDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 hours
      }
    ],

    SOCIAL_CAMPAIGN: [
      {
        step: 1,
        action: 'Create social media content and graphics',
        owner: 'Social Team',
        deadline: new Date(baseDeadline.getTime() + 2 * 60 * 60 * 1000).toISOString() // +2 hours
      },
      {
        step: 2,
        action: 'Schedule and launch campaign',
        owner: 'Social Team',
        deadline: new Date(baseDeadline.getTime() + 4 * 60 * 60 * 1000).toISOString() // +4 hours
      },
      {
        step: 3,
        action: 'Monitor engagement and respond',
        owner: 'Social Team',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString() // +48 hours
      }
    ],

    EXECUTIVE_OUTREACH: [
      {
        step: 1,
        action: 'Prepare executive brief and talking points',
        owner: 'Strategy Team',
        deadline: new Date(baseDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 hours
      },
      {
        step: 2,
        action: 'Schedule executive outreach',
        owner: 'CEO',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString() // +48 hours
      },
      {
        step: 3,
        action: 'Conduct follow-up and next steps',
        owner: 'COO',
        deadline: new Date(baseDeadline.getTime() + 72 * 60 * 60 * 1000).toISOString() // +72 hours
      }
    ],

    CRISIS_RESPONSE: [
      {
        step: 1,
        action: 'Draft crisis statement and FAQ',
        owner: 'Crisis Team',
        deadline: new Date(baseDeadline.getTime() + 1 * 60 * 60 * 1000).toISOString() // +1 hour
      },
      {
        step: 2,
        action: 'Get CEO approval',
        owner: 'CEO',
        deadline: new Date(baseDeadline.getTime() + 2 * 60 * 60 * 1000).toISOString() // +2 hours
      },
      {
        step: 3,
        action: 'Distribute across all channels',
        owner: 'Communications',
        deadline: new Date(baseDeadline.getTime() + 4 * 60 * 60 * 1000).toISOString() // +4 hours
      }
    ],

    CONTENT_CREATION: [
      {
        step: 1,
        action: 'Research and outline content',
        owner: 'Content Team',
        deadline: new Date(baseDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 hours
      },
      {
        step: 2,
        action: 'Create and review content',
        owner: 'Content Team',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString() // +48 hours
      },
      {
        step: 3,
        action: 'Publish and promote',
        owner: 'Marketing',
        deadline: new Date(baseDeadline.getTime() + 72 * 60 * 60 * 1000).toISOString() // +72 hours
      }
    ],

    PARTNERSHIP_PLAY: [
      {
        step: 1,
        action: 'Develop partnership proposal',
        owner: 'Business Dev',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString() // +48 hours
      },
      {
        step: 2,
        action: 'Schedule partner meeting',
        owner: 'CEO',
        deadline: new Date(baseDeadline.getTime() + 72 * 60 * 60 * 1000).toISOString() // +72 hours
      },
      {
        step: 3,
        action: 'Negotiate terms and agreement',
        owner: 'Legal/Business Dev',
        deadline: new Date(baseDeadline.getTime() + 168 * 60 * 60 * 1000).toISOString() // +1 week
      }
    ],

    TALENT_MOVE: [
      {
        step: 1,
        action: 'Identify and research target talent',
        owner: 'HR/Recruiting',
        deadline: new Date(baseDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 hours
      },
      {
        step: 2,
        action: 'Initiate outreach and engagement',
        owner: 'Hiring Manager',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString() // +48 hours
      },
      {
        step: 3,
        action: 'Conduct interviews and make offer',
        owner: 'Hiring Team',
        deadline: new Date(baseDeadline.getTime() + 168 * 60 * 60 * 1000).toISOString() // +1 week
      }
    ],

    MARKET_POSITION: [
      {
        step: 1,
        action: 'Draft positioning statement',
        owner: 'Strategy Team',
        deadline: new Date(baseDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 hours
      },
      {
        step: 2,
        action: 'Align with executive team',
        owner: 'CMO',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString() // +48 hours
      },
      {
        step: 3,
        action: 'Roll out across channels',
        owner: 'Marketing',
        deadline: new Date(baseDeadline.getTime() + 72 * 60 * 60 * 1000).toISOString() // +72 hours
      }
    ],
    CASCADE_READY: [
      {
        step: 1,
        action: 'Consult NIV to generate campaign blueprint',
        owner: 'Strategy Team',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString()
      }
    ],
    VOID_WINDOW: [
      {
        step: 1,
        action: 'Monitor competitor activity',
        owner: 'Intelligence Team',
        deadline: new Date(baseDeadline.getTime() + 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    MIRROR_CRISIS: [
      {
        step: 1,
        action: 'Prepare preemptive content',
        owner: 'Communications',
        deadline: new Date(baseDeadline.getTime() + 72 * 60 * 60 * 1000).toISOString()
      }
    ],
    TROJAN_VEHICLE: [
      {
        step: 1,
        action: 'Analyze high-performing formats',
        owner: 'Content Strategy',
        deadline: new Date(baseDeadline.getTime() + 48 * 60 * 60 * 1000).toISOString()
      }
    ],
    NETWORK_PATH: [
      {
        step: 1,
        action: 'Map influence chains',
        owner: 'Research Team',
        deadline: new Date(baseDeadline.getTime() + 72 * 60 * 60 * 1000).toISOString()
      }
    ]
  }

  // Adjust deadlines for high urgency
  let actions = actionTemplates[category]
  if (urgency === 'high') {
    // Compress timeline by 50%
    actions = actions.map(action => ({
      ...action,
      deadline: new Date(
        baseDeadline.getTime() +
        (new Date(action.deadline).getTime() - baseDeadline.getTime()) / 2
      ).toISOString()
    }))
  }

  return actions
}

// Helper functions
function generateTitle(category: OpportunityCategory, insight: any, orgName: string): string {
  const templates: Record<OpportunityCategory, string> = {
    PRESS_RELEASE: `Press Release: ${insight.title || 'Respond to Market Development'}`,
    SOCIAL_CAMPAIGN: `Social Campaign: ${insight.topic || 'Engage Trending Topic'}`,
    EXECUTIVE_OUTREACH: `Executive Outreach: ${insight.target || 'Strategic Engagement'}`,
    CRISIS_RESPONSE: `Crisis Response: ${insight.issue || 'Immediate Action Required'}`,
    CONTENT_CREATION: `Content: ${insight.topic || 'Thought Leadership Opportunity'}`,
    PARTNERSHIP_PLAY: `Partnership: ${insight.partner || 'Strategic Alliance'}`,
    TALENT_MOVE: `Talent: ${insight.role || 'Strategic Hire Opportunity'}`,
    MARKET_POSITION: `Position: ${insight.stance || 'Market Leadership Statement'}`,
    CASCADE_READY: `Cascade Ready: ${insight.action || 'Multi-vector Seeding Opportunity'}`,
    VOID_WINDOW: `Void Window: ${insight.action || 'Strategic Silence Opportunity'}`,
    MIRROR_CRISIS: `Mirror Crisis: ${insight.action || 'Preemptive Positioning'}`,
    TROJAN_VEHICLE: `Trojan Vehicle: ${insight.action || 'Message Embedding'}`,
    NETWORK_PATH: `Network Path: ${insight.action || 'Indirect Influence'}`
  }

  return templates[category]
}

function determineExecutionType(category: OpportunityCategory): ExecutableOpportunity['execution_type'] {
  // Categories that can be automated
  const autonomous = ['PRESS_RELEASE', 'SOCIAL_CAMPAIGN', 'CONTENT_CREATION']
  // Categories that need human assistance
  const assisted = ['MARKET_POSITION', 'CRISIS_RESPONSE']
  // Categories that are manual only
  const manual = ['EXECUTIVE_OUTREACH', 'PARTNERSHIP_PLAY', 'TALENT_MOVE']

  if (autonomous.includes(category)) return 'autonomous'
  if (assisted.includes(category)) return 'assisted'
  return 'manual'
}

function generateSuccessMetrics(category: OpportunityCategory): string[] {
  const metrics: Record<OpportunityCategory, string[]> = {
    PRESS_RELEASE: ['Media pickups', 'Reach/impressions', 'Message penetration'],
    SOCIAL_CAMPAIGN: ['Engagement rate', 'Reach', 'Share of voice'],
    EXECUTIVE_OUTREACH: ['Meeting scheduled', 'Follow-up agreed', 'Deal progression'],
    CRISIS_RESPONSE: ['Negative sentiment reduction', 'Media coverage tone', 'Stakeholder feedback'],
    CONTENT_CREATION: ['Views/reads', 'Engagement', 'Lead generation'],
    PARTNERSHIP_PLAY: ['LOI signed', 'Terms agreed', 'Announcement made'],
    TALENT_MOVE: ['Candidate engaged', 'Interview completed', 'Offer accepted'],
    MARKET_POSITION: ['Analyst mentions', 'Media coverage', 'Competitor response'],
    CASCADE_READY: ['Narrative convergence', 'Stakeholder adoption', 'Message penetration'],
    VOID_WINDOW: ['Speculation generated', 'Competitor response tracked', 'Position strengthened'],
    MIRROR_CRISIS: ['Preemptive positioning achieved', 'Crisis avoided', 'Leadership established'],
    TROJAN_VEHICLE: ['Message embedding success', 'Audience reach', 'Organic amplification'],
    NETWORK_PATH: ['Influencer engagement', 'Network activation', 'Message reach']
  }

  return metrics[category]
}

function generateExpectedImpact(category: OpportunityCategory, insight: any): string {
  const impacts: Record<OpportunityCategory, string> = {
    PRESS_RELEASE: 'Control narrative and reinforce market position',
    SOCIAL_CAMPAIGN: 'Increase brand visibility and engagement',
    EXECUTIVE_OUTREACH: 'Build strategic relationship and unlock opportunities',
    CRISIS_RESPONSE: 'Mitigate reputation damage and maintain stakeholder trust',
    CONTENT_CREATION: 'Establish thought leadership and generate leads',
    PARTNERSHIP_PLAY: 'Expand market reach and capabilities',
    TALENT_MOVE: 'Strengthen team and competitive advantage',
    MARKET_POSITION: 'Clarify differentiation and market leadership',
    CASCADE_READY: 'Create multi-vector narrative cascade effect',
    VOID_WINDOW: 'Generate strategic speculation and position strength',
    MIRROR_CRISIS: 'Preemptively establish crisis leadership position',
    TROJAN_VEHICLE: 'Embed message in high-performing content formats',
    NETWORK_PATH: 'Activate indirect influence pathways'
  }

  return insight.expected_impact || impacts[category]
}

function calculateScore(urgency: string, confidence: number): number {
  const urgencyMultiplier = {
    'high': 1.5,
    'medium': 1.0,
    'low': 0.7
  }

  return Math.round(confidence * urgencyMultiplier[urgency])
}

function mapDetectedToCategory(detectedCategory: string): OpportunityCategory {
  const mapping: Record<string, OpportunityCategory> = {
    'COMPETITIVE': 'MARKET_POSITION',
    'STRATEGIC': 'PARTNERSHIP_PLAY',
    'VIRAL': 'SOCIAL_CAMPAIGN',
    'CASCADE': 'CONTENT_CREATION',
    'IMMEDIATE': 'PRESS_RELEASE',
    'TALENT': 'TALENT_MOVE',
    'REGULATORY': 'CRISIS_RESPONSE',
    'DEFENSIVE': 'CRISIS_RESPONSE'
  }

  return mapping[detectedCategory?.toUpperCase()] || 'CONTENT_CREATION'
}

function getPersonaForCategory(category: OpportunityCategory): string {
  for (const [persona, config] of Object.entries(PERSONA_ACTION_MAPPING)) {
    if (config.categories.includes(category)) {
      return persona
    }
  }
  return 'Marcus Chen' // Default
}

// Store opportunities in database
async function storeOpportunities(opportunities: ExecutableOpportunity[], orgId: string, orgName: string) {
  if (!opportunities || opportunities.length === 0) return

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Prepare for database insertion
    const opportunitiesToInsert = opportunities.map(opp => ({
      organization_id: opp.organization_id,
      title: opp.title,
      description: opp.description,
      score: opp.score,
      urgency: opp.urgency,
      time_window: opp.time_window,
      category: opp.category,
      expires_at: opp.expires_at,
      status: opp.status,
      // Store all data in JSONB field
      data: {
        organization_name: opp.organization_name,
        execution_type: opp.execution_type,
        playbook: opp.playbook,
        action_items: opp.action_items,
        user_actions: opp.user_actions,
        media_targets: opp.media_targets,
        success_metrics: opp.success_metrics,
        expected_impact: opp.expected_impact,
        trigger_event: opp.trigger_event,
        competitor_context: opp.competitor_context,
        confidence: opp.confidence
      }
    }))

    const { data, error } = await supabase
      .from('opportunities')
      .insert(opportunitiesToInsert)

    if (error) {
      console.error('Failed to store opportunities:', error)
    } else {
      console.log(`✅ Stored ${opportunitiesToInsert.length} opportunities in database`)
    }
  } catch (error) {
    console.error('Error storing opportunities:', error)
  }
}

// Helper functions for enhanced opportunity generation
function mapToExecutionCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'COMPETITIVE': 'PRESS_RELEASE',
    'VIRAL': 'SOCIAL_CAMPAIGN',
    'STRATEGIC': 'EXECUTIVE_OUTREACH',
    'CRISIS': 'CRISIS_RESPONSE',
    'GENERAL': 'CONTENT_CREATION'
  }
  return categoryMap[category] || 'MARKET_POSITION'
}

function determineExecutionTypeByScore(urgency: string, score: number): string {
  if (score >= 90 || urgency === 'high') return 'autonomous'
  if (score >= 75) return 'assisted'
  return 'manual'
}

function determineTargetAudience(category: string): string {
  const audienceMap: Record<string, string> = {
    'COMPETITIVE': 'Industry media and analysts',
    'VIRAL': 'Social media influencers and general public',
    'STRATEGIC': 'C-suite executives and decision makers',
    'CRISIS': 'All stakeholders',
    'GENERAL': 'Target customers and partners'
  }
  return audienceMap[category] || 'Media'
}

function determineChannels(category: string, urgency: string): string[] {
  const baseChannels = ['Press', 'Social']

  if (urgency === 'high') {
    baseChannels.push('Direct outreach')
  }

  if (category === 'VIRAL') {
    baseChannels.push('Influencer network')
  }

  if (category === 'STRATEGIC') {
    baseChannels.push('Executive briefings')
  }

  return baseChannels
}

function determineAssets(category: string): string[] {
  const assetMap: Record<string, string[]> = {
    'PRESS_RELEASE': ['Press release', 'Executive quotes', 'Supporting data'],
    'SOCIAL_CAMPAIGN': ['Social graphics', 'Video content', 'Hashtag strategy'],
    'EXECUTIVE_OUTREACH': ['Executive brief', 'Talking points', 'Meeting deck'],
    'CRISIS_RESPONSE': ['Statement', 'FAQ', 'Internal comms'],
    'CONTENT_CREATION': ['Blog post', 'Infographic', 'Case study']
  }
  return assetMap[category] || ['Press release']
}

function generatePRActionItems(category: string, pattern: string): Array<{step: number, action: string, owner: string, deadline: string}> {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const actionTemplates: Record<string, Array<{action: string, owner: string, timing: number}>> = {
    'COMPETITIVE': [
      { action: 'Draft competitive comparison', owner: 'Marketing', timing: 1 },
      { action: 'Get executive approval', owner: 'CMO', timing: 1 },
      { action: 'Distribute to media', owner: 'PR Team', timing: 2 },
      { action: 'Launch social amplification', owner: 'Social Team', timing: 3 }
    ],
    'VIRAL': [
      { action: 'Create viral content', owner: 'Creative Team', timing: 1 },
      { action: 'Activate influencer network', owner: 'Social Team', timing: 1 },
      { action: 'Monitor and amplify', owner: 'PR Team', timing: 2 }
    ],
    'STRATEGIC': [
      { action: 'Brief executives', owner: 'CEO', timing: 1 },
      { action: 'Prepare talking points', owner: 'Comms', timing: 1 },
      { action: 'Schedule media interviews', owner: 'PR Team', timing: 2 },
      { action: 'Execute outreach', owner: 'Executive Team', timing: 3 }
    ]
  }

  const template = actionTemplates[category] || actionTemplates['COMPETITIVE']

  return template.map((item, index) => ({
    step: index + 1,
    action: item.action,
    owner: item.owner,
    deadline: item.timing === 1 ? tomorrow.toISOString() : threeDays.toISOString()
  }))
}

function generateKeyMessages(opp: any, events: any[], orgName: string): string[] {
  const messages = []

  // Base message about the organization
  messages.push(`${orgName} is the trusted leader in our industry`)

  // Pattern-specific messages
  if (opp.pattern_matched?.includes('Competitor')) {
    messages.push('While others struggle, we deliver consistent value')
    messages.push('Our track record speaks for itself')
  }

  if (opp.pattern_matched?.includes('Trending')) {
    messages.push(`We've been ahead of this trend for years`)
    messages.push('Our expertise positions us uniquely to address this market need')
  }

  if (opp.category === 'CRISIS') {
    messages.push('We take this matter seriously and are taking immediate action')
    messages.push('Transparency and accountability are our core values')
  }

  return messages
}

function generateTalkingPoints(opp: any, events: any[]): string[] {
  const points = []

  // Add context about the situation
  if (events.length > 0) {
    points.push(`Recent market developments highlight the need for ${opp.pr_angle || 'leadership'}`)
  }

  // Add differentiators
  points.push('Our unique approach sets us apart from competitors')
  points.push('We have the expertise and track record to deliver results')

  // Add call to action
  points.push('We invite stakeholders to engage with us on this important topic')

  return points
}

function determineExpectedImpact(category: string, score: number): string {
  if (score >= 90) {
    return 'Major media coverage, significant competitive advantage'
  } else if (score >= 75) {
    return 'Strong media pickup, improved market position'
  } else if (score >= 60) {
    return 'Moderate visibility, reinforced messaging'
  }
  return 'Baseline awareness, relationship building'
}

function formatTriggerEvent(events: any[], topics: any[]): string {
  if (events.length > 0 && events[0].description) {
    return events[0].description.substring(0, 200)
  }

  if (topics.length > 0 && topics[0].theme) {
    return `Trending topic: ${topics[0].theme} (${topics[0].article_count || topics[0].count} mentions)`
  }

  return 'Market opportunity identified'
}

function extractCompetitorContext(events: any[]): string {
  const competitorEvents = events.filter(e =>
    e.type === 'competitive' ||
    e.entity ||
    (e.description && e.description.match(/\b[A-Z][a-z]+(?:Corp|Inc|Co|Ltd)\b/))
  )

  if (competitorEvents.length > 0) {
    return competitorEvents.map(e => e.entity || e.description?.substring(0, 100)).join('; ')
  }

  return ''
}

// Helper function to generate unique campaign names
function generateUniqueCampaignName(opp: any, orgName: string, index: number): string {
  const categoryNames: Record<string, string[]> = {
    'PRESS_RELEASE': ['Truth Beacon', 'Clarity Initiative', 'Facts First', 'Transparency Drive'],
    'SOCIAL_CAMPAIGN': ['Viral Velocity', 'Echo Chamber', 'Momentum Wave', 'Share Storm'],
    'EXECUTIVE_OUTREACH': ['Leadership Link', 'Executive Edge', 'C-Suite Connect', 'Board Bridge'],
    'CRISIS_RESPONSE': ['Shield Wall', 'Rapid Response', 'Trust Rebuild', 'Crisis Control'],
    'CONTENT_CREATION': ['Story Arc', 'Content Catalyst', 'Narrative Nexus', 'Message Matrix'],
    'PARTNERSHIP_PLAY': ['Alliance Alpha', 'Partner Pulse', 'Coalition Core', 'Unity Drive'],
    'TALENT_MOVE': ['Talent Magnet', 'Brain Gain', 'Team Turbo', 'Hire Wire'],
    'MARKET_POSITION': ['Market Maker', 'Position Power', 'Category King', 'Leader Lane']
  }

  const baseNames = categoryNames[opp.category] || ['Strategic Initiative', 'Action Plan', 'Response Protocol']
  const baseName = baseNames[index % baseNames.length]

  // Add unique elements based on context
  if (opp.urgency === 'high') {
    return `Operation ${baseName}`
  } else if (opp.competitor_context) {
    return `Project ${baseName}`
  } else {
    return `The ${baseName} Campaign`
  }
}

// Helper function to generate creative approaches
function generateCreativeApproach(opp: any, orgName: string): string {
  const approaches: Record<string, string[]> = {
    'PRESS_RELEASE': [
      'Craft a data-driven narrative with exclusive insights released to key media partners',
      'Launch a Twitter thread series revealing key findings one by one to build momentum',
      'Deploy a multi-channel storytelling approach with compelling human angles'
    ],
    'SOCIAL_CAMPAIGN': [
      'Create a Twitter thread series breaking down key insights with compelling data',
      'Launch LinkedIn posts with employee perspectives and quick wins',
      'Deploy Instagram Stories with polls and Q&As to drive engagement'
    ],
    'EXECUTIVE_OUTREACH': [
      'Coordinate exclusive media briefings with top-tier journalists',
      'Publish LinkedIn thought leadership articles from the C-suite',
      'Arrange strategic podcast appearances on industry shows'
    ],
    'CRISIS_RESPONSE': [
      'Deploy rapid social media responses with fact-checking infographics',
      'Create a dedicated FAQ landing page with live updates',
      'Mobilize employee advocates to share consistent messaging'
    ],
    'CONTENT_CREATION': [
      'Produce 60-second explainer videos optimized for social sharing',
      'Design data-driven infographics that tell compelling stories',
      'Launch an email newsletter series with exclusive insights'
    ],
    'PARTNERSHIP_PLAY': [
      'Co-author LinkedIn articles showcasing joint innovation',
      'Create downloadable case studies with partner success stories',
      'Launch cross-promoted social campaigns with unified hashtags'
    ],
    'TALENT_MOVE': [
      'Run employee Instagram Story takeovers showcasing daily life',
      'Create short recruitment videos featuring authentic team voices',
      'Deploy targeted LinkedIn campaigns with career growth stories'
    ],
    'MARKET_POSITION': [
      'Publish industry reports positioning company as the authority',
      'Create comparison guides for email and social distribution',
      'Launch a hashtag campaign to own the category conversation'
    ]
  }

  const categoryApproaches = approaches[opp.category] || [
    'Execute strategic communications plan with precision timing',
    'Leverage multi-channel approach for maximum reach and impact',
    'Deploy targeted messaging to key stakeholder groups'
  ]

  // Select approach based on hash of opportunity title for consistency
  const hash = opp.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return categoryApproaches[hash % categoryApproaches.length]
}

// Generate user actions (similar to Campaign Builder additionalTactics)
function generateUserActions(category: OpportunityCategory, orgName: string): Array<{
  type: string
  who: string
  what: string
  where: string
  when: string
  estimatedEffort: string
  resources: string[]
}> {
  const actionsByCategory: Record<OpportunityCategory, Array<{
    type: string
    who: string
    what: string
    where: string
    when: string
    estimatedEffort: string
    resources: string[]
  }>> = {
    PRESS_RELEASE: [
      {
        type: 'journalist-outreach',
        who: 'PR Lead',
        what: 'Personalized outreach to tier 1 journalists with exclusive angles',
        where: 'Email + LinkedIn',
        when: '24 hours before release',
        estimatedEffort: '2-3 hours',
        resources: ['Media list', 'Pitch templates', 'Executive availability']
      },
      {
        type: 'analyst-briefing',
        who: 'Analyst Relations',
        what: 'Brief key industry analysts on news and implications',
        where: 'Video call',
        when: 'Same day as release',
        estimatedEffort: '1-2 hours',
        resources: ['Analyst briefing deck', 'Data sheets']
      }
    ],
    SOCIAL_CAMPAIGN: [
      {
        type: 'influencer-engagement',
        who: 'Social Media Manager',
        what: 'Engage with industry influencers to amplify campaign',
        where: 'Twitter/LinkedIn',
        when: 'Launch day',
        estimatedEffort: '3-4 hours',
        resources: ['Influencer list', 'Engagement templates']
      },
      {
        type: 'community-activation',
        who: 'Community Manager',
        what: 'Mobilize brand advocates and employees to share content',
        where: 'Slack + Social',
        when: 'Throughout campaign',
        estimatedEffort: '2-3 hours',
        resources: ['Employee toolkit', 'Social graphics']
      }
    ],
    EXECUTIVE_OUTREACH: [
      {
        type: 'executive-coffee',
        who: 'CEO',
        what: 'Schedule informal coffee chats with 3-5 target executives',
        where: 'In-person/Virtual',
        when: 'This week',
        estimatedEffort: '4-6 hours',
        resources: ['Executive brief', 'Calendar coordination']
      },
      {
        type: 'linkedin-engagement',
        who: 'CEO/Executives',
        what: 'Comment on and engage with target executive\'s LinkedIn content',
        where: 'LinkedIn',
        when: 'Daily',
        estimatedEffort: '15-30 min/day',
        resources: ['LinkedIn monitoring', 'Talking points']
      }
    ],
    CRISIS_RESPONSE: [
      {
        type: 'stakeholder-calls',
        who: 'Executive Team',
        what: 'Direct calls to top customers, partners, and stakeholders',
        where: 'Phone',
        when: 'Immediately',
        estimatedEffort: '4-8 hours',
        resources: ['Stakeholder list', 'Talking points', 'FAQ']
      }
    ],
    CONTENT_CREATION: [
      {
        type: 'expert-interviews',
        who: 'Content Team',
        what: 'Interview internal experts for authentic perspectives',
        where: 'Video/Audio',
        when: 'This week',
        estimatedEffort: '3-4 hours',
        resources: ['Interview guide', 'Recording equipment']
      },
      {
        type: 'syndication-outreach',
        who: 'Content Manager',
        what: 'Pitch content for republication to industry publications',
        where: 'Email',
        when: 'After publish',
        estimatedEffort: '1-2 hours',
        resources: ['Publication list', 'Pitch template']
      }
    ],
    PARTNERSHIP_PLAY: [
      {
        type: 'partner-meeting',
        who: 'Business Development',
        what: 'Schedule exploratory meeting with potential partner',
        where: 'Video call',
        when: 'This week',
        estimatedEffort: '2-3 hours',
        resources: ['Partnership deck', 'Value proposition']
      }
    ],
    TALENT_MOVE: [
      {
        type: 'linkedin-research',
        who: 'Recruiting',
        what: 'Research and identify target candidates on LinkedIn',
        where: 'LinkedIn',
        when: 'This week',
        estimatedEffort: '3-4 hours',
        resources: ['Candidate profile', 'Boolean searches']
      },
      {
        type: 'warm-intro',
        who: 'Hiring Manager',
        what: 'Leverage network for warm introductions to candidates',
        where: 'Email + LinkedIn',
        when: 'This week',
        estimatedEffort: '2-3 hours',
        resources: ['Network map', 'Intro templates']
      }
    ],
    MARKET_POSITION: [
      {
        type: 'analyst-briefing',
        who: 'Analyst Relations',
        what: 'Brief top 5 analysts on new market positioning',
        where: 'Video call',
        when: 'This week',
        estimatedEffort: '3-4 hours',
        resources: ['Positioning deck', 'Market data']
      },
      {
        type: 'customer-advisory',
        who: 'Customer Success',
        what: 'Present positioning to customer advisory board for feedback',
        where: 'Virtual meeting',
        when: 'This week',
        estimatedEffort: '2 hours',
        resources: ['CAB deck', 'Feedback survey']
      }
    ],
    // V4 Pattern opportunities - general relationship-building actions
    CASCADE_READY: [
      {
        type: 'stakeholder-mapping',
        who: 'Strategy Team',
        what: 'Map key stakeholders across narrative conversation spaces',
        where: 'Internal research',
        when: 'This week',
        estimatedEffort: '4-6 hours',
        resources: ['Stakeholder database', 'Network analysis tools']
      }
    ],
    VOID_WINDOW: [
      {
        type: 'competitive-monitoring',
        who: 'Competitive Intelligence',
        what: 'Monitor competitor announcement for optimal response timing',
        where: 'Media monitoring',
        when: 'Real-time',
        estimatedEffort: '2-3 hours',
        resources: ['Monitoring tools', 'Alert system']
      }
    ],
    MIRROR_CRISIS: [
      {
        type: 'preemptive-positioning',
        who: 'Communications Team',
        what: 'Draft preemptive content showing how you\'ve solved the problem',
        where: 'Internal prep',
        when: 'This week',
        estimatedEffort: '3-4 hours',
        resources: ['Case studies', 'Solution framework']
      }
    ],
    TROJAN_VEHICLE: [
      {
        type: 'content-analysis',
        who: 'Content Strategy',
        what: 'Analyze top-performing content formats for message embedding',
        where: 'Analytics review',
        when: 'This week',
        estimatedEffort: '2-3 hours',
        resources: ['Analytics access', 'Content audit']
      }
    ],
    NETWORK_PATH: [
      {
        type: 'influencer-research',
        who: 'Research Team',
        what: 'Map influence chains and identify indirect pathways',
        where: 'Network analysis',
        when: 'This week',
        estimatedEffort: '4-5 hours',
        resources: ['Network tools', 'Influence maps']
      }
    ]
  }

  return actionsByCategory[category] || actionsByCategory.CONTENT_CREATION
}

// Generate media targets based on opportunity category
function generateMediaTargets(category: OpportunityCategory, insight: any): Array<{
  outlet: string
  tier: number
  journalist?: string
  beat?: string
  angle: string
  timing: string
}> {
  const targetsByCategory: Record<OpportunityCategory, Array<{
    outlet: string
    tier: number
    journalist?: string
    beat?: string
    angle: string
    timing: string
  }>> = {
    PRESS_RELEASE: [
      {
        outlet: 'TechCrunch',
        tier: 1,
        beat: 'Enterprise Tech',
        angle: 'Exclusive: Breaking news on market development',
        timing: 'Same day embargo lift'
      },
      {
        outlet: 'The Wall Street Journal',
        tier: 1,
        beat: 'Technology',
        angle: 'Industry implications and executive perspective',
        timing: 'Same day'
      },
      {
        outlet: 'VentureBeat',
        tier: 2,
        beat: 'AI & Enterprise',
        angle: 'Technical deep-dive and innovation angle',
        timing: 'Day 1-2'
      }
    ],
    SOCIAL_CAMPAIGN: [
      {
        outlet: 'Social Media Today',
        tier: 2,
        beat: 'Digital Marketing',
        angle: 'Case study on viral campaign mechanics',
        timing: 'During campaign peak'
      }
    ],
    CRISIS_RESPONSE: [
      {
        outlet: 'Reuters',
        tier: 1,
        beat: 'Breaking News',
        angle: 'Official statement and factual response',
        timing: 'Immediate'
      },
      {
        outlet: 'Bloomberg',
        tier: 1,
        beat: 'Business News',
        angle: 'Business impact and stakeholder perspective',
        timing: 'Within 2 hours'
      }
    ],
    CONTENT_CREATION: [
      {
        outlet: 'Harvard Business Review',
        tier: 1,
        beat: 'Management',
        angle: 'Thought leadership byline opportunity',
        timing: '2-4 weeks'
      },
      {
        outlet: 'Industry publication',
        tier: 2,
        beat: 'Industry-specific',
        angle: 'Expert commentary and insights',
        timing: '1-2 weeks'
      }
    ],
    MARKET_POSITION: [
      {
        outlet: 'Fortune',
        tier: 1,
        beat: 'Business Strategy',
        angle: 'Market leadership and positioning story',
        timing: 'This week'
      },
      {
        outlet: 'Gartner / Forrester',
        tier: 1,
        beat: 'Analyst',
        angle: 'Analyst briefing on market position',
        timing: 'This week'
      }
    ],
    EXECUTIVE_OUTREACH: [],
    PARTNERSHIP_PLAY: [
      {
        outlet: 'Trade publication',
        tier: 2,
        beat: 'Partnerships',
        angle: 'Joint announcement of strategic partnership',
        timing: 'At announcement'
      }
    ],
    TALENT_MOVE: [
      {
        outlet: 'LinkedIn News',
        tier: 2,
        beat: 'Talent & Careers',
        angle: 'Industry talent movement story',
        timing: 'At announcement'
      }
    ],
    // V4 patterns don't need specific media targets
    CASCADE_READY: [],
    VOID_WINDOW: [],
    MIRROR_CRISIS: [],
    TROJAN_VEHICLE: [],
    NETWORK_PATH: []
  }

  return targetsByCategory[category] || []
}

// Main handler
// Add creative enhancement to opportunities in a single Claude call
async function addCreativeEnhancement(
  opportunities: any[],
  orgName: string,
  apiKey: string | undefined,
  strategicGoals?: any[]
): Promise<any[]> {
  if (!apiKey) {
    console.log('⚠️ No Anthropic API key, skipping creative enhancement')
    return opportunities
  }

  console.log(`🎨 Adding creative enhancement to ${opportunities.length} opportunities`)

  const prompt = `You are a practical, creative PR strategist focused on EXECUTABLE campaigns. Create unique campaign names and approaches for these opportunities.

Organization: ${orgName}
${strategicGoals?.length ? `
Strategic Goals:
${strategicGoals.map((g: any) => `  - [${g.priority.toUpperCase()}] ${g.goal}${g.timeframe ? ` (${g.timeframe})` : ''}`).join('\n')}

IMPORTANT: Ensure campaign names and approaches align with these strategic goals.
` : ''}

${opportunities.map((opp, i) => `
Opportunity ${i + 1}:
Title: ${opp.title}
Description: ${opp.description}
Category: ${opp.category}
Urgency: ${opp.urgency}
`).join('\n')}

For EACH opportunity above, create:
1. A memorable, unique campaign name (not generic - something specific and catchy)
2. A creative BUT PRACTICAL approach that can be executed quickly

FOCUS ON THESE EXECUTABLE TACTICS:
- Creative narrative angles and storylines
- Social media campaigns (Twitter threads, LinkedIn posts, Instagram stories)
- Short-form video content (TikTok, YouTube Shorts, Reels)
- Media pitch angles and exclusive story offers
- Influencer partnerships and collaborations
- Data-driven content and infographics
- Executive thought leadership and bylined articles
- Newsjacking and trend riding
- Community engagement and user-generated content

AVOID THESE RESOURCE-INTENSIVE IDEAS:
- Documentaries or long-form films
- VR/AR experiences
- Large physical events or installations
- Custom apps or games
- Expensive production campaigns
- Webinars (not available on platform)

Examples of good campaign names:
- "The Truth Thread" (for Twitter narrative campaign)
- "Behind the Numbers" (for data storytelling)
- "60-Second Insights" (for short-form video series)
- "The Momentum Files" (for exclusive media drops)

Return EXACTLY ${opportunities.length} items as a JSON array:
[
  {
    "campaign_name": "unique memorable name here",
    "creative_approach": "specific creative strategy here"
  }
]

Make each campaign name unique and memorable. Be creative and bold!`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0.9, // Higher for creativity
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (response.ok) {
      const result = await response.json()
      const content = result.content[0].text
      console.log('🤖 Claude response received, parsing creative content...')

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\[[^\]]*\]/s)
        if (jsonMatch) {
          const creativeEnhancements = JSON.parse(jsonMatch[0])
          console.log(`✅ Parsed ${creativeEnhancements.length} creative enhancements`)

          // Merge creative enhancements with opportunities
          return opportunities.map((opp, i) => {
            const enhancement = creativeEnhancements[i]

            // Generate unique campaign name if Claude didn't provide one
            const campaignName = enhancement?.campaign_name &&
                               !enhancement.campaign_name.includes('...') &&
                               enhancement.campaign_name.length > 5
              ? enhancement.campaign_name
              : generateUniqueCampaignName(opp, orgName, i)

            // Generate creative approach if Claude didn't provide one
            const creativeApproach = enhancement?.creative_approach &&
                                    !enhancement.creative_approach.includes('...') &&
                                    enhancement.creative_approach.length > 10
              ? enhancement.creative_approach
              : generateCreativeApproach(opp, orgName)

            return {
              ...opp,
              campaign_name: campaignName,
              creative_approach: creativeApproach,
              playbook: {
                ...opp.playbook,
                campaign_name: campaignName,
                creative_approach: creativeApproach
              }
            }
          })
        } else {
          console.log('⚠️ No JSON array found in Claude response')
        }
      } catch (e) {
        console.error('Failed to parse creative enhancement response:', e)
        console.log('Raw content:', content?.substring(0, 500))
      }
    } else {
      console.error('Claude API error:', response.status, await response.text())
    }
  } catch (e) {
    console.error('Error calling Claude for creative enhancement:', e)
  }

  // Generate fallback creative content
  console.log('⚠️ Using fallback creative generation')
  return opportunities.map((opp, i) => ({
    ...opp,
    campaign_name: generateUniqueCampaignName(opp, orgName, i),
    creative_approach: generateCreativeApproach(opp, orgName),
    playbook: {
      ...opp.playbook,
      campaign_name: generateUniqueCampaignName(opp, orgName, i),
      creative_approach: generateCreativeApproach(opp, orgName)
    }
  }))
}

// V4: Detect pattern-based opportunities from intelligence signals
function detectPatternOpportunities(
  synthesis: any,
  enrichedData: any
): Array<{category: OpportunityCategory, insight: any}> {
  const patternOpportunities: Array<{category: OpportunityCategory, insight: any}> = []

  if (!synthesis) return patternOpportunities

  const articles = synthesis.articles || []
  const topics = synthesis.trending_topics || []
  const events = synthesis.driving_events || []

  // CASCADE_READY: Narrative void + stakeholder access
  const narrativeVoids = topics.filter((t: any) =>
    t.theme?.toLowerCase().includes('debate') ||
    t.theme?.toLowerCase().includes('conversation') ||
    t.theme?.toLowerCase().includes('discussion') ||
    t.article_count > 5
  )
  if (narrativeVoids.length > 0 && enrichedData?.stakeholder_reach) {
    patternOpportunities.push({
      category: 'CASCADE_READY',
      insight: {
        action: `Plant seeds across ${narrativeVoids.length} narrative conversations`,
        description: `Detected narrative voids: ${narrativeVoids.map((v: any) => v.theme).join(', ')}. Perfect for multi-vector seed planting.`,
        urgency: 'high',
        window: 'Next 2-3 weeks'
      }
    })
  }

  // VOID_WINDOW: Expected response moment
  const competitorMoves = events.filter((e: any) =>
    e.type === 'competitor_move' ||
    e.type === 'industry_event' ||
    e.description?.toLowerCase().includes('announcement')
  )
  if (competitorMoves.length > 0) {
    patternOpportunities.push({
      category: 'VOID_WINDOW',
      insight: {
        action: 'Strategic silence during competitor announcement',
        description: `Competitor activity detected. High expectations for your response - strategic silence could amplify speculation.`,
        urgency: 'high',
        window: 'Next 48 hours'
      }
    })
  }

  // MIRROR_CRISIS: Predictable crisis approaching
  const riskSignals = events.filter((e: any) =>
    e.type === 'risk_signal' ||
    e.description?.toLowerCase().includes('regulatory') ||
    e.description?.toLowerCase().includes('scrutiny') ||
    e.description?.toLowerCase().includes('investigation')
  )
  if (riskSignals.length > 0) {
    patternOpportunities.push({
      category: 'MIRROR_CRISIS',
      insight: {
        action: 'Pre-position before predictable crisis',
        description: `Industry crisis signals detected. Pre-position as having solved this problem before it explodes.`,
        urgency: 'medium',
        window: 'Next 2-4 weeks'
      }
    })
  }

  // TROJAN_VEHICLE: Find what audience craves
  const trendingContent = articles.filter((a: any) =>
    a.title?.toLowerCase().includes('how to') ||
    a.title?.toLowerCase().includes('guide') ||
    a.title?.toLowerCase().includes('tips') ||
    a.shareCount > 1000
  )
  if (trendingContent.length > 2) {
    patternOpportunities.push({
      category: 'TROJAN_VEHICLE',
      insight: {
        action: 'Embed message in high-performing content format',
        description: `${trendingContent.length} trending content formats detected. Embed your message in what the audience already wants.`,
        urgency: 'medium',
        window: 'This week'
      }
    })
  }

  // NETWORK_PATH: Accessible influence chains
  if (enrichedData?.network_analysis?.influencers?.length > 0) {
    patternOpportunities.push({
      category: 'NETWORK_PATH',
      insight: {
        action: 'Target influencer\'s influencer',
        description: `${enrichedData.network_analysis.influencers.length} key influencers mapped. Path to target audience through trusted sources identified.`,
        urgency: 'low',
        window: 'Next 3-4 weeks'
      }
    })
  }

  return patternOpportunities
}

serve(withCors(async (req) => {
  try {
    const requestData = await req.json()
    const {
      organization,
      organization_name,
      organization_id,
      enriched_data,
      executive_synthesis,
      synthesis,
      detected_opportunities // Accept pre-detected opportunities from MCP-Opportunity-Detector
    } = requestData

    // Get organization details
    const orgName = organization_name || organization?.name || 'Unknown'
    const orgId = organization_id || organization?.id || '1'

    console.log(`🎯 Opportunity Orchestrator V2 - Creating executable opportunities for ${orgName}`)

    // Use synthesis from wherever it's provided
    const synthesisTouse = executive_synthesis || synthesis || {}

    // Use detected opportunities if available, otherwise extract from synthesis
    let opportunities = []
    if (detected_opportunities && detected_opportunities.length > 0) {
      console.log(`📡 Using ${detected_opportunities.length} pre-detected opportunities from MCP-Opportunity-Detector`)
      // Enhanced transformation with PR-specific details
      opportunities = detected_opportunities.map(opp => {
        // Extract the actual news/events driving this opportunity
        const drivingEvents = opp.data?.context?.events || opp.evidence?.events || []
        const trendingTopics = opp.data?.context?.topics || opp.evidence?.topics || []

        // Build specific PR angle based on pattern
        const prAngle = opp.pr_angle || opp.data?.pr_angle || 'Strategic PR opportunity'

        // Create specific action items based on opportunity type
        const actionItems = generatePRActionItems(opp.category, opp.pattern_matched)

        // Generate key messages based on the opportunity
        const keyMessages = generateKeyMessages(opp, drivingEvents, orgName)

        return {
          title: opp.title,
          description: `${opp.description}\n\nPR Angle: ${prAngle}`,
          category: mapToExecutionCategory(opp.category),
          execution_type: determineExecutionTypeByScore(opp.urgency, opp.score),
          urgency: opp.urgency?.toLowerCase() || 'medium',
          time_window: opp.time_window || '48 hours',
          score: opp.score || 75,

          // Enhanced playbook with specific PR actions
          playbook: {
            template_id: opp.category?.toLowerCase(),
            key_messages: keyMessages,
            target_audience: determineTargetAudience(opp.category),
            channels: determineChannels(opp.category, opp.urgency),
            assets_needed: determineAssets(opp.category),
            talking_points: generateTalkingPoints(opp, drivingEvents)
          },

          // Specific action items for execution
          action_items: actionItems,

          // Success metrics
          success_metrics: [
            'Media coverage in target publications',
            'Social media engagement rate',
            'Message penetration in coverage',
            'Competitive share of voice'
          ],

          // Expected impact
          expected_impact: determineExpectedImpact(opp.category, opp.score),

          // News context - CRITICAL for understanding the opportunity
          trigger_event: formatTriggerEvent(drivingEvents, trendingTopics),
          news_context: {
            driving_events: drivingEvents.map(e => ({
              type: e.type,
              description: e.description?.substring(0, 200)
            })),
            trending_topics: trendingTopics.map(t => ({
              theme: t.theme,
              volume: t.article_count || t.count
            }))
          },

          competitor_context: opp.competitor_context || extractCompetitorContext(drivingEvents),
          confidence: opp.confidence || opp.data?.confidence || 75,
          pattern_matched: opp.pattern_matched || opp.pattern_name,

          organization_name: orgName,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      })
    } else {
      // Extract clean, actionable opportunities from synthesis
      opportunities = extractActionableOpportunities(synthesisTouse, enriched_data || {})
    }

    // V4: Add pattern-based opportunities
    const patternOpportunities = detectPatternOpportunities(synthesisTouse, enriched_data || {})
    if (patternOpportunities.length > 0) {
      console.log(`🎯 V4: Detected ${patternOpportunities.length} pattern-based opportunities`)
      // Add pattern opportunities to the list
      patternOpportunities.forEach(({category, insight}) => {
        opportunities.push({
          id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${category.replace(/_/g, ' ')} - ${insight.action}`,
          description: insight.description,
          category: category,
          execution_type: 'assisted',
          urgency: insight.urgency || 'medium',
          time_window: insight.window || 'This week',
          score: 85, // High score for pattern opportunities
          playbook: {
            key_messages: [],
            target_audience: 'Multi-stakeholder',
            channels: ['Multi-vector'],
            assets_needed: ['Campaign blueprint from NIV']
          },
          action_items: [{
            step: 1,
            action: 'Consult NIV to generate campaign blueprint',
            owner: 'Strategy Team',
            deadline: insight.window || 'This week'
          }],
          success_metrics: ['Pattern execution success', 'Convergence achievement'],
          expected_impact: 'Multi-vector influence campaign',
          trigger_event: insight.description,
          confidence: 80,
          organization_name: orgName,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          status: 'active' as const
        })
      })
    }

    console.log(`📊 Processed ${opportunities.length} actionable opportunities (including ${patternOpportunities.length} pattern-based)`)

    // Sort by score and urgency
    opportunities.sort((a, b) => {
      if (a.urgency === 'high' && b.urgency !== 'high') return -1
      if (b.urgency === 'high' && a.urgency !== 'high') return 1
      return b.score - a.score
    })

    // Limit to top opportunities
    const maxOpportunities = 10  // Increase from 7 to 10 for better coverage
    const topOpportunities = opportunities.slice(0, maxOpportunities)

    // Fetch organization strategic goals for creative enhancement
    let strategicGoals: any[] = []
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data: orgData } = await supabase
        .from('organizations')
        .select('company_profile')
        .eq('id', orgId)
        .single()
      strategicGoals = orgData?.company_profile?.strategic_goals || []
    } catch (err) {
      console.log('⚠️ Could not fetch strategic goals:', err)
    }

    // Add creative enhancement to all opportunities in a single Claude call
    const creativelyEnhanced = await addCreativeEnhancement(topOpportunities, orgName, ANTHROPIC_API_KEY, strategicGoals)

    // Add user actions and media targets to each opportunity
    const fullyEnhanced = creativelyEnhanced.map(opp => ({
      ...opp,
      user_actions: generateUserActions(opp.category as OpportunityCategory, orgName),
      media_targets: generateMediaTargets(opp.category as OpportunityCategory, opp)
    }))

    // NOTE: Not storing here - detector already stores opportunities
    // Just enhancing and returning them
    console.log(`📊 Enhanced ${fullyEnhanced.length} opportunities with creative angles, user actions, and media targets (detector will store)`)

    // Return response
    const response = {
      success: true,
      organization: orgName,
      opportunities: fullyEnhanced,
      summary: {
        total: fullyEnhanced.length,
        high_urgency: fullyEnhanced.filter(o => o.urgency === 'high').length,
        by_category: fullyEnhanced.reduce((acc, opp) => {
          acc[opp.category] = (acc[opp.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        average_confidence: Math.round(
          fullyEnhanced.reduce((sum, o) => sum + o.confidence, 0) / fullyEnhanced.length
        )
      },
      metadata: {
        generated_at: new Date().toISOString(),
        orchestrator_version: 'v2',
        execution_ready: true
      }
    }

    return jsonResponse(response)

  } catch (error: any) {
    console.error('Opportunity orchestrator error:', error)
    return errorResponse(error.message || 'Failed to generate opportunities', 500)
  }
}))