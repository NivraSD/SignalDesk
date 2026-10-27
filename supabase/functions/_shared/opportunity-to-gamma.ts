// Transform OpportunityV2 into Gamma presentation format (improved structure)

export function opportunityToGammaContent(opportunity: any): string {
  const { title, strategic_context, execution_plan } = opportunity

  // Clean title (remove "Opportunity:" prefix if present)
  const cleanTitle = title.replace(/^Opportunity:\s*/i, '').trim()

  // Generate subtitle from market dynamics or why_now
  const subtitle = strategic_context?.why_now || strategic_context?.market_dynamics || ''

  let content = `# ${cleanTitle}\n\n`
  content += `${subtitle.substring(0, 150)}${subtitle.length > 150 ? '...' : ''}\n\n`

  // Slide 2: Targets & Urgency (who to reach, and how fast)
  content += `## Targets & Urgency\n\n`
  const urgency = String(opportunity.urgency || '').toLowerCase()
  if (urgency) {
    content += `### Urgency: ${urgency.charAt(0).toUpperCase()}${urgency.slice(1)}\n`
    if (strategic_context?.why_now) content += `${strategic_context.why_now}\n`
    if (strategic_context?.time_window) content += `**Window:** ${strategic_context.time_window}\n`
    content += `\n`
  }
  const audiences = (execution_plan?.stakeholder_campaigns || []).map((c: any) => c.stakeholder_name).filter(Boolean)
  if (audiences.length) {
    content += `### Audiences\n`
    audiences.slice(0, 4).forEach((a: string) => content += `- ${a}\n`)
    content += `\n`
  }
  const media = strategic_context?.media_targeting
  if (media?.target_outlets?.length || media?.primary_journalist_types?.length) {
    content += `### Media\n`
    if (media.target_outlets?.length) content += `**Outlets:** ${media.target_outlets.slice(0, 6).join(', ')}\n`
    if (media.primary_journalist_types?.length) content += `**Reporters:** ${media.primary_journalist_types.slice(0, 4).join(', ')}\n`
    content += `\n`
  }

  // Slide 3: Content Deliverables Overview
  const allItems = execution_plan?.stakeholder_campaigns
    ?.flatMap((c: any) => c.content_items || []) || []
  const totalItems = allItems.length

  content += `## Content Deliverables Overview\n\n`
  if (totalItems > 0) {
    // Group by type and show top items
    const byType: Record<string, any[]> = {}
    allItems.forEach((item: any) => {
      if (!byType[item.type]) byType[item.type] = []
      byType[item.type].push(item)
    })

    let itemNum = 1
    Object.entries(byType).slice(0, 4).forEach(([type, items]) => {
      const topItem = items[0]
      content += `### ${itemNum}. ${formatContentType(type)}\n`
      content += `${topItem.topic}\n`
      if (topItem.brief?.angle) {
        content += `${topItem.brief.angle}\n`
      }
      content += `\n`
      itemNum++
    })
    content += `**Total Deliverables:** ${totalItems}\n\n`
  }

  // Slide 4: Next Steps - Seize the Moment
  content += `## Next Steps: Seize the Moment\n\n`
  content += `### The Window Is Now\n`
  if (strategic_context?.time_window) {
    content += `${strategic_context.time_window}\n\n`
  }

  content += `### Immediate Action Required\n`
  if (execution_plan?.execution_timeline?.immediate?.length > 0) {
    execution_plan.execution_timeline.immediate.slice(0, 2).forEach((item: string) => {
      content += `- ${item}\n`
    })
  } else {
    content += `- Begin execution immediately to capture the opportunity\n`
  }
  content += `\n`

  if (strategic_context?.expiration_date) {
    const expDate = new Date(strategic_context.expiration_date).toLocaleDateString()
    content += `**Act before ${expDate}**\n\n`
  }

  // Slide 5: The Strategic Opportunity
  content += `## The Strategic Opportunity\n\n`
  content += `### What Happened\n`
  if (strategic_context?.trigger_events?.length > 0) {
    strategic_context.trigger_events.forEach((event: string) => {
      content += `- ${event}\n`
    })
  }
  content += `\n`

  content += `### Why It Matters\n`
  content += `${strategic_context?.market_dynamics || ''}\n\n`

  // Slide 6: Our Competitive Advantage
  content += `## Our Competitive Advantage\n\n`
  if (strategic_context?.competitive_advantage) {
    // Split into bullet points if it's a long text
    const advantages = strategic_context.competitive_advantage.split(/[.!]\s+/).filter((s: string) => s.trim())
    if (advantages.length > 1) {
      advantages.slice(0, 3).forEach((adv: string, i: number) => {
        content += `### Advantage ${i + 1}\n`
        content += `${adv.trim()}.\n\n`
      })
    } else {
      content += `${strategic_context.competitive_advantage}\n\n`
    }
  }

  // Slide 7: Critical Time Window (emojis trigger icon generation in Gamma)
  content += `## Critical Time Window\n\n`
  const timeline = execution_plan?.execution_timeline || {}
  let phase = 1

  if (timeline.immediate?.length > 0) {
    content += `### ${phase} 🔥 Immediate (Today)\n`
    content += `${timeline.immediate[0]}\n\n`
    phase++
  }

  if (timeline.this_week?.length > 0) {
    content += `### ${phase} 📅 This Week\n`
    content += `${timeline.this_week[0]}\n\n`
    phase++
  }

  if (timeline.this_month?.length > 0) {
    content += `### ${phase} 🗓️ This Month\n`
    content += `${timeline.this_month[0]}\n\n`
    phase++
  }

  if (strategic_context?.risk_if_missed) {
    content += `### ${phase} 🔄 Ongoing\n`
    content += `Risk increases: ${strategic_context.risk_if_missed}\n\n`
  }

  // Slide 8: Expected Impact & Risk
  content += `## Expected Impact & Risk\n\n`
  content += `### The Upside\n`
  content += `${strategic_context?.expected_impact || 'Successfully executing this strategy will establish market leadership.'}\n\n`

  content += `### The Risk\n`
  content += `${strategic_context?.risk_if_missed || 'Delayed action allows competitors to claim the opportunity first.'}\n\n`

  // Slides 9-10: Target Audiences (Primary and Secondary)
  const stakeholders = execution_plan?.stakeholder_campaigns || []
  if (stakeholders.length > 0) {
    const primary = stakeholders[0]
    content += `## Primary Target: ${primary.stakeholder_name}\n\n`
    content += `### Who They Are\n`
    content += `${primary.stakeholder_description || 'Key decision-makers in the target market.'}\n\n`
    content += `### Our Approach\n`
    content += `**${primary.lever_name}:** ${primary.lever_description || 'Targeted engagement strategy.'}\n\n`

    if (stakeholders.length > 1) {
      const secondary = stakeholders[1]
      content += `## Secondary Target: ${secondary.stakeholder_name}\n\n`
      content += `### Audience Profile\n`
      content += `${secondary.stakeholder_description || 'Secondary decision-makers and influencers.'}\n\n`
      content += `### Strategic Value\n`
      content += `**${secondary.lever_name}:** ${secondary.lever_description || 'Supporting engagement strategy.'}\n\n`
    }
  }

  // Slide 11: Core Content Strategy
  content += `## Core Content Strategy\n\n`
  if (totalItems > 0) {
    // Show top 2-3 content items with details
    allItems.slice(0, 3).forEach((item: any) => {
      content += `### ${formatContentType(item.type)}\n`
      content += `**"${item.topic}"**\n`
      if (item.brief?.angle) {
        content += `${item.brief.angle}\n`
      }
      content += `\n`
    })
  }

  // Slide 12: Execution Timeline (detailed - emojis trigger icons)
  content += `## Execution Timeline: Speed to Market\n\n`

  if (timeline.immediate?.length > 0) {
    content += `### 1 🔥 Immediate (Today)\n`
    timeline.immediate.forEach((item: string) => content += `- ${item}\n`)
    content += `\n`
  }

  if (timeline.this_week?.length > 0) {
    content += `### 2 📅 This Week (Days 1-7)\n`
    timeline.this_week.forEach((item: string) => content += `- ${item}\n`)
    content += `\n`
  }

  if (timeline.this_month?.length > 0) {
    content += `### 3 🗓️ This Month (Weeks 2-4)\n`
    timeline.this_month.forEach((item: string) => content += `- ${item}\n`)
    content += `\n`
  }

  if (timeline.ongoing?.length > 0) {
    content += `### 4 🔄 Ongoing (Month 2+)\n`
    timeline.ongoing.forEach((item: string) => content += `- ${item}\n`)
    content += `\n`
  }

  content += `---\n\n`
  content += `*Auto-generated from Opportunity Detection System*\n`

  return content
}

function formatContentType(type: string): string {
  const typeMap: Record<string, string> = {
    media_pitch: 'Media Pitch',
    social_post: 'Social Content',
    thought_leadership: 'Thought Leadership',
    press_release: 'Press Release',
    blog_post: 'Blog Post',
    email_campaign: 'Email Campaign',
    webinar: 'Webinar',
    presentation: 'Presentation',
    image: 'Visual Content',
    video: 'Video Content',
    event: 'Event',
    partnership_outreach: 'Partnership Outreach',
    user_action: 'Custom Action'
  }
  return typeMap[type] || type
}
