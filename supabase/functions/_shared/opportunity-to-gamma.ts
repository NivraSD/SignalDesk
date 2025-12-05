// Transform OpportunityV2 into Gamma presentation format
// Now with dynamic narrative styles based on opportunity context

import {
  analyzeOpportunityForCreativeDirection,
  CreativeDirection,
  NarrativeStyle,
} from './opportunity-creative-direction.ts'

export interface GammaTransformResult {
  content: string
  creativeDirection: CreativeDirection
}

// Main export - returns both content and creative direction for Gamma API options
export function opportunityToGammaContent(opportunity: any): string {
  const result = opportunityToGammaContentWithDirection(opportunity)
  return result.content
}

// Extended export - returns content + creative direction
export function opportunityToGammaContentWithDirection(opportunity: any): GammaTransformResult {
  const creativeDirection = analyzeOpportunityForCreativeDirection(opportunity)
  const content = transformByNarrativeStyle(opportunity, creativeDirection)

  return {
    content,
    creativeDirection,
  }
}

// Route to appropriate narrative transformer
function transformByNarrativeStyle(opportunity: any, direction: CreativeDirection): string {
  const transformers: Record<NarrativeStyle, (opp: any, dir: CreativeDirection) => string> = {
    urgency: transformUrgencyNarrative,
    conquest: transformConquestNarrative,
    visionary: transformVisionaryNarrative,
    collaborative: transformCollaborativeNarrative,
    momentum: transformMomentumNarrative,
    transformation: transformTransformationNarrative,
  }

  const transformer = transformers[direction.narrativeStyle]
  return transformer(opportunity, direction)
}

// ============================================================================
// URGENCY NARRATIVE - "The Clock is Ticking"
// ============================================================================
function transformUrgencyNarrative(opp: any, dir: CreativeDirection): string {
  const { title, strategic_context, execution_plan } = opp
  let content = ''

  // Hook - Start with urgency
  content += `# ${dir.openingHook}\n\n`

  // Stakes - What's at risk
  content += `## What's at Stake\n\n`
  content += `${strategic_context?.risk_if_missed || 'Missing this window means ceding ground to competitors.'}\n\n`
  if (strategic_context?.expected_impact) {
    content += `**Potential Impact:** ${strategic_context.expected_impact}\n\n`
  }

  // The Trigger Events
  content += `## The Catalyst\n\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `> ${event}\n\n`
  })

  // The Window
  content += `## The Window\n\n`
  content += `**Time Available:** ${strategic_context?.time_window || 'Limited'}\n\n`
  if (strategic_context?.expiration_date) {
    content += `**Deadline:** ${new Date(strategic_context.expiration_date).toLocaleDateString()}\n\n`
  }
  content += `${strategic_context?.why_now || ''}\n\n`

  // Rapid Response Plan
  content += `## Rapid Response Plan\n\n`
  const timeline = execution_plan?.execution_timeline
  if (timeline?.immediate?.length > 0) {
    content += `### Right Now\n`
    timeline.immediate.forEach((item: string) => content += `- ${item}\n`)
    content += `\n`
  }
  if (timeline?.this_week?.length > 0) {
    content += `### This Week\n`
    timeline.this_week.forEach((item: string) => content += `- ${item}\n`)
    content += `\n`
  }

  // Key Actions by Stakeholder
  content += `## Target Actions\n\n`
  execution_plan?.stakeholder_campaigns?.slice(0, 3).forEach((campaign: any) => {
    content += `### ${campaign.stakeholder_name}\n`
    content += `**Approach:** ${campaign.lever_name}\n\n`
    const topItems = campaign.content_items?.slice(0, 2) || []
    topItems.forEach((item: any) => {
      content += `- **${item.topic}**\n`
    })
    content += `\n`
  })

  // Call to Action
  content += `## Move Now\n\n`
  content += `${dir.closingCTA}\n\n`
  content += buildQuickMetrics(execution_plan)

  return content
}

// ============================================================================
// CONQUEST NARRATIVE - "Seize the Advantage"
// ============================================================================
function transformConquestNarrative(opp: any, dir: CreativeDirection): string {
  const { title, strategic_context, execution_plan } = opp
  let content = ''

  // Hook - Competitive framing
  content += `# ${dir.openingHook}\n\n`

  // The Battlefield
  content += `## The Competitive Landscape\n\n`
  content += `${strategic_context?.market_dynamics || ''}\n\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `- ${event}\n`
  })
  content += `\n`

  // Our Edge
  content += `## Our Advantage\n\n`
  content += `${strategic_context?.competitive_advantage || 'We\'re uniquely positioned to capitalize.'}\n\n`
  content += `**Why We Win:** ${strategic_context?.why_now || ''}\n\n`

  // The Strategy
  content += `## The Battle Plan\n\n`
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any, idx: number) => {
    content += `### Target ${idx + 1}: ${campaign.stakeholder_name}\n`
    content += `**Strategy:** ${campaign.lever_name}\n\n`
    if (campaign.lever_description) {
      content += `${campaign.lever_description}\n\n`
    }
    content += `**Key Moves:**\n`
    campaign.content_items?.slice(0, 3).forEach((item: any) => {
      content += `- ${item.topic}\n`
    })
    content += `\n`
  })

  // Victory Conditions
  content += `## What Victory Looks Like\n\n`
  execution_plan?.success_metrics?.forEach((metric: any) => {
    content += `- **${metric.metric}:** ${metric.target}\n`
  })
  content += `\n`

  // Rally Call
  content += `## Time to Move\n\n`
  content += `${dir.closingCTA}\n`

  return content
}

