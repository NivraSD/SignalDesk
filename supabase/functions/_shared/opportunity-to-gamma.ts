// Transform OpportunityV2 into Gamma presentation format

export function opportunityToGammaContent(opportunity: any): string {
  const { title, strategic_context, execution_plan } = opportunity

  let content = `# ${title}\n\n`

  // Slide 1: The Opportunity
  content += `## The Opportunity\n\n`
  content += `### What Happened\n`
  strategic_context?.trigger_events?.forEach((event: string) => {
    content += `- ${event}\n`
  })
  content += `\n`

  content += `### Why It Matters\n`
  content += `${strategic_context?.market_dynamics || ''}\n\n`
  content += `${strategic_context?.why_now || ''}\n\n`

  // Slide 2: Strategic Context
  content += `## Strategic Context\n\n`
  content += `### Our Advantage\n`
  content += `${strategic_context?.competitive_advantage || ''}\n\n`

  content += `### Time Window\n`
  content += `**${strategic_context?.time_window || ''}**\n\n`
  content += `⏰ ${strategic_context?.expiration_date ? `Act before ${new Date(strategic_context.expiration_date).toLocaleDateString()}` : ''}\n\n`

  content += `### Expected Impact\n`
  content += `${strategic_context?.expected_impact || ''}\n\n`

  content += `### Risk If Missed\n`
  content += `${strategic_context?.risk_if_missed || ''}\n\n`

  // Slide 3: Target Stakeholders
  content += `## Target Stakeholders\n\n`
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any) => {
    content += `### ${campaign.stakeholder_name}\n`
    if (campaign.stakeholder_description) {
      content += `${campaign.stakeholder_description}\n\n`
    }
    content += `**Priority:** ${campaign.stakeholder_priority}\n`
    content += `**Strategy:** ${campaign.lever_name}\n\n`
  })

  // Slide 4-N: Execution Plan by Stakeholder
  execution_plan?.stakeholder_campaigns?.forEach((campaign: any, idx: number) => {
    content += `## Execution: ${campaign.stakeholder_name}\n\n`
    content += `### ${campaign.lever_name}\n`
    if (campaign.lever_description) {
      content += `${campaign.lever_description}\n\n`
    }

    // Group content by type
    const byType: Record<string, any[]> = {}
    campaign.content_items?.forEach((item: any) => {
      if (!byType[item.type]) byType[item.type] = []
      byType[item.type].push(item)
    })

    Object.entries(byType).forEach(([type, items]) => {
      content += `\n**${formatContentType(type)}** (${items.length})\n`
      items.forEach((item: any, i: number) => {
        content += `${i + 1}. ${item.topic}\n`
        if (item.brief?.angle) {
          content += `   - ${item.brief.angle}\n`
        }
      })
      content += `\n`
    })
  })

  // Slide: Timeline
  content += `## Execution Timeline\n\n`
  if (execution_plan?.execution_timeline) {
    const timeline = execution_plan.execution_timeline

    if (timeline.immediate?.length > 0) {
      content += `### 🔥 Immediate (Today)\n`
      timeline.immediate.forEach((item: string) => content += `- ${item}\n`)
      content += `\n`
    }

    if (timeline.this_week?.length > 0) {
      content += `### 📅 This Week\n`
      timeline.this_week.forEach((item: string) => content += `- ${item}\n`)
      content += `\n`
    }

    if (timeline.this_month?.length > 0) {
      content += `### 🗓️ This Month\n`
      timeline.this_month.forEach((item: string) => content += `- ${item}\n`)
      content += `\n`
    }

    if (timeline.ongoing?.length > 0) {
      content += `### 🔄 Ongoing\n`
      timeline.ongoing.forEach((item: string) => content += `- ${item}\n`)
      content += `\n`
    }
  }

  // Slide: Success Metrics
  content += `## Success Metrics\n\n`
  execution_plan?.success_metrics?.forEach((metric: any) => {
    content += `### ${metric.metric}\n`
    content += `**Target:** ${metric.target}\n`
    if (metric.measurement_method) {
      content += `**How:** ${metric.measurement_method}\n`
    }
    if (metric.timeframe) {
      content += `**When:** ${metric.timeframe}\n`
    }
    content += `\n`
  })

  // Final slide: Content Inventory
  const totalItems = execution_plan?.stakeholder_campaigns
    ?.reduce((sum: number, c: any) => sum + (c.content_items?.length || 0), 0) || 0

  content += `## Content Inventory\n\n`
  content += `### Total Deliverables: ${totalItems}\n\n`

  // Summary by type
  const allItems = execution_plan?.stakeholder_campaigns
    ?.flatMap((c: any) => c.content_items || []) || []

  const typeCount: Record<string, number> = {}
  allItems.forEach((item: any) => {
    typeCount[item.type] = (typeCount[item.type] || 0) + 1
  })

  Object.entries(typeCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      content += `- **${formatContentType(type)}:** ${count}\n`
    })

  content += `\n---\n\n`
  content += `*Auto-generated from Opportunity Detection System*\n`

  return content
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
