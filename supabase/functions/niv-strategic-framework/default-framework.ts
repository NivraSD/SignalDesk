import { detectCampaignType, buildTacticalElements } from './campaign-detector.ts'

// Generate a default framework matching NivStrategicFramework interface
export function generateDefaultFramework(
  userQuery: string,
  discoveryContext: any,
  targetComponent?: string,
  research?: any
): any {
  const objective = extractObjectiveFromQuery(userQuery)
  const competitors = discoveryContext.competitors?.direct || []

  // Extract articles and key findings from research
  const articles = research?.articles || []
  const keyFindings = research?.keyFindings || []
  const synthesis = research?.synthesis || []

  console.log(`📦 Default framework generator received:`, {
    articles: articles.length,
    keyFindings: keyFindings.length,
    synthesis: Array.isArray(synthesis) ? synthesis.length : 1,
    hasResearch: !!research,
    hasDiscoveryContext: !!discoveryContext
  })

  // Log actual content for debugging
  if (articles.length > 0) {
    console.log(`📰 Framework will include ${articles.length} articles:`)
    articles.slice(0, 3).forEach((article: any, idx: number) => {
      console.log(`  ${idx + 1}. ${article.title || article.headline || 'Untitled'}`)
    })
  } else {
    console.log(`⚠️ WARNING: No articles provided to framework generator!`)
  }

  if (keyFindings.length > 0) {
    console.log(`🔍 Framework will include ${keyFindings.length} key findings`)
  } else {
    console.log(`⚠️ WARNING: No key findings provided to framework generator!`)
  }

  if (synthesis.length > 0) {
    console.log(`📝 Using synthesis for strategy rationale`)
  } else {
    console.log(`⚠️ WARNING: No synthesis provided to framework generator!`)
  }

  // Use enhanced campaign detection
  const campaignType = detectCampaignType(
    userQuery,
    discoveryContext.session?.conversationHistory || [],
    discoveryContext.organization
  )

  console.log(`🎯 Detected campaign type:`, {
    category: campaignType.category,
    type: campaignType.type,
    confidence: campaignType.confidence,
    indicators: campaignType.indicators
  })

  // Get tactical elements for this campaign type
  const tacticalElements = buildTacticalElements(campaignType)

  // Extract user choices and preferences from conversation
  const userChoices = extractUserChoices(discoveryContext.session?.conversationHistory || [])
  const userPriorities = extractUserPriorities(discoveryContext.session?.conversationHistory || [])
  const userConstraints = discoveryContext.session?.constraints || []

  // Create substantive strategy from research AND user choices
  const strategicInsight = createStrategicInsight(articles, keyFindings, synthesis, userQuery, userChoices)
  const executiveSummary = createExecutiveSummary(articles, keyFindings, synthesis, discoveryContext.organization?.name || 'Organization', userPriorities)
  const strategicApproach = createStrategicApproach(articles, keyFindings, campaignType, userChoices)
  const strategicNarrative = createStrategicNarrative(articles, keyFindings, discoveryContext.organization?.name || 'Organization', userChoices)

  // For backwards compatibility, map to simple workflow type
  const workflowTypeMapping: Record<string, string> = {
    'crisis': 'crisis-response',
    'b2bSaas': 'launch',
    'consumerTech': 'launch',
    'medicalDevice': 'launch',
    'fintech': 'launch',
    'cpg': 'launch',
    'repositioning': 'brand-evolution',
    'thoughtLeadership': 'thought-leadership',
    'esg': 'sustainability',
    'employerBrand': 'talent-attraction',
    'integrated': 'campaign',
    'influencer': 'social-campaign',
    'event': 'event-driven',
    'partnership': 'alliance'
  }

  const workflowType = workflowTypeMapping[campaignType.type] || 'strategic-initiative'

  // Generate downstream-optimized components
  const proofPoints = generateProofPoints(articles, keyFindings, synthesis)
  const contentNeeds = generateContentNeeds(campaignType, userQuery, keyFindings)
  const mediaTargets = generateMediaTargets(campaignType, discoveryContext.organization?.industry || 'Technology')
  const timeline = generateTimeline(campaignType, determineUrgency(userQuery, keyFindings))

  const framework = {
    id: generateId(),
    sessionId: discoveryContext.session?.conversationId || 'default',
    organizationId: discoveryContext.organization?.name || 'Organization',
    created_at: new Date(),

    // Core Strategy - Structured for ALL downstream components
    strategy: {
      // PRIMARY FIELDS FOR DOWNSTREAM COMPONENTS (REQUIRED FORMAT)
      objective: objective,  // Single clear objective used by ALL components
      narrative: strategicNarrative,  // Core narrative used by ALL components
      proof_points: proofPoints,  // Evidence/validation used by ALL components

      // COMPONENT-SPECIFIC FIELDS (REQUIRED FORMAT)
      content_needs: contentNeeds,  // For Content Generator component
      media_targets: mediaTargets,  // For Media Outreach component
      timeline_execution: timeline,  // For Strategic Planning component

      // SUPPORTING STRATEGY FIELDS
      executive_summary: executiveSummary,
      rationale: strategicInsight,
      approach: strategicApproach,
      positioning: createPositioningStatement(articles, keyFindings, discoveryContext.organization?.name || 'Organization', userChoices),
      keyMessages: createKeyMessages(articles, keyFindings, userQuery, userChoices, userPriorities),
      urgency: determineUrgency(userQuery, keyFindings)
    },

    // Tactical Breakdown (matching NivStrategicFramework)
    // Use the enhanced tactical elements from campaign detector
    tactics: {
      campaign_elements: tacticalElements.campaign_elements,
      immediate_actions: tacticalElements.immediate_actions,
      week_one_priorities: tacticalElements.week_one_priorities,
      strategic_plays: tacticalElements.strategic_plays,
      success_metrics: tacticalElements.success_metrics,
      // Add campaign-specific metadata
      campaign_metadata: {
        type: campaignType.type,
        category: campaignType.category,
        confidence: campaignType.confidence,
        indicators: campaignType.indicators
      }
    },

    // Intelligence Context (matching NivStrategicFramework)
    intelligence: {
      key_findings: keyFindings.length > 0 ? keyFindings : extractDefaultFindings(articles),
      competitor_moves: extractCompetitorMoves(articles, competitors),
      market_opportunities: extractOpportunities(keyFindings, articles),
      risk_factors: extractRisks(keyFindings, articles),
      supporting_data: {
        articles: articles,
        quotes: extractQuotes(articles),
        metrics: extractMetrics(articles)
      }
    },

    // Discovery Profile (matching NivStrategicFramework)
    discovery: {
      organizationName: discoveryContext.organization?.name || 'Organization',
      industry: discoveryContext.organization?.industry || 'Technology',
      competitors: discoveryContext.competitors?.direct?.map((c: any) => c.name) || [],
      keywords: discoveryContext.organization?.keywords || [],
      stakeholders: {
        executives: discoveryContext.organization?.executives || [],
        investors: discoveryContext.organization?.investors || [],
        regulators: discoveryContext.organization?.regulators || []
      },
      market_position: discoveryContext.organization?.positioning || 'Leader',
      recent_events: discoveryContext.market?.recentEvents || [],
      monitoring_priorities: discoveryContext.organization?.keywords || []
    },

    // Conversation Context (matching NivStrategicFramework)
    conversationContext: {
      originalQuery: userQuery,
      conversationHistory: discoveryContext.session?.conversationHistory || [],
      researchSteps: research?.researchSteps || [{
        query: userQuery,
        findings: keyFindings,
        sources: articles.length
      }],
      userPreferences: discoveryContext.session?.userPreferences || {
        wants: discoveryContext.session?.wants || [],
        doesNotWant: discoveryContext.session?.doesNotWant || [],
        constraints: discoveryContext.session?.constraints || [],
        examples: []
      }
    },

    // Orchestration Instructions (matching NivStrategicFramework)
    orchestration: {
      components_to_activate: campaignType.components,
      workflow_type: workflowType,
      campaign_type: campaignType.type,
      campaign_category: campaignType.category,
      priority: determineUrgency(userQuery, keyFindings) === 'immediate' ? 'urgent' : 'high',
      dependencies: [],
      success_metrics: campaignType.metrics,
      confidence: campaignType.confidence
    },

    // NEW: Content-ready format for auto-execution
    contentStrategy: {
      subject: objective,
      narrative: strategicNarrative,
      target_audiences: extractAudiences(discoveryContext),
      key_messages: createKeyMessages(articles, keyFindings, userQuery, userChoices, userPriorities),
      media_targets: extractMediaOutlets(mediaTargets),
      timeline: determineTimeline(userQuery, keyFindings),
      chosen_approach: strategicApproach,
      tactical_recommendations: tacticalElements.strategic_plays || []
    },

    // NEW: Execution plan (auto-executable vs strategic)
    executionPlan: {
      autoExecutableContent: {
        contentTypes: tacticalElements.campaign_elements?.content_creation || [],
        description: "Content that will be automatically generated",
        estimatedPieces: (tacticalElements.campaign_elements?.content_creation || []).length
      },
      strategicRecommendations: {
        campaigns: buildStrategicCampaigns(campaignType, workflowType)
      }
    }
  }

  console.log(`📊 Default framework returning:`, {
    articlesInFramework: framework.intelligence?.supporting_data?.articles?.length || 0,
    keyFindingsInFramework: framework.intelligence?.key_findings?.length || 0,
    hasIntelligence: !!framework.intelligence,
    hasStrategy: !!framework.strategy,
    hasTactics: !!framework.tactics
  })

  return framework
}