// ============================================================================
// VISIONARY NARRATIVE - "Lead the Conversation"
// ============================================================================
function transformVisionaryNarrative(opp: any, dir: CreativeDirection): string {
  const { title, strategic_context, execution_plan } = opp
  let content = ''

  // Hook - Paint the vision
  content += `# ${dir.openingHook}\n\n`

  // The Insight
  content += `## The Key Insight\n\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `${event}\n\n`
  })
  content += `${strategic_context?.market_dynamics || ''}\n\n`

  // Our Perspective
  content += `## Our Point of View\n\n`
  content += `${strategic_context?.competitive_advantage || ''}\n\n`
  content += `${strategic_context?.why_now || ''}\n\n`

  // The Roadmap
  content += `## The Path Forward\n\n`
  const timeline = execution_plan?.execution_timeline

  content += `### Building the Foundation\n`
  if (timeline?.immediate?.length > 0) {
    timeline.immediate.forEach((item: string) => content += `- ${item}\n`)
  }
  if (timeline?.this_week?.length > 0) {
    timeline.this_week.forEach((item: string) => content += `- ${item}\n`)
  }
  content += `\n`

  content += `### Expanding Influence\n`
  if (timeline?.this_month?.length > 0) {
    timeline.this_month.forEach((item: string) => content += `- ${item}\n`)
  }
  if (timeline?.ongoing?.length > 0) {
    timeline.ongoing.forEach((item: string) => content += `- ${item}\n`)
  }
  content += `\n`

  // Thought Leadership Content
  content += `## Shaping the Narrative\n\n`
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any) => {
    const thoughtContent = campaign.content_items?.filter((item: any) =>
      ['thought_leadership', 'blog_post', 'media_pitch'].includes(item.type)
    ) || []
    if (thoughtContent.length > 0) {
      content += `### For ${campaign.stakeholder_name}\n`
      thoughtContent.slice(0, 3).forEach((item: any) => {
        content += `- **${item.topic}**`
        if (item.brief?.angle) content += `: ${item.brief.angle}`
        content += `\n`
      })
      content += `\n`
    }
  })

  // Impact
  content += `## The Ripple Effect\n\n`
  content += `${strategic_context?.expected_impact || ''}\n\n`

  // Invitation
  content += `## Join the Conversation\n\n`
  content += `${dir.closingCTA}\n`

  return content
}

// ============================================================================
// COLLABORATIVE NARRATIVE - "Better Together"
// ============================================================================
function transformCollaborativeNarrative(opp: any, dir: CreativeDirection): string {
  const { title, strategic_context, execution_plan } = opp
  let content = ''

  // Hook - Partnership opportunity
  content += `# ${dir.openingHook}\n\n`

  // The Opportunity
  content += `## The Partnership Opportunity\n\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `${event}\n\n`
  })

  // Shared Goals
  content += `## Common Ground\n\n`
  content += `${strategic_context?.market_dynamics || ''}\n\n`
  content += `**Shared Objective:** ${strategic_context?.why_now || ''}\n\n`

  // What We Bring
  content += `## What We Bring to the Table\n\n`
  content += `${strategic_context?.competitive_advantage || ''}\n\n`

  // Joint Approach
  content += `## Working Together\n\n`
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any) => {
    content += `### Engaging ${campaign.stakeholder_name}\n`
    content += `**Approach:** ${campaign.lever_name}\n\n`
    const partnerContent = campaign.content_items?.filter((item: any) =>
      ['partnership_outreach', 'email_campaign', 'presentation'].includes(item.type)
    ) || campaign.content_items?.slice(0, 3) || []
    partnerContent.slice(0, 3).forEach((item: any) => {
      content += `- ${item.topic}\n`
    })
    content += `\n`
  })

  // Mutual Benefits
  content += `## Mutual Success\n\n`
  content += `${strategic_context?.expected_impact || ''}\n\n`
  execution_plan?.success_metrics?.forEach((metric: any) => {
    content += `- **${metric.metric}:** ${metric.target}\n`
  })
  content += `\n`

  // Next Steps
  content += `## Let's Connect\n\n`
  content += `${dir.closingCTA}\n`

  return content
}

