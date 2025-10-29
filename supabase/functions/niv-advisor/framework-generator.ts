// Strategic Framework Generator for NIV

// Helper: Clean and format article for display
function formatArticleForDisplay(article: any): string | null {
  const rawTitle = article.title || article.headline
  if (!rawTitle) return null

  // Clean title - remove extra whitespace, special chars
  const title = rawTitle
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\.,&]/g, '')
    .trim()

  // Clean and truncate description if available
  const description = (article.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)

  // Format: **Title** - Description
  return description
    ? `**${title}** - ${description}${description.length >= 200 ? '...' : ''}`
    : `**${title}**`
}

// Type definition for structured framework
export interface NivStrategicFramework {
  id: string
  sessionId: string
  organizationId: string
  created_at: Date

  strategy: {
    executive_summary: string
    objective: string
    narrative: string
    rationale: string
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }

  tactics: {
    campaign_elements: {
      media_outreach: string[]
      content_creation: string[]
      stakeholder_engagement: string[]
    }
    immediate_actions: string[]
    week_one_priorities: string[]
    strategic_plays: string[]
  }

  intelligence: {
    key_findings: string[]
    competitor_moves: string[]
    market_opportunities: string[]
    risk_factors: string[]
    supporting_data: {
      articles: any[]
      quotes: any[]
      metrics: any[]
    }
  }

  discovery: {
    organizationName: string
    industry: string
    competitors: string[]
    keywords: string[]
    stakeholders: {
      executives: string[]
      investors: string[]
      regulators: string[]
    }
    market_position: string
    recent_events: any[]
    monitoring_priorities: string[]
  }

  conversationContext: {
    originalQuery: string
    conversationHistory: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
    }>
    researchSteps: Array<{
      query: string
      findings: string[]
      sources: number
    }>
    userPreferences: {
      wants: string[]
      doesNotWant: string[]
      constraints: string[]
      examples: string[]
    }
  }

  orchestration: {
    components_to_activate: string[]
    workflow_type: 'crisis-response' | 'opportunity' | 'competitive' | 'thought-leadership' | 'launch'
    priority: 'urgent' | 'high' | 'normal'
    dependencies: string[]
  }

  // Content-ready format for niv-content-intelligent-v2 (same format as media plans)
  contentStrategy: {
    subject: string
    narrative: string
    target_audiences: string[]
    key_messages: string[]
    media_targets: string[]
    timeline: string
    chosen_approach: string
    tactical_recommendations: string[]
  }

  // Execution plan: separates auto-executable from strategic recommendations
  executionPlan: {
    autoExecutableContent: {
      contentTypes: string[]
      description: string
      estimatedPieces: number
    }
    strategicRecommendations: {
      campaigns: Array<{
        title: string
        type: 'event' | 'partnership' | 'content-series' | 'activation' | 'stunt' | 'community'
        description: string
        rationale: string
        executionSteps: string[]
        resources_needed: string[]
        timeline: string
        success_metrics: string[]
        platform_support: {
          generatable_assets: string[]
          templates_provided: string[]
          research_provided: boolean
        }
      }>
    }
  }
}