// Helper functions
function extractObjectiveFromQuery(query: string): string {
  // Extract the main objective from the user query
  const lowerQuery = query.toLowerCase()
  if (lowerQuery.includes('create a strategic framework')) {
    return query.replace(/create a strategic framework for/i, '').trim()
  }
  if (lowerQuery.includes('develop')) {
    return query.replace(/develop/i, 'Develop').trim()
  }
  if (lowerQuery.includes('launch')) {
    return query.replace(/launch/i, 'Launch').trim()
  }
  return query
}

function generateId(): string {
  return `framework-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

// Generate proof points for all components to use
function generateProofPoints(articles: any[], keyFindings: string[], synthesis: any[]): string[] {
  const proofPoints: string[] = []

  // Extract data-driven proof points from research
  if (keyFindings.length > 0) {
    keyFindings.slice(0, 3).forEach(finding => {
      if (finding.includes('%') || finding.includes('million') || finding.includes('billion') ||
          finding.includes('growth') || finding.includes('increase')) {
        proofPoints.push(finding)
      }
    })
  }

  // Extract validation from articles
  articles.forEach(article => {
    if (article.metrics || article.stats) {
      proofPoints.push(`${article.source}: ${article.metrics || article.stats}`)
    }
  })

  // Add synthesis insights as proof
  if (synthesis.length > 0 && typeof synthesis[0] === 'string') {
    const insightMatch = synthesis[0].match(/(?:shows?|demonstrates?|proves?|validates?)\s+([^.]+)/i)
    if (insightMatch) {
      proofPoints.push(insightMatch[1])
    }
  }

  // Ensure we have at least 3 proof points
  while (proofPoints.length < 3) {
    proofPoints.push(`Market analysis validates strategic approach`)
  }

  return proofPoints.slice(0, 5)
}

// Generate content needs for Content Generator component with comprehensive types from SignalDesk v1
function generateContentNeeds(campaignType: any, userQuery: string, keyFindings: string[]): any {
  // Determine priority content based on campaign type
  let priorityContent = []

  if (campaignType.category === 'Crisis Management') {
    priorityContent = [
      'Create crisis-response statement addressing the immediate situation with empathy and accountability',
      'Generate Q&A document anticipating media and stakeholder questions about the crisis',
      'Write exec-statement from CEO/leadership addressing all stakeholders with reassurance',
      'Develop social-post templates for Twitter/LinkedIn crisis response (multiple variations)',
      'Draft email communication for internal employee announcement'
    ]
  } else if (campaignType.category === 'Product Launch') {
    priorityContent = [
      'Create press-release announcing product launch with key features and availability',
      'Generate exec-statement from product leadership on vision and innovation',
      'Write media-pitch targeting tech journalists with exclusive angle on launch',
      'Develop social-post campaign for launch day (Twitter thread, LinkedIn post, Instagram)',
      'Draft email announcement for customer base with call-to-action'
    ]
  } else if (campaignType.category === 'Thought Leadership') {
    priorityContent = [
      'Create thought-leadership article on industry trends and future vision (1000+ words)',
      'Generate messaging framework with key talking points for executive speeches',
      'Write social-post series positioning CEO as industry thought leader (LinkedIn focus)',
      'Develop media-pitch for op-ed placement in tier-1 publications',
      'Draft presentation outline with narrative arc for conference keynote'
    ]
  } else {
    priorityContent = [
      'Create press-release with key announcement following AP style guidelines',
      'Generate exec-statement from leadership team for stakeholder communication',
      'Write qa-doc with comprehensive Q&A for potential inquiries',
      'Develop social-post campaign with platform-specific content (Twitter, LinkedIn, Facebook)',
      'Draft media-pitch with personalized angles for target journalists'
    ]
  }

  return {
    priority_content: priorityContent,
    content_types: {
      // Content types we CAN generate directly
      immediate_generation: [
        'press-release: Professional announcement following AP style',
        'media-pitch: Personalized pitches for journalist outreach',
        'exec-statement: CEO/leadership voice with authority',
        'social-post: Platform-optimized posts (Twitter/X, LinkedIn, Facebook)',
        'thought-leadership: Long-form articles demonstrating expertise',
        'email: Campaign emails with personalization',
        'crisis-response: Immediate response with empathy and action',
        'qa-doc: Comprehensive Q&A anticipating all questions',
        'messaging: Strategic framework with key messages'
      ],
      // Content that needs preparation (we can help outline/draft)
      assisted_development: [
        'presentation: We generate slide content and narrative structure',
        'Video scripts: We create scripts, you produce the video',
        'Infographics: We provide data and copy, you design visuals',
        'Webinar content: We develop talking points and Q&A prep',
        'Podcast outlines: We create discussion guides and key points'
      ],
      // Templates and frameworks we provide
      strategic_templates: [
        'Media list recommendations based on your industry',
        'Distribution strategy for each content piece',
        'Editorial calendar with optimal timing',
        'Performance metrics and KPIs to track',
        'Stakeholder mapping for targeted messaging'
      ]
    },
    // Specific executable instructions for content generation
    execution_instructions: {
      'press-release': 'Click Execute > Press Release > AI Generate to create immediate draft',
      'social-post': 'Click Execute > Social Post > select platforms > AI Generate for platform-specific versions',
      'exec-statement': 'Click Execute > Executive Statement > AI Generate with your key points',
      'media-pitch': 'Click Execute > Media Pitch > Add journalist name > AI Generate personalized pitch',
      'thought-leadership': 'Click Execute > Thought Leadership > AI Generate 1000+ word article',
      'crisis-response': 'Click Execute > Crisis Response > AI Generate immediate statement',
      'email': 'Click Execute > Email Campaign > AI Generate with audience targeting',
      'qa-doc': 'Click Execute > Q&A Document > AI Generate comprehensive Q&A',
      'messaging': 'Click Execute > Messaging Framework > AI Generate strategic messages'
    },
    content_capabilities: {
      // What we CAN do automatically
      automated: {
        'press-release': 'Generates complete press release with headline, subhead, body, quotes, boilerplate',
        'crisis-response': 'Creates immediate response with appropriate tone and action steps',
        'social-post': 'Produces platform-specific posts with hashtags, emojis, and character limits',
        'media-pitch': 'Writes personalized pitches with subject lines and news hooks',
        'exec-statement': 'Crafts leadership messages with appropriate gravitas and vision',
        'qa-doc': 'Develops comprehensive Q&A with tough questions and strategic answers',
        'messaging': 'Builds complete messaging framework with proof points',
        'thought-leadership': 'Writes full articles with insights, data, and expertise',
        'email': 'Creates complete email campaigns with subject, preview, body, CTA'
      },
      // What we ASSIST with
      assisted: {
        'presentation': 'We provide: slide content, speaker notes, narrative flow. You create: visual design',
        'video_script': 'We provide: complete script with timing. You create: video production',
        'infographic': 'We provide: data points, copy, structure. You create: visual design',
        'webinar': 'We provide: outline, talking points, Q&A prep. You deliver: live presentation',
        'report': 'We provide: executive summary, key sections. You add: detailed data, appendices'
      }
    },
    // Audience targeting (all content can be adapted)
    audience_adaptation: [
      'Each piece can be versioned for: investors, customers, employees, media, partners, regulators, board, technical, executives, general public',
      'Click "Adapt for Audience" button in content editor to create targeted versions',
      'AI automatically adjusts tone, language, emphasis based on audience'
    ],
    key_topics: keyFindings.slice(0, 5).map(f => f.substring(0, 50)),
    tone: campaignType.category === 'Crisis Management' ? 'serious, empathetic, accountable' : 'confident, innovative, authoritative',
    distribution_channels: ['Website', 'Social media', 'Email', 'Press', 'Internal', 'Direct outreach']
  }
}

// Generate media targets for Media Outreach component
function generateMediaTargets(campaignType: any, industry: string): any {
  const targets: any = {
    tier_1_targets: [],
    beat_categories: {},
    regional_targets: [],
    trade_publications: []
  }

  // Set tier 1 targets based on campaign type and industry
  if (industry.toLowerCase().includes('tech') || industry.toLowerCase().includes('ai')) {
    targets.tier_1_targets = [
      'The New York Times - Technology',
      'Wall Street Journal - Tech Bureau',
      'The Verge',
      'TechCrunch',
      'Wired'
    ]
    targets.beat_categories = {
      'AI/ML Reporters': ['Karen Hao', 'Will Knight', 'Cade Metz'],
      'Enterprise Tech': ['Jordan Novet', 'Frederic Lardinois'],
      'Tech Policy': ['Cat Zakrzewski', 'Ryan Heath']
    }
  } else {
    targets.tier_1_targets = [
      'Wall Street Journal',
      'Financial Times',
      'Bloomberg',
      'Reuters',
      'Associated Press'
    ]
    targets.beat_categories = {
      'Business Reporters': ['General business beat'],
      'Industry Specialists': [`${industry} beat reporters`],
      'Feature Writers': ['Profile and feature writers']
    }
  }

  // Add education/specialized beats if relevant
  if (userQuery.toLowerCase().includes('education') || userQuery.toLowerCase().includes('research')) {
    targets.beat_categories['Education Reporters'] = [
      'EdSurge writers',
      'Chronicle of Higher Education',
      'Education Week'
    ]
  }

  targets.trade_publications = [`${industry} Weekly`, `${industry} Today`, `${industry} Journal`]
  targets.regional_targets = ['Local business journals', 'Regional newspapers', 'City-specific tech media']

  return targets
}

// Generate timeline for Strategic Planning component
function generateTimeline(campaignType: any, urgency: string): any {
  const baseTimeline = {
    immediate: [],
    week_1: [],
    week_2_4: [],
    month_2_3: [],
    ongoing: [],
    milestones: []
  }

  // Immediate actions (24-48 hours)
  baseTimeline.immediate = [
    'Finalize messaging framework',
    'Brief internal stakeholders',
    'Prepare spokesperson',
    urgency === 'immediate' ? 'Issue initial statement' : 'Schedule announcement'
  ]

  // Week 1 (with specific content generation tasks)
  baseTimeline.week_1 = [
    'Day 1: Generate and publish press-release via Execute tab',
    'Day 2: Create and send media-pitch to tier-1 journalists',
    'Day 3-5: Generate daily social-post content for all platforms',
    'Day 6-7: Create exec-statement for stakeholder meetings'
  ]

  // Weeks 2-4
  baseTimeline.week_2_4 = [
    'Sustained media engagement',
    'Content series publication',
    'Partner/influencer activation',
    'First metrics review'
  ]

  // Months 2-3
  baseTimeline.month_2_3 = [
    'Campaign optimization based on data',
    'Expanded content creation',
    'Speaking opportunities',
    'Quarterly review and adjustment'
  ]

  // Ongoing
  baseTimeline.ongoing = [
    'Monitor and respond to coverage',
    'Stakeholder updates',
    'Performance tracking',
    'Narrative reinforcement'
  ]

  // Key milestones
  baseTimeline.milestones = [
    { date: 'Day 1', milestone: 'Campaign launch', success_criteria: 'Initial coverage secured' },
    { date: 'Week 1', milestone: 'Media saturation', success_criteria: '10+ tier-1 placements' },
    { date: 'Month 1', milestone: 'Narrative establishment', success_criteria: 'Key messages adopted' },
    { date: 'Quarter 1', milestone: 'Strategic objectives met', success_criteria: 'Measurable impact achieved' }
  ]

  return baseTimeline
}

function determineUrgency(query: string, keyFindings: string[]): 'immediate' | 'high' | 'medium' | 'low' {
  const queryLower = query.toLowerCase()
  const hasUrgentSignals =
    queryLower.includes('urgent') ||
    queryLower.includes('immediate') ||
    queryLower.includes('crisis') ||
    keyFindings.some(f =>
      f.toLowerCase().includes('urgent') ||
      f.toLowerCase().includes('immediate') ||
      f.toLowerCase().includes('crisis')
    )

  if (hasUrgentSignals) return 'immediate'
  if (queryLower.includes('q1') || queryLower.includes('next quarter')) return 'high'
  if (queryLower.includes('q2') || queryLower.includes('q3')) return 'medium'
  return 'medium'
}

// Legacy functions removed - now using campaign-detector.ts for all tactical planning

function extractDefaultFindings(articles: any[]): string[] {
  const findings: string[] = []

  // Extract substantive findings from articles
  articles.forEach(article => {
    // Get the main insight from the article
    if (article.excerpt || article.summary) {
      const insight = article.excerpt || article.summary
      // Extract the most relevant sentence (first 200 chars)
      const finding = insight.substring(0, 200).trim()
      if (finding) {
        findings.push(finding + (insight.length > 200 ? '...' : ''))
      }
    } else if (article.title || article.headline) {
      findings.push(article.title || article.headline)
    }
  })

  // If no articles, provide strategic defaults
  if (findings.length === 0) {
    findings.push('Strategic positioning opportunity identified in current market dynamics')
    findings.push('Market conditions indicate favorable timing for strategic initiative')
    findings.push('Stakeholder alignment and market readiness support immediate action')
  }

  return findings
}

// Extract specific user choices from conversation history
function extractUserChoices(conversationHistory: any[]): string[] {
  const choices: string[] = []

  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content || ''

      // Look for explicit choices
      if (content.match(/(?:i choose|let's go with|prefer|select|option|definitely|absolutely|yes to)/i)) {
        choices.push(content)
      }

      // Look for specific tactical requests
      if (content.match(/(?:focus on|prioritize|emphasize|highlight|make sure|don't forget|include)/i)) {
        const match = content.match(/(?:focus on|prioritize|emphasize|highlight|include)\s+([^.!?]+)/i)
        if (match) choices.push(match[1].trim())
      }

      // Look for rejections
      if (content.match(/(?:no|not|don't want|avoid|skip|without)/i)) {
        const match = content.match(/(?:don't want|avoid|skip|without)\s+([^.!?]+)/i)
        if (match) choices.push(`AVOID: ${match[1].trim()}`)
      }
    }
  })

  return choices
}

// Extract user priorities from conversation
function extractUserPriorities(conversationHistory: any[]): string[] {
  const priorities: string[] = []

  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content || ''

      // Look for priority indicators
      const priorityMatches = content.match(/(?:most important|key|critical|essential|must have|top priority|main goal)\s+(?:is|are)?\s*([^.!?]+)/gi)
      if (priorityMatches) {
        priorityMatches.forEach(match => {
          const cleaned = match.replace(/(?:most important|key|critical|essential|must have|top priority|main goal)\s+(?:is|are)?\s*/i, '').trim()
          if (cleaned) priorities.push(cleaned)
        })
      }

      // Look for outcome desires
      if (content.match(/(?:want to achieve|goal is|objective is|trying to|need to)/i)) {
        const match = content.match(/(?:want to achieve|goal is|objective is|trying to|need to)\s+([^.!?]+)/i)
        if (match) priorities.push(match[1].trim())
      }
    }
  })

  return priorities
}

// Create substantive strategic content from research AND user choices
function createStrategicInsight(articles: any[], keyFindings: string[], synthesis: any[], userQuery: string, userChoices: string[]): string {
  // Start with synthesis if available
  if (synthesis.length > 0 && typeof synthesis[0] === 'string' && synthesis[0].length > 50) {
    return synthesis[0]
  }

  // Build from key findings
  if (keyFindings.length > 0) {
    const topFindings = keyFindings.slice(0, 3).join(' ')
    // Incorporate user choices
  const choiceContext = userChoices.length > 0 ?
    ` Aligned with your specific requirements: ${userChoices.slice(0, 2).join(', ')}.` : ''

  return `Based on comprehensive analysis: ${topFindings}. This presents a strategic opportunity to ${userQuery.toLowerCase()}.${choiceContext}`
  }

  // Build from article insights
  if (articles.length > 0) {
    const insights = articles.slice(0, 3).map(a => a.excerpt || a.summary || a.title).filter(Boolean)
    if (insights.length > 0) {
      return `Market research indicates: ${insights[0]}. This creates the strategic imperative for action.`
    }
  }

  return `Strategic analysis reveals significant opportunity to ${userQuery.toLowerCase()} based on current market dynamics and competitive positioning.`
}

function createExecutiveSummary(articles: any[], keyFindings: string[], synthesis: any[], orgName: string, userPriorities: string[]): string {
  const hasSubstantiveData = articles.length > 0 || keyFindings.length > 0

  if (hasSubstantiveData) {
    const primaryInsight = keyFindings[0] || (articles[0] && (articles[0].excerpt || articles[0].summary || articles[0].title))
    const marketContext = articles.length > 0 ? `Analysis of ${articles.length} sources reveals ` : ''
    const priorityContext = userPriorities.length > 0 ?
      ` Your priority to ${userPriorities[0]} will guide execution.` : ''
    return `${marketContext}${primaryInsight}. ${orgName} is positioned to capitalize on this opportunity through targeted strategic initiatives${priorityContext}`
  }

  return `${orgName} faces a critical strategic opportunity requiring immediate action. Market conditions, competitive dynamics, and stakeholder readiness align to create optimal timing for strategic initiative execution.`
}

function createStrategicApproach(articles: any[], keyFindings: string[], campaignType: any, userChoices: string[]): string {
  const tactics = campaignType.components.join(', ')
  const confidence = campaignType.confidence > 0.7 ? 'high-confidence' : 'targeted'

  // Filter out AVOID choices
  const avoidChoices = userChoices.filter(c => c.startsWith('AVOID:')).map(c => c.replace('AVOID:', '').trim())
  const includeChoices = userChoices.filter(c => !c.startsWith('AVOID:'))

  if (keyFindings.length > 0) {
    const choiceIntegration = includeChoices.length > 0 ?
      ` Specifically incorporating: ${includeChoices.slice(0, 2).join(', ')}.` : ''
    const avoidContext = avoidChoices.length > 0 ?
      ` Avoiding: ${avoidChoices.slice(0, 2).join(', ')}.` : ''

    return `Execute ${confidence} ${campaignType.category} strategy leveraging ${tactics}. Focus on ${keyFindings[0].substring(0, 100)}...${choiceIntegration}${avoidContext}`
  }

  return `Deploy ${confidence} ${campaignType.category} approach through ${tactics} to achieve strategic objectives.`
}

function createStrategicNarrative(articles: any[], keyFindings: string[], orgName: string, userChoices: string[]): string {
  if (articles.length > 0 && articles[0].excerpt) {
    const context = articles[0].excerpt.substring(0, 150)
    return `${orgName} leads market transformation: ${context}...`
  }

  if (keyFindings.length > 0) {
    return `${orgName} drives industry innovation: ${keyFindings[0].substring(0, 150)}...`
  }

  return `${orgName} shapes the future through strategic leadership and innovative solutions that deliver measurable impact.`
}

function createPositioningStatement(articles: any[], keyFindings: string[], orgName: string, userChoices: string[]): string {
  const hasMarketData = articles.some(a => a.excerpt || a.summary)

  if (hasMarketData) {
    const marketInsight = articles.find(a => a.excerpt || a.summary)
    const positioning = marketInsight.excerpt || marketInsight.summary
    return `${orgName} uniquely positioned where ${positioning.substring(0, 100)}...`
  }

  return `${orgName} stands at the intersection of innovation and execution, delivering transformative solutions that address critical market needs.`
}

function createKeyMessages(articles: any[], keyFindings: string[], userQuery: string, userChoices: string[], userPriorities: string[]): string[] {
  const messages: string[] = []

  // First, add user priority-based messages
  if (userPriorities.length > 0) {
    userPriorities.slice(0, 2).forEach(priority => {
      messages.push(`Delivering on ${priority}`)
    })
  }

  // Then add messages from findings
  if (keyFindings.length > 0) {
    const remainingSlots = Math.max(0, 3 - messages.length)
    keyFindings.slice(0, remainingSlots).forEach(finding => {
      messages.push(finding.substring(0, 150))
    })
  }

  // Extract from articles if needed
  if (messages.length < 3 && articles.length > 0) {
    articles.slice(0, 3 - messages.length).forEach(article => {
      if (article.excerpt) {
        messages.push(article.excerpt.substring(0, 150))
      } else if (article.title) {
        messages.push(article.title)
      }
    })
  }

  // Ensure we have at least 3 messages
  while (messages.length < 3) {
    messages.push(`Strategic initiative to ${userQuery.toLowerCase()}`)
  }

  return messages.slice(0, 5)
}

function extractCompetitorMoves(articles: any[], competitors: any[]): string[] {
  const moves: string[] = []

  articles.forEach(article => {
    const text = ((article.title || '') + ' ' + (article.excerpt || '') + ' ' + (article.summary || '')).toLowerCase()
    competitors.forEach(comp => {
      if (comp.name && text.includes(comp.name.toLowerCase())) {
        const context = article.excerpt ? article.excerpt.substring(0, 150) : (article.summary || article.title || 'Recent activity detected')
        moves.push(`${comp.name}: ${context}`)
      }
    })
  })

  // Add substantive competitive insights if we have articles but no specific competitor mentions
  if (moves.length === 0 && articles.length > 0) {
    articles.slice(0, 3).forEach(article => {
      if (article.excerpt && article.excerpt.toLowerCase().includes('compet')) {
        moves.push(`Market dynamics: ${article.excerpt.substring(0, 150)}`)
      }
    })
  }

  return moves.slice(0, 5)
}

function extractOpportunities(keyFindings: string[], articles: any[]): string[] {
  const opportunities: string[] = []

  // First try to extract from key findings
  keyFindings.forEach(finding => {
    const lower = finding.toLowerCase()
    if (lower.includes('opportunity') || lower.includes('gap') || lower.includes('potential') ||
        lower.includes('growth') || lower.includes('expand') || lower.includes('emerging')) {
      opportunities.push(finding)
    }
  })

  // Then look in articles for opportunity signals
  if (opportunities.length < 3 && articles.length > 0) {
    articles.forEach(article => {
      const content = (article.excerpt || article.summary || article.title || '').toLowerCase()
      if (content.includes('growth') || content.includes('emerging') || content.includes('new')) {
        const opp = article.excerpt ? article.excerpt.substring(0, 200) : (article.summary || article.title)
        if (opp && !opportunities.includes(opp)) {
          opportunities.push(opp)
        }
      }
    })
  }

  // Add strategic defaults if needed
  if (opportunities.length === 0) {
    opportunities.push('Market leadership positioning through strategic narrative control')
    opportunities.push('First-mover advantage in emerging market segment')
    opportunities.push('Stakeholder alignment creating execution momentum')
  }

  return opportunities.slice(0, 5)
}

function extractRisks(keyFindings: string[], articles: any[]): string[] {
  const risks: string[] = []

  // Extract from key findings
  keyFindings.forEach(finding => {
    const lower = finding.toLowerCase()
    if (lower.includes('risk') || lower.includes('threat') || lower.includes('concern') ||
        lower.includes('challenge') || lower.includes('barrier') || lower.includes('difficult')) {
      risks.push(finding)
    }
  })

  // Look in articles for risk indicators
  if (risks.length < 2 && articles.length > 0) {
    articles.forEach(article => {
      const content = (article.excerpt || article.summary || '').toLowerCase()
      if (content.includes('challenge') || content.includes('concern') || content.includes('difficult')) {
        const risk = article.excerpt ? article.excerpt.substring(0, 150) : article.summary
        if (risk && !risks.includes(risk)) {
          risks.push(risk)
        }
      }
    })
  }

  // Strategic risk defaults
  if (risks.length === 0) {
    risks.push('Competitive response requiring agile strategic adjustments')
    risks.push('Market timing and execution velocity considerations')
    risks.push('Stakeholder alignment maintenance throughout execution')
  }

  return risks.slice(0, 5)
}

function extractQuotes(articles: any[]): any[] {
  const quotes: any[] = []

  articles.forEach(article => {
    if (article.quote) {
      quotes.push({
        text: article.quote,
        source: article.source || article.title,
        relevance: 'high'
      })
    }
  })

  return quotes.slice(0, 10)
}

function extractMetrics(articles: any[]): any[] {
  const metrics: any[] = []

  articles.forEach(article => {
    if (article.metrics) {
      metrics.push(...article.metrics)
    }
  })

  return metrics.slice(0, 10)
}

// Helper functions for content-ready format
function extractAudiences(discoveryContext: any): string[] {
  const audiences: string[] = []

  // Extract from stakeholders
  if (discoveryContext?.stakeholders) {
    Object.entries(discoveryContext.stakeholders).forEach(([key, stakeholder]: [string, any]) => {
      if (stakeholder?.role || stakeholder?.name) {
        audiences.push(stakeholder.role || stakeholder.name)
      }
    })
  }

  // Extract from audience analysis if available
  if (discoveryContext?.audiences) {
    audiences.push(...discoveryContext.audiences)
  }

  return audiences.length > 0 ? audiences : ['General public', 'Industry stakeholders', 'Media contacts']
}

function extractMediaOutlets(mediaTargets: any): string[] {
  const outlets: string[] = []

  if (mediaTargets?.tier1) {
    mediaTargets.tier1.forEach((outlet: any) => {
      if (outlet?.name) outlets.push(outlet.name)
    })
  }

  if (mediaTargets?.tier2) {
    mediaTargets.tier2.forEach((outlet: any) => {
      if (outlet?.name) outlets.push(outlet.name)
    })
  }

  if (mediaTargets?.tier3) {
    mediaTargets.tier3.forEach((outlet: any) => {
      if (outlet?.name) outlets.push(outlet.name)
    })
  }

  return outlets.length > 0 ? outlets : ['Industry publications', 'Trade media', 'Business press']
}

function determineTimeline(userQuery: string, keyFindings: any[]): string {
  // Check for time-sensitive keywords in query
  const urgentKeywords = ['urgent', 'immediate', 'asap', 'crisis', 'breaking']
  const shortTermKeywords = ['quick', 'fast', 'short', 'sprint']
  const longTermKeywords = ['long-term', 'sustained', 'ongoing', 'continuous']

  const queryLower = userQuery.toLowerCase()

  if (urgentKeywords.some(kw => queryLower.includes(kw))) {
    return '24-48 hours (urgent response)'
  }

  if (shortTermKeywords.some(kw => queryLower.includes(kw))) {
    return '1-2 weeks (sprint campaign)'
  }

  if (longTermKeywords.some(kw => queryLower.includes(kw))) {
    return '3-6 months (sustained campaign)'
  }

  // Default timeline
  return '30-90 days (standard campaign)'
}

function buildStrategicCampaigns(campaignType: string, workflowType: string): any[] {
  const campaigns: any[] = []

  // Build campaigns based on type
  if (campaignType === 'product-launch' || workflowType === 'product-launch') {
    campaigns.push({
      title: 'Tier-1 Media Offensive',
      type: 'media-relations',
      description: 'Secure coverage in top-tier publications through exclusive briefings and embargo strategy',
      rationale: 'Early tier-1 coverage establishes market authority and drives tier-2/3 coverage',
      timeline: 'Week 1-2 pre-launch',
      executionSteps: [
        'Identify top 10 tier-1 targets based on audience overlap',
        'Craft exclusive angles for each outlet',
        'Schedule embargo briefings 1 week before launch',
        'Prepare comprehensive press materials',
        'Execute coordinated outreach on launch day'
      ],
      resources_needed: [
        'Executive availability for briefings',
        'Professional press kit and assets',
        'Media monitoring tools',
        'PR team coordination'
      ],
      success_metrics: [
        'Minimum 3 tier-1 stories published',
        'Combined reach of 10M+ readers',
        'Positive sentiment score >80%'
      ],
      platform_support: {
        generatable_assets: ['Press release', 'Media pitch', 'FAQ document'],
        templates_provided: ['Email outreach templates', 'Briefing deck outline'],
        research_provided: true
      }
    })

    campaigns.push({
      title: 'Thought Leadership Pipeline',
      type: 'content-marketing',
      description: 'Position executives as industry experts through bylined articles and contributed content',
      rationale: 'Thought leadership builds long-term credibility and organic media relationships',
      timeline: 'Ongoing, launch +30 days',
      executionSteps: [
        'Identify executive thought leadership topics',
        'Pitch byline opportunities to target publications',
        'Draft and refine contributed articles',
        'Coordinate publication timing with launch phases',
        'Amplify published pieces across channels'
      ],
      resources_needed: [
        'Executive subject matter expertise',
        'Professional writing/editing support',
        'Publication relationship management',
        'Social amplification budget'
      ],
      success_metrics: [
        '4-6 bylined articles published quarterly',
        'Placement in target industry publications',
        'Social engagement on published pieces'
      ],
      platform_support: {
        generatable_assets: ['Article drafts', 'Pitch emails', 'Social promotion copy'],
        templates_provided: ['Byline outline templates', 'Publication guidelines'],
        research_provided: true
      }
    })
  }

  if (campaignType === 'crisis-response' || workflowType === 'crisis-response') {
    campaigns.push({
      title: 'Rapid Response Protocol',
      type: 'crisis-communications',
      description: 'Immediate stakeholder communication and media management during crisis events',
      rationale: 'Speed and transparency in crisis response preserve trust and control narrative',
      timeline: 'Immediate activation, first 24-48 hours critical',
      executionSteps: [
        'Activate crisis communication team',
        'Draft holding statement within 2 hours',
        'Notify key stakeholders before media',
        'Prepare Q&A for anticipated questions',
        'Monitor media and social sentiment continuously',
        'Issue comprehensive statement within 24 hours'
      ],
      resources_needed: [
        'Executive decision-making authority',
        '24/7 communication team availability',
        'Legal review and approval process',
        'Real-time monitoring tools'
      ],
      success_metrics: [
        'Holding statement issued <2 hours',
        'All stakeholders notified <4 hours',
        'Negative sentiment contained <48 hours'
      ],
      platform_support: {
        generatable_assets: ['Holding statement', 'Stakeholder email', 'Q&A document'],
        templates_provided: ['Crisis communication checklist', 'Stakeholder notification templates'],
        research_provided: false
      }
    })
  }

  // Generic campaign for other types
  if (campaigns.length === 0) {
    campaigns.push({
      title: 'Integrated Campaign Execution',
      type: 'integrated-campaign',
      description: 'Multi-channel campaign combining earned, owned, and shared media tactics',
      rationale: 'Integrated approach maximizes reach and message consistency across touchpoints',
      timeline: '60-90 days',
      executionSteps: [
        'Align all channels on core messaging',
        'Develop content calendar across channels',
        'Execute coordinated launch sequence',
        'Monitor and optimize based on performance',
        'Measure integrated campaign impact'
      ],
      resources_needed: [
        'Cross-functional team coordination',
        'Content creation resources',
        'Media and advertising budget',
        'Analytics and measurement tools'
      ],
      success_metrics: [
        'Consistent messaging across 5+ channels',
        'Combined reach of target audience',
        'Measurable impact on awareness metrics'
      ],
      platform_support: {
        generatable_assets: ['Content pieces', 'Social posts', 'Email campaigns'],
        templates_provided: ['Campaign calendar', 'Channel playbooks'],
        research_provided: true
      }
    })
  }

  return campaigns
}