// ============================================================================
// MOMENTUM NARRATIVE - "Ride the Wave"
// ============================================================================
function transformMomentumNarrative(opp: any, dir: CreativeDirection): string {
  const { title, strategic_context, execution_plan } = opp
  let content = ''

  // Hook - The wave is building
  content += `# ${dir.openingHook}\n\n`

  // Trend Analysis
  content += `## The Forces at Play\n\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `> ${event}\n\n`
  })
  content += `${strategic_context?.market_dynamics || ''}\n\n`

  // Why Now
  content += `## Perfect Timing\n\n`
  content += `${strategic_context?.why_now || ''}\n\n`
  content += `**Window:** ${strategic_context?.time_window || 'Now'}\n\n`

  // How to Ride It
  content += `## Catching the Wave\n\n`
  content += `${strategic_context?.competitive_advantage || ''}\n\n`

  // Acceleration Plan
  content += `## Building Momentum\n\n`
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any) => {
    content += `### ${campaign.stakeholder_name}\n`
    content += `**${campaign.lever_name}**\n\n`
    campaign.content_items?.slice(0, 4).forEach((item: any) => {
      content += `- ${item.topic}\n`
    })
    content += `\n`
  })

  // Timeline as momentum builder
  content += `## The Acceleration Timeline\n\n`
  const timeline = execution_plan?.execution_timeline
  if (timeline?.immediate?.length > 0) {
    content += `**Launch:** ${timeline.immediate.join(', ')}\n\n`
  }
  if (timeline?.this_week?.length > 0) {
    content += `**Amplify:** ${timeline.this_week.join(', ')}\n\n`
  }
  if (timeline?.this_month?.length > 0) {
    content += `**Sustain:** ${timeline.this_month.join(', ')}\n\n`
  }

  // Where this takes us
  content += `## The Destination\n\n`
  content += `${strategic_context?.expected_impact || ''}\n\n`
  content += `${dir.closingCTA}\n`

  return content
}

// ============================================================================
// TRANSFORMATION NARRATIVE - "The New Reality"
// ============================================================================
function transformTransformationNarrative(opp: any, dir: CreativeDirection): string {
  const { title, strategic_context, execution_plan } = opp
  let content = ''

  // Hook - Everything has changed
  content += `# ${dir.openingHook}\n\n`

  // The Catalyst
  content += `## The Shift\n\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `**${event}**\n\n`
  })

  // Old vs New
  content += `## Before & After\n\n`
  content += `${strategic_context?.market_dynamics || ''}\n\n`
  if (strategic_context?.risk_if_missed) {
    content += `**The risk of standing still:** ${strategic_context.risk_if_missed}\n\n`
  }

  // The New Landscape
  content += `## The New Reality\n\n`
  content += `${strategic_context?.why_now || ''}\n\n`
  content += `${strategic_context?.competitive_advantage || ''}\n\n`

  // How We Adapt
  content += `## Adapting to Thrive\n\n`
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any) => {
    content += `### Evolving Our Approach: ${campaign.stakeholder_name}\n`
    content += `**New Strategy:** ${campaign.lever_name}\n\n`
    if (campaign.lever_description) {
      content += `${campaign.lever_description}\n\n`
    }
    content += `**Key Initiatives:**\n`
    campaign.content_items?.slice(0, 3).forEach((item: any) => {
      content += `- ${item.topic}\n`
    })
    content += `\n`
  })

  // Success in the New World
  content += `## Measuring Success\n\n`
  execution_plan?.success_metrics?.forEach((metric: any) => {
    content += `- **${metric.metric}:** ${metric.target}`
    if (metric.timeframe) content += ` (${metric.timeframe})`
    content += `\n`
  })
  content += `\n`

  // Forward
  content += `## Leading Forward\n\n`
  content += `${dir.closingCTA}\n`

  return content
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function buildQuickMetrics(execution_plan: any): string {
  const totalItems = execution_plan?.stakeholder_campaigns
    ?.reduce((sum: number, c: any) => sum + (c.content_items?.length || 0), 0) || 0

  const stakeholderCount = execution_plan?.stakeholder_campaigns?.length || 0

  return `**Scope:** ${totalItems} deliverables across ${stakeholderCount} stakeholder${stakeholderCount !== 1 ? 's' : ''}\n`
}

function formatContentType(type: string): string {
  const typeMap: Record<string, string> = {
    media_pitch: 'Media Pitches',
    social_post: 'Social Posts',
    thought_leadership: 'Thought Leadership',
    press_release: 'Press Releases',
    blog_post: 'Blog Posts',
    email_campaign: 'Email Campaigns',
    webinar: 'Webinars',
    presentation: 'Presentations',
    image: 'Visual Content',
    video: 'Video Content',
    event: 'Events',
    partnership_outreach: 'Partnership Outreach',
    user_action: 'Custom Actions'
  }
  return typeMap[type] || type
}