export function generateStructuredFramework(
  conceptState: any,
  message: string,
  organizationName: string,
  discoveryData: any,
  toolResults: any,
  conversationHistory: any[]
): NivStrategicFramework {

  // Generate unique ID for this framework
  const frameworkId = `framework-${Date.now()}-${Math.random().toString(36).substring(7)}`

  // Extract all research data
  const allArticles: any[] = []
  const allSynthesis: string[] = []
  const keyFindings: string[] = []
  const quotes: any[] = []
  const metrics: any[] = []

  // Aggregate research from history
  console.log(`📚 Processing research history: ${conceptState.researchHistory?.length || 0} entries`)

  if (conceptState.researchHistory && Array.isArray(conceptState.researchHistory)) {
    conceptState.researchHistory.forEach((research: any) => {
      console.log(`  - Research entry:`, {
        hasIntelligencePipeline: !!research.results?.intelligencePipeline,
        articlesCount: research.results?.intelligencePipeline?.articles?.length || 0,
        hasKeyFindings: !!research.results?.keyFindings
      })

      if (research.results?.intelligencePipeline?.articles) {
        allArticles.push(...research.results.intelligencePipeline.articles)
      }
      if (research.results?.intelligencePipeline?.synthesis) {
        allSynthesis.push(research.results.intelligencePipeline.synthesis)
      }

      // Check for keyFindings at multiple levels
      if (research.results?.keyFindings && Array.isArray(research.results.keyFindings)) {
        console.log(`    Found keyFindings at results level: ${research.results.keyFindings.length}`)
        keyFindings.push(...research.results.keyFindings)
      }
      if (research.keyFindings && Array.isArray(research.keyFindings)) {
        console.log(`    Found keyFindings at root level: ${research.keyFindings.length}`)
        keyFindings.push(...research.keyFindings)
      }

      // Extract synthesis as a key finding
      if (research.results?.intelligencePipeline?.synthesis) {
        console.log(`    Converting synthesis to key finding`)
        keyFindings.push(research.results.intelligencePipeline.synthesis)
      }

      // Also extract clean article findings if we still have none
      if (keyFindings.length === 0 && research.results?.intelligencePipeline?.articles) {
        console.log(`    Extracting findings from ${research.results.intelligencePipeline.articles.length} articles`)
        research.results.intelligencePipeline.articles.forEach((article: any) => {
          const formatted = formatArticleForDisplay(article)
          if (formatted) keyFindings.push(formatted)
        })
      }

      // Also check for fireplexityData at multiple levels
      if (research.results?.fireplexityData) {
        allArticles.push(...research.results.fireplexityData)
      }
      if (research.fireplexityData) {
        allArticles.push(...research.fireplexityData)
      }
    })
  }

  // Extract from current tool results (from this request)
  if (toolResults?.intelligencePipeline?.articles) {
    console.log(`  Found ${toolResults.intelligencePipeline.articles.length} articles in current toolResults`)
    allArticles.push(...toolResults.intelligencePipeline.articles)

    // Also extract clean findings from current request
    toolResults.intelligencePipeline.articles.forEach((article: any) => {
      const formatted = formatArticleForDisplay(article)
      if (formatted) keyFindings.push(formatted)
    })
  }
  if (toolResults?.fireplexityData) {
    console.log(`  Found ${toolResults.fireplexityData.length} articles in current fireplexityData`)
    allArticles.push(...toolResults.fireplexityData)
  }
  if (toolResults?.keyFindings && Array.isArray(toolResults.keyFindings)) {
    console.log(`  Found ${toolResults.keyFindings.length} keyFindings in current toolResults`)
    keyFindings.push(...toolResults.keyFindings)
  }

  // Also extract synthesis if available
  if (toolResults?.intelligencePipeline?.synthesis) {
    console.log(`  Adding synthesis to key findings`)
    keyFindings.push(toolResults.intelligencePipeline.synthesis)
  }

  console.log(`📊 Framework data summary:`, {
    totalArticles: allArticles.length,
    totalKeyFindings: keyFindings.length,
    totalSynthesis: allSynthesis.length
  })

  // Determine urgency based on research
  const hasUrgentSignals = keyFindings.some(f =>
    f.toLowerCase().includes('urgent') ||
    f.toLowerCase().includes('immediate') ||
    f.toLowerCase().includes('crisis')
  )

  // Determine workflow type
  let workflowType: NivStrategicFramework['orchestration']['workflow_type'] = 'thought-leadership'
  if (hasUrgentSignals || message.toLowerCase().includes('crisis')) {
    workflowType = 'crisis-response'
  } else if (message.toLowerCase().includes('launch')) {
    workflowType = 'launch'
  } else if (message.toLowerCase().includes('competitive') || message.toLowerCase().includes('competitor')) {
    workflowType = 'competitive'
  } else if (keyFindings.some(f => f.toLowerCase().includes('opportunity'))) {
    workflowType = 'opportunity'
  }

  // Extract competitor moves
  const competitorMoves = allArticles
    .filter(a => {
      const text = (a.title + ' ' + (a.summary || '')).toLowerCase()
      return discoveryData?.competitors?.some((comp: string) =>
        text.includes(comp.toLowerCase())
      )
    })
    .map(a => a.title || a.headline || 'Competitor activity detected')
    .slice(0, 5)

  // Extract market opportunities
  const opportunities = keyFindings
    .filter(f =>
      f.toLowerCase().includes('opportunity') ||
      f.toLowerCase().includes('gap') ||
      f.toLowerCase().includes('potential')
    )
    .slice(0, 5)

  // Extract risk factors
  const risks = keyFindings
    .filter(f =>
      f.toLowerCase().includes('risk') ||
      f.toLowerCase().includes('threat') ||
      f.toLowerCase().includes('concern')
    )
    .slice(0, 5)

  // Build the structured framework
  const framework: NivStrategicFramework = {
    id: frameworkId,
    sessionId: conceptState.conversationId || 'default',
    organizationId: organizationName,
    created_at: new Date(),

    // Core Strategy
    strategy: {
      executive_summary: buildExecutiveSummary(conceptState, allSynthesis, organizationName),
      objective: conceptState.concept.goal || message,
      narrative: conceptState.concept.narrative || `Position ${organizationName} as industry leader`,
      rationale: buildRationale(allSynthesis, keyFindings),
      urgency: hasUrgentSignals ? 'immediate' : 'high'
    },

    // Tactical Breakdown
    tactics: {
      campaign_elements: {
        media_outreach: [
          'Tier 1 media briefing on strategic positioning',
          'Executive thought leadership placement',
          'Industry analyst engagement',
          'Trade publication exclusive'
        ].filter(Boolean),
        // ONLY valid MCP content types - these can be generated by niv-content-intelligent-v2
        content_creation: [
          'press-release',      // Core announcement
          'media-pitch',        // Personalized journalist outreach
          'media-list',         // Target journalists with contact info
          'qa-document',        // Anticipated questions and answers
          'talking-points',     // Executive messaging guide
          'social-post',        // Multi-platform content
          'email'               // Sequenced outreach campaign
        ].filter(Boolean),
        stakeholder_engagement: [
          'Investor update on strategic direction',
          'Employee town hall on initiatives',
          'Customer advisory board briefing',
          'Partner ecosystem communication'
        ].filter(Boolean)
      },
      immediate_actions: buildImmediateActions(workflowType, hasUrgentSignals),
      week_one_priorities: [
        'Finalize core messaging framework',
        'Brief spokesperson team',
        'Prepare media kit',
        'Launch internal alignment'
      ],
      strategic_plays: [
        'Establish thought leadership position',
        'Build narrative dominance in key topics',
        'Create competitive differentiation',
        'Drive stakeholder alignment'
      ]
    },

    // Intelligence Context
    intelligence: {
      key_findings: keyFindings.slice(0, 10),
      competitor_moves: competitorMoves,
      market_opportunities: opportunities,
      risk_factors: risks,
      supporting_data: {
        articles: allArticles.slice(0, 20),
        quotes: quotes.slice(0, 10),
        metrics: metrics.slice(0, 10)
      }
    },

    // Discovery Profile
    discovery: {
      organizationName: discoveryData?.organizationName || organizationName,
      industry: discoveryData?.industry || 'Technology',
      competitors: discoveryData?.competitors || [],
      keywords: discoveryData?.keywords || [],
      stakeholders: {
        executives: [],
        investors: [],
        regulators: []
      },
      market_position: 'Leader', // This would come from analysis
      recent_events: [],
      monitoring_priorities: discoveryData?.keywords || []
    },

    // Conversation Context
    conversationContext: {
      originalQuery: conversationHistory[0]?.content || message,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date()
      })),
      researchSteps: conceptState.researchHistory.map((r: any) => ({
        query: r.query || 'Research step',
        findings: r.results?.keyFindings || [],
        sources: r.results?.intelligencePipeline?.articles?.length || 0
      })),
      userPreferences: conceptState.userPreferences || {
        wants: [],
        doesNotWant: [],
        constraints: [],
        examples: []
      }
    },

    // Orchestration Instructions
    orchestration: {
      components_to_activate: determineComponents(workflowType),
      workflow_type: workflowType,
      priority: hasUrgentSignals ? 'urgent' : 'high',
      dependencies: []
    },

    // Content-ready format (for niv-content-intelligent-v2)
    contentStrategy: buildContentStrategy(framework, conceptState, allSynthesis),

    // Execution plan (auto-executable vs strategic recommendations)
    executionPlan: buildExecutionPlan(framework, workflowType, hasUrgentSignals)
  }

  return framework
}

// Helper functions
function buildExecutiveSummary(conceptState: any, syntheses: string[], orgName: string): string {
  const goal = conceptState.concept.goal || 'strategic positioning'
  const narrative = conceptState.concept.narrative || 'market leadership'

  let summary = `${orgName} needs to ${goal} through ${narrative}. `

  if (syntheses.length > 0) {
    summary += `Our research indicates: ${syntheses[0].substring(0, 200)}. `
  }

  summary += `This strategic framework provides a comprehensive approach to achieve these objectives through coordinated media outreach, content creation, and stakeholder engagement.`

  return summary
}

function buildRationale(syntheses: string[], findings: string[]): string {
  if (syntheses.length > 0) {
    return syntheses[0].substring(0, 300)
  }
  if (findings.length > 0) {
    return `Based on analysis: ${findings.slice(0, 2).join('. ')}`
  }
  return 'Strategic positioning based on market analysis and competitive landscape assessment.'
}

function buildImmediateActions(workflowType: string, urgent: boolean): string[] {
  const baseActions = [
    'Align executive team on messaging',
    'Prepare spokesperson briefing materials'
  ]

  if (workflowType === 'crisis-response' || urgent) {
    return [
      'Activate crisis response team',
      'Draft holding statement',
      'Monitor media and social channels',
      ...baseActions
    ]
  }

  if (workflowType === 'launch') {
    return [
      'Finalize launch messaging',
      'Brief media partners',
      'Prepare embargo materials',
      ...baseActions
    ]
  }

  return baseActions
}

function determineComponents(workflowType: string): string[] {
  const baseComponents = ['media-list', 'content-generator']

  switch (workflowType) {
    case 'crisis-response':
      return [...baseComponents, 'crisis-monitor', 'rapid-response']
    case 'launch':
      return [...baseComponents, 'timeline-planner', 'asset-creator']
    case 'competitive':
      return [...baseComponents, 'competitive-intel', 'positioning-tool']
    case 'opportunity':
      return [...baseComponents, 'opportunity-tracker', 'campaign-builder']
    default:
      return [...baseComponents, 'thought-leadership', 'strategic-planner']
  }
}

// Build content-ready strategy format (for niv-content-intelligent-v2)
function buildContentStrategy(framework: NivStrategicFramework, conceptState: any, syntheses: string[]) {
  return {
    subject: framework.strategy?.objective || 'Strategic Initiative',
    narrative: buildContentNarrative(framework, syntheses),
    target_audiences: buildTargetAudiences(framework),
    key_messages: buildKeyMessages(framework),
    media_targets: buildMediaTargets(framework),
    timeline: buildContentTimeline(framework),
    chosen_approach: framework.strategy?.rationale || 'Strategic approach',
    tactical_recommendations: framework.tactics?.strategic_plays || []
  }
}

function buildContentNarrative(framework: NivStrategicFramework, syntheses: string[]): string {
  let narrative = framework.strategy?.narrative || ''

  // Enrich with context from intelligence
  if (framework.intelligence?.key_findings && framework.intelligence.key_findings.length > 0) {
    narrative += `\n\nKey Context: ${framework.intelligence.key_findings.slice(0, 2).join('. ')}`
  }

  // Add competitive context if available
  if (framework.intelligence?.competitor_moves && framework.intelligence.competitor_moves.length > 0) {
    narrative += `\n\nMarket Context: ${framework.intelligence.competitor_moves[0]}`
  }

  return narrative.trim()
}

function buildTargetAudiences(framework: NivStrategicFramework): string[] {
  const audiences: string[] = []

  // From stakeholder engagement tactics
  if (framework.tactics?.campaign_elements?.stakeholder_engagement) {
    const stakeholders = framework.tactics.campaign_elements.stakeholder_engagement
    stakeholders.forEach(s => {
      const lower = s.toLowerCase()
      if (lower.includes('investor')) audiences.push('Investors')
      if (lower.includes('employee')) audiences.push('Employees')
      if (lower.includes('customer')) audiences.push('Customers')
      if (lower.includes('partner')) audiences.push('Partners')
      if (lower.includes('analyst')) audiences.push('Industry Analysts')
    })
  }

  // Default audiences if none found
  if (audiences.length === 0) {
    audiences.push('Industry Stakeholders', 'Media & Analysts', 'General Public')
  }

  // Remove duplicates
  return [...new Set(audiences)].slice(0, 5)
}

function buildKeyMessages(framework: NivStrategicFramework): string[] {
  const messages: string[] = []

  // Start with strategic objective as first message
  if (framework.strategy.objective) {
    messages.push(framework.strategy.objective)
  }

  // Add top intelligence findings as supporting messages
  if (framework.intelligence.key_findings) {
    messages.push(...framework.intelligence.key_findings.slice(0, 3))
  }

  // Add strategic plays as messages
  if (framework.tactics.strategic_plays) {
    messages.push(...framework.tactics.strategic_plays.slice(0, 2))
  }

  // Ensure we have at least 3 messages
  while (messages.length < 3) {
    messages.push(`Strategic messaging point ${messages.length + 1}`)
  }

  return messages.slice(0, 5)
}

function buildMediaTargets(framework: NivStrategicFramework): string[] {
  const targets: string[] = []

  // Extract from media outreach tactics
  if (framework.tactics?.campaign_elements?.media_outreach) {
    const outreach = framework.tactics.campaign_elements.media_outreach

    outreach.forEach(item => {
      const lower = item.toLowerCase()
      if (lower.includes('tier 1')) {
        targets.push('TechCrunch', 'The Verge', 'WSJ', 'Bloomberg')
      }
      if (lower.includes('analyst')) {
        targets.push('Gartner', 'Forrester', 'IDC')
      }
      if (lower.includes('trade')) {
        targets.push('Industry trade publications')
      }
    })
  }

  // Use discovery keywords to suggest relevant publications
  if (framework.discovery?.industry) {
    const industry = framework.discovery.industry.toLowerCase()
    if (industry.includes('tech')) {
      targets.push('TechCrunch', 'VentureBeat', 'Ars Technica')
    }
    if (industry.includes('finance')) {
      targets.push('Bloomberg', 'Financial Times', 'CNBC')
    }
  }

  // Default targets if none found
  if (targets.length === 0) {
    targets.push('Major tech publications', 'Industry trade media', 'Business press')
  }

  // Remove duplicates
  return [...new Set(targets)].slice(0, 8)
}

function buildContentTimeline(framework: NivStrategicFramework): string {
  const urgency = framework.strategy.urgency

  switch (urgency) {
    case 'immediate':
      return '24-48 hours for initial rollout, 1 week for full campaign'
    case 'high':
      return '1 week for preparation, 2-3 weeks for execution'
    case 'medium':
      return '2-4 weeks phased rollout'
    case 'low':
      return '1-2 months strategic deployment'
    default:
      return '2-3 weeks recommended execution window'
  }
}

// Build execution plan (auto-executable vs strategic recommendations)
// Fixed: Added safe navigation to prevent crashes
function buildExecutionPlan(framework: NivStrategicFramework, workflowType: string, urgent: boolean) {
  const contentTypes = framework.tactics?.campaign_elements?.content_creation || []

  return {
    autoExecutableContent: {
      contentTypes: contentTypes,
      description: "Content that will be automatically generated",
      estimatedPieces: contentTypes.length
    },
    strategicRecommendations: buildStrategicRecommendations(framework, workflowType, urgent)
  }
}

function buildStrategicRecommendations(framework: NivStrategicFramework, workflowType: string, urgent: boolean) {
  const campaigns: any[] = []

  // Launch workflow = events + influencer campaigns
  if (workflowType === 'launch') {
    campaigns.push({
      title: "Product Launch Event Series",
      type: "event" as const,
      description: "Host exclusive product demos for key press and influencers in major markets",
      rationale: "Hands-on demos create authentic earned media that press releases alone cannot achieve. Physical events generate social buzz and allow journalists to experience the product firsthand.",
      executionSteps: [
        "Secure venues in key markets (SF, NYC, London recommended)",
        "Invite 20-30 journalists and influencers per city using platform-generated media lists",
        "Prepare live demo stations with product prototypes",
        "Arrange photo/video coverage for social amplification",
        "Follow up within 24 hours with personalized thank-you and exclusive access offers"
      ],
      resources_needed: [
        "Event venues ($5k-10k per city)",
        "Demo units (3-5 per city)",
        "Event staff (2-3 people per city)",
        "Catering budget ($2k per event)",
        "Photo/video production team"
      ],
      timeline: urgent ? "1 week crash timeline" : "3-4 weeks for full series",
      success_metrics: [
        "Media coverage from 50%+ of attendees",
        "Social media posts from 70%+ of influencers",
        "Product trial requests from 30+ tier-1 journalists",
        "Combined social reach of 5M+ impressions"
      ],
      platform_support: {
        generatable_assets: [
          'event-invitation-email',
          'event-announcement-press-release',
          'event-social-posts',
          'post-event-thank-you-email',
          'event-recap-blog-post'
        ],
        templates_provided: ['demo-script', 'talking-points', 'media-kit'],
        research_provided: true
      }
    })

    campaigns.push({
      title: "Influencer Unboxing Campaign",
      type: "partnership" as const,
      description: "Send personalized product samples to 50 tech influencers for authentic unboxing content",
      rationale: "Influencer content reaches younger audiences that traditional press cannot, with higher engagement rates. Unboxing videos generate excitement and social proof.",
      executionSteps: [
        "Identify 50 target influencers using platform media database (filtered for tech + audience size)",
        "Create personalized unboxing kits with product plus custom handwritten note",
        "Ship kits with embargo date aligned to official launch",
        "Track coverage and engagement across platforms",
        "Amplify best performing content through official brand channels"
      ],
      resources_needed: [
        "50 product units ($10k-20k depending on product cost)",
        "Custom packaging and personalized notes",
        "Shipping/logistics coordination",
        "Social monitoring and tracking tools"
      ],
      timeline: "2 weeks prep, 1 week shipping, 2 weeks embargo period",
      success_metrics: [
        "70%+ unboxing rate (35+ influencers post content)",
        "Combined reach of 5M+ impressions",
        "Positive sentiment score >85%",
        "Average engagement rate >5%"
      ],
      platform_support: {
        generatable_assets: [
          'influencer-pitch-email',
          'unboxing-talking-points',
          'product-fact-sheet',
          'influencer-thank-you-email'
        ],
        templates_provided: ['influencer-contract-template', 'shipping-tracker-template'],
        research_provided: true
      }
    })
  }

  // Crisis workflow = monitoring + rapid response
  if (workflowType === 'crisis-response') {
    campaigns.push({
      title: "Crisis Monitoring & Response Center",
      type: "activation" as const,
      description: "Set up 24/7 monitoring and rapid response capability for ongoing crisis management",
      rationale: "Crises evolve rapidly on social media. A dedicated monitoring center allows you to detect issues early and respond within the critical first hour.",
      executionSteps: [
        "Designate crisis response team (spokesperson, legal, comms, social)",
        "Set up social listening tools for brand mentions and crisis keywords",
        "Create response protocols and approval workflows",
        "Prepare response templates for common scenarios",
        "Establish communication channels for rapid coordination"
      ],
      resources_needed: [
        "Social listening tools ($500-2k/month)",
        "Dedicated crisis team (3-5 people on rotation)",
        "Emergency communication platform (Slack, Teams)",
        "Legal review capability"
      ],
      timeline: urgent ? "24 hours to activate" : "1 week to fully implement",
      success_metrics: [
        "Response time <1 hour for critical issues",
        "Sentiment improvement within 24 hours of response",
        "Media coverage ratio: positive vs negative >2:1",
        "Crisis containment within 72 hours"
      ],
      platform_support: {
        generatable_assets: [
          'crisis-response',
          'executive-statement',
          'apology-statement',
          'crisis-qa-document',
          'employee-talking-points'
        ],
        templates_provided: ['crisis-playbook', 'response-protocols', 'stakeholder-communications'],
        research_provided: true
      }
    })
  }

  // Thought leadership = speaking + content series
  if (workflowType === 'thought-leadership') {
    campaigns.push({
      title: "Executive Speaking Tour",
      type: "event" as const,
      description: "Position executives at 3-5 key industry conferences as featured speakers",
      rationale: "Conference speaking establishes authority and creates networking opportunities with journalists who attend. Speaking slots generate guaranteed media coverage.",
      executionSteps: [
        "Identify target conferences aligned with strategic themes",
        "Submit speaking proposals 6-12 months in advance",
        "Develop keynote presentations with compelling narratives",
        "Coordinate media interviews at conference venue",
        "Leverage speaking slot for social content and follow-up"
      ],
      resources_needed: [
        "Conference fees ($5k-15k per event)",
        "Travel and accommodations",
        "Presentation development resources",
        "On-site media coordination"
      ],
      timeline: "6-12 months advance planning for tier-1 conferences",
      success_metrics: [
        "Acceptance at 3+ tier-1 conferences",
        "Media coverage from conference appearances",
        "Speaking slot social reach >1M impressions",
        "Follow-up meeting requests from 20+ attendees"
      ],
      platform_support: {
        generatable_assets: [
          'speaking-proposal',
          'presentation-outline',
          'speaker-bio',
          'conference-social-posts',
          'post-event-blog-post'
        ],
        templates_provided: ['keynote-template', 'q-and-a-prep'],
        research_provided: true
      }
    })

    campaigns.push({
      title: "Thought Leadership Content Series",
      type: "content-series" as const,
      description: "12-week thought leadership content series across blog, LinkedIn, and podcast platforms",
      rationale: "Consistent thought leadership builds authority over time. A content series creates anticipation and regular touchpoints with your audience.",
      executionSteps: [
        "Develop 12 core themes aligned with strategic positioning",
        "Create content calendar with weekly publication schedule",
        "Produce long-form blog posts (1500+ words per week)",
        "Adapt content for LinkedIn articles and threads",
        "Record podcast episodes with industry experts (optional)",
        "Amplify through email newsletter and social channels"
      ],
      resources_needed: [
        "Content writer/editor (internal or freelance)",
        "Design resources for visual assets",
        "Podcast production (if doing audio)",
        "Email marketing platform"
      ],
      timeline: "12 weeks with weekly publication cadence",
      success_metrics: [
        "12 published pieces with <2% missed deadlines",
        "Average 5k+ views per piece",
        "Email subscriber growth of 500+",
        "Inbound inquiries from 20+ prospects"
      ],
      platform_support: {
        generatable_assets: [
          'blog-post',
          'linkedin-article',
          'social-post',
          'newsletter',
          'email'
        ],
        templates_provided: ['content-calendar', 'blog-template', 'social-promotion-guide'],
        research_provided: true
      }
    })
  }

  // Competitive workflow = analyst relations + market positioning
  if (workflowType === 'competitive') {
    campaigns.push({
      title: "Analyst Relations Program",
      type: "partnership" as const,
      description: "Build relationships with 5-10 key industry analysts for market reports and coverage",
      rationale: "Analyst reports influence buyer decisions and media coverage. Proactive analyst relations ensures your competitive positioning is accurately represented.",
      executionSteps: [
        "Identify key analysts covering your category (Gartner, Forrester, IDC)",
        "Schedule analyst briefings to share product roadmap and vision",
        "Provide exclusive access to customer case studies and data",
        "Participate in analyst events and advisory days",
        "Track analyst reports and citations"
      ],
      resources_needed: [
        "Analyst relations budget for subscriptions/events",
        "Executive time for briefings",
        "Customer references and data",
        "Travel for analyst events"
      ],
      timeline: "3-6 months to build relationships, ongoing maintenance",
      success_metrics: [
        "Inclusion in 3+ major analyst reports",
        "Positive positioning vs competitors",
        "Analyst citations in 10+ media articles",
        "Invitations to analyst advisory boards"
      ],
      platform_support: {
        generatable_assets: [
          'analyst-briefing-deck',
          'competitive-positioning',
          'value-proposition',
          'analyst-outreach-email'
        ],
        templates_provided: ['analyst-relations-playbook', 'briefing-template'],
        research_provided: true
      }
    })
  }

  return { campaigns }
}