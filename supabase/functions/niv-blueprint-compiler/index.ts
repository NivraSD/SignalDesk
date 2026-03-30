import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompilerRequest {
  enrichedData: any
  patternSelection: any
  influenceStrategies: any
  tacticalOrchestration: any
  campaignGoal: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      enrichedData,
      patternSelection,
      influenceStrategies,
      tacticalOrchestration,
      campaignGoal
    } = await req.json() as CompilerRequest

    console.log('📦 Blueprint Compiler: Assembling complete blueprint...')

    const startTime = Date.now()

    // PART 1: Strategic Foundation (Assembly - NO AI)
    const part1 = assemblePart1(
      enrichedData,
      patternSelection,
      campaignGoal
    )

    // PART 2: Psychological Influence Strategy (From MCP)
    const part2 = influenceStrategies

    // PART 3: Stakeholder Orchestration (NEW - pass through directly)
    const part3 = tacticalOrchestration.part3_stakeholderOrchestration || tacticalOrchestration.orchestrationStrategy

    // Check if we have new stakeholder orchestration structure
    const isNewStructure = !!tacticalOrchestration.part3_stakeholderOrchestration

    // PART 4: Resource Requirements (Calculation - NO AI)
    // Skip calculation for new structure (will implement later)
    const part4 = isNewStructure ? { status: 'pending', message: 'Resource calculation for stakeholder orchestration coming soon' } : calculatePart4(part3, enrichedData)

    // PART 5: Execution Roadmap (Template - NO AI)
    // Skip for new structure (will implement later)
    const part5 = isNewStructure ? { status: 'pending', message: 'Execution roadmap for stakeholder orchestration coming soon' } : generatePart5(part3, part4)

    // PART 6: Content & Action Inventory
    // Skip for new structure (will implement later)
    const part6 = isNewStructure ? { status: 'pending', message: 'Content inventory for stakeholder orchestration coming soon' } : generateContentInventory(part3)

    const completeBlueprin = {
      part1_strategicFoundation: part1,
      part2_psychologicalInfluence: part2,
      part3_stakeholderOrchestration: isNewStructure ? part3 : undefined,
      part3_tacticalOrchestration: !isNewStructure ? part3 : undefined,
      part4_resourceRequirements: part4,
      part5_executionRoadmap: part5,
      part6_contentInventory: part6,
      metadata: {
        generatedAt: new Date().toISOString(),
        campaignGoal,
        pattern: patternSelection?.selectedPattern?.pattern,
        stakeholderCount: influenceStrategies?.influenceStrategies?.length || 0,
        journalistCount: enrichedData?.journalists?.tier1?.length || 0,
        totalContentPieces: part4?.totalContentPieces || 0,
        estimatedHours: part4?.totalHours || 0,
        estimatedBudget: part4?.totalBudget || 0
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Blueprint compiled in ${elapsedTime}ms`)

    return new Response(
      JSON.stringify(completeBlueprin),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Compiler error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to compile blueprint'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// PART 1: Strategic Foundation (Assembly - NO AI)
function assemblePart1(enrichedData: any, patternSelection: any, campaignGoal: string) {
  const positioning = enrichedData?.positioning || {}
  const stakeholders = enrichedData?.researchData?.stakeholders || []
  const pattern = patternSelection?.selectedPattern || {}

  return {
    campaignGoal,
    positioning: {
      name: positioning.name,
      tagline: positioning.tagline,
      description: positioning.description,
      keyMessages: positioning.keyMessages || [],
      differentiators: positioning.differentiators || [],
      targetAudiences: positioning.targetAudiences || []
    },
    selectedPattern: {
      pattern: pattern.pattern,
      rationale: pattern.rationale,
      confidence: pattern.confidence,
      pillarEmphasis: pattern.pillarEmphasis,
      keyMechanics: pattern.keyMechanics || []
    },
    alternativePattern: patternSelection?.alternativePattern || {},
    campaignTimeline: {
      totalDuration: '12 weeks',
      phase1: 'Weeks 1-3 (Awareness)',
      phase2: 'Weeks 4-6 (Consideration)',
      phase3: 'Weeks 7-9 (Conversion)',
      phase4: 'Weeks 10-12 (Advocacy)'
    },
    targetStakeholders: stakeholders.map((s: any) => ({
      name: s.name || s.role,
      role: s.role,
      influenceLevel: s.influenceLevel || 'medium',
      primaryFear: s.psychology?.fears?.[0],
      primaryAspiration: s.psychology?.aspirations?.[0]
    }))
  }
}

// PART 4: Resource Requirements (Calculation - NO AI)
function calculatePart4(tacticalOrchestration: any, enrichedData: any) {
  // Count content pieces by phase and pillar
  const phases = [
    tacticalOrchestration.phase1_awareness,
    tacticalOrchestration.phase2_consideration,
    tacticalOrchestration.phase3_conversion,
    tacticalOrchestration.phase4_advocacy
  ]

  let totalContentPieces = 0
  const contentByPhase: any = {}

  phases.forEach((phase: any, index: number) => {
    const phaseName = `phase${index + 1}`
    contentByPhase[phaseName] = {
      pillar1_owned: phase?.pillar1_ownedActions?.contentPieces?.length || 0,
      pillar2_relationships: (phase?.pillar2_relationshipOrchestration?.tier1Influencers?.length || 0) * 2, // 2 pieces per influencer
      pillar3_events: (phase?.pillar3_eventOrchestration?.tier1Events?.length || 0) * 3, // 3 pieces per event
      pillar4_media: (phase?.pillar4_mediaEngagement?.storiesToPitch?.length || 0) * 2 // 2 pieces per story
    }

    totalContentPieces +=
      contentByPhase[phaseName].pillar1_owned +
      contentByPhase[phaseName].pillar2_relationships +
      contentByPhase[phaseName].pillar3_events +
      contentByPhase[phaseName].pillar4_media
  })

  // Estimate hours per content type
  const hoursPerPiece = {
    thought_leadership: 8,
    case_study: 12,
    technical_content: 10,
    social_post: 1,
    press_release: 4,
    presentation: 6,
    video: 16,
    infographic: 8,
    research_brief: 10,
    default: 6
  }

  // Calculate total hours (average 6 hours per piece)
  const totalHours = totalContentPieces * 6

  // Calculate budget ($150/hour blended rate)
  const hourlyRate = 150
  const totalBudget = totalHours * hourlyRate

  // Calculate team size
  // Assume 12 weeks, 40 hours/week per person
  const weeksInCampaign = 12
  const hoursPerWeek = 40
  const totalAvailableHours = weeksInCampaign * hoursPerWeek
  const teamSize = Math.ceil(totalHours / totalAvailableHours)

  // Weekly bandwidth
  const weeklyHours = Math.ceil(totalHours / weeksInCampaign)

  return {
    totalContentPieces,
    contentByPhase,
    totalHours,
    totalBudget,
    teamPlanning: {
      recommendedTeamSize: teamSize,
      weeklyBandwidth: `${weeklyHours} hours/week`,
      teamComposition: [
        { role: 'Content Strategist', count: 1, allocation: '100%' },
        { role: 'Writer/Editor', count: Math.max(1, teamSize - 2), allocation: '100%' },
        { role: 'Designer', count: 1, allocation: '50%' },
        { role: 'Project Manager', count: 1, allocation: '25%' }
      ]
    },
    adaptationMetrics: [
      {
        metric: 'Content Engagement Rate',
        target: '>5% average',
        pivotTrigger: '<2% for 2 consecutive weeks'
      },
      {
        metric: 'Stakeholder Progression',
        target: '30% move from awareness to consideration',
        pivotTrigger: '<15% progression by Week 6'
      },
      {
        metric: 'Media Placements',
        target: '5+ tier1 placements',
        pivotTrigger: '<2 placements by Week 6'
      },
      {
        metric: 'Influencer Engagement',
        target: '10+ active advocates',
        pivotTrigger: '<5 advocates by Week 8'
      }
    ]
  }
}

// PART 5: Execution Roadmap (Template - NO AI)
function generatePart5(tacticalOrchestration: any, resourceRequirements: any) {
  const weeklyPlan = []

  // Weeks 1-3: Phase 1 (Awareness)
  weeklyPlan.push({
    week: 1,
    phase: 'Awareness',
    milestones: [
      'Launch owned content (blog posts, thought leadership)',
      'Initial journalist outreach (tier 1)',
      'Event presence setup',
      'Influencer engagement begins'
    ],
    contentDue: [
      'Thought leadership article',
      'Press release',
      'Social media assets'
    ],
    successCriteria: [
      'All phase 1 content published',
      '3+ journalist responses',
      '5+ social shares'
    ]
  })

  weeklyPlan.push({
    week: 2,
    phase: 'Awareness',
    milestones: [
      'First media placements live',
      'Event participation (if applicable)',
      'Influencer amplification begins'
    ],
    contentDue: [
      'Case study',
      'Event presentation materials',
      'Influencer enablement content'
    ],
    successCriteria: [
      '2+ media mentions',
      'Event leads generated',
      'Influencer content shared'
    ]
  })

  weeklyPlan.push({
    week: 3,
    phase: 'Awareness',
    milestones: [
      'Awareness metrics review',
      'Stakeholder engagement assessment',
      'Phase 2 content prep begins'
    ],
    contentDue: [
      'Technical content',
      'Social proof assets'
    ],
    successCriteria: [
      'Engagement rate >5%',
      'Stakeholder awareness established',
      'Phase 2 pipeline ready'
    ]
  })

  // Weeks 4-6: Phase 2 (Consideration)
  for (let week = 4; week <= 6; week++) {
    weeklyPlan.push({
      week,
      phase: 'Consideration',
      milestones: week === 4 ? [
        'Phase 2 content launch',
        'Deeper stakeholder engagement',
        'Proof point distribution'
      ] : week === 5 ? [
        'Customer stories published',
        'Analyst briefings',
        'Event follow-ups'
      ] : [
        'Consideration metrics review',
        'Stakeholder progression tracking',
        'Phase 3 content prep'
      ],
      contentDue: week === 4 ? [
        'Product comparison content',
        'ROI calculator',
        'Customer testimonials'
      ] : week === 5 ? [
        'Case studies (deep dive)',
        'Technical whitepapers',
        'Webinar content'
      ] : [
        'Decision support tools',
        'FAQ content',
        'Demo materials'
      ],
      successCriteria: week === 6 ? [
        '30% awareness → consideration',
        '5+ tier1 media placements',
        'Phase 3 pipeline ready'
      ] : [
        'Content engagement maintained',
        'Stakeholder questions addressed',
        'Pipeline progressing'
      ]
    })
  }

  // Weeks 7-9: Phase 3 (Conversion)
  for (let week = 7; week <= 9; week++) {
    weeklyPlan.push({
      week,
      phase: 'Conversion',
      milestones: week === 7 ? [
        'Phase 3 content launch',
        'Decision trigger activation',
        'Friction removal content'
      ] : week === 8 ? [
        'Success stories published',
        'Customer showcase events',
        'Reference program launch'
      ] : [
        'Conversion metrics review',
        'Deal acceleration content',
        'Phase 4 content prep'
      ],
      contentDue: week === 7 ? [
        'Implementation guides',
        'Risk mitigation content',
        'Executive briefing materials'
      ] : week === 8 ? [
        'Customer success stories',
        'Reference call prep',
        'Objection handling content'
      ] : [
        'Contract templates',
        'Onboarding guides',
        'Advocacy enablement'
      ],
      successCriteria: week === 9 ? [
        '20% consideration → conversion',
        'Decision triggers activated',
        'Phase 4 pipeline ready'
      ] : [
        'Conversion content performing',
        'Stakeholder objections addressed',
        'Pipeline accelerating'
      ]
    })
  }

  // Weeks 10-12: Phase 4 (Advocacy)
  for (let week = 10; week <= 12; week++) {
    weeklyPlan.push({
      week,
      phase: 'Advocacy',
      milestones: week === 10 ? [
        'Phase 4 content launch',
        'Advocacy program activation',
        'Community building begins'
      ] : week === 11 ? [
        'Customer advocates enabled',
        'Reference program active',
        'Success story distribution'
      ] : [
        'Campaign metrics review',
        'Advocate community established',
        'Long-term engagement plan'
      ],
      contentDue: week === 10 ? [
        'Advocacy toolkit',
        'Community guidelines',
        'Reference program materials'
      ] : week === 11 ? [
        'Customer-led content',
        'Advisory board materials',
        'Speaking opportunity prep'
      ] : [
        'Final success stories',
        'Campaign retrospective',
        'Ongoing engagement plan'
      ],
      successCriteria: week === 12 ? [
        '10+ active advocates',
        'Self-sustaining community',
        'Campaign goals achieved'
      ] : [
        'Advocacy content shared',
        'References activated',
        'Community engaged'
      ]
    })
  }

  return {
    weeklyPlan,
    integrationInstructions: {
      contentGeneration: {
        service: 'niv-content-intelligent-v2',
        input: 'Content requests from Part 3 (tacticalOrchestration)',
        process: 'Each content piece includes psychologicalLever, positioningMessage, and requiredElements',
        output: 'Actual content ready for distribution',
        automation: 'Can be triggered automatically from Part 3 structure'
      },
      autoExecuteReady: true,
      autoExecuteRequirements: [
        'Part 3 contentPieces have full structured requests',
        'Psychological context included for each piece',
        'Distribution channels specified',
        'Success metrics defined'
      ]
    },
    milestoneTracking: {
      phase1: {
        name: 'Awareness',
        weeks: '1-3',
        keyMilestone: 'Stakeholder awareness established',
        successMetric: 'Engagement rate >5%, 3+ media mentions'
      },
      phase2: {
        name: 'Consideration',
        weeks: '4-6',
        keyMilestone: '30% awareness → consideration progression',
        successMetric: '5+ tier1 media placements, stakeholder engagement deepened'
      },
      phase3: {
        name: 'Conversion',
        weeks: '7-9',
        keyMilestone: 'Decision triggers activated',
        successMetric: '20% consideration → conversion, objections addressed'
      },
      phase4: {
        name: 'Advocacy',
        weeks: '10-12',
        keyMilestone: 'Advocate community established',
        successMetric: '10+ active advocates, self-sustaining community'
      }
    }
  }
}

// PART 6: Content & Action Inventory
function generateContentInventory(tacticalOrchestration: any) {
  const signaldeskActions = []
  const organizationActions = []

  const phases = [
    { name: 'phase1_awareness', weeks: '1-3' },
    { name: 'phase2_consideration', weeks: '4-6' },
    { name: 'phase3_conversion', weeks: '7-9' },
    { name: 'phase4_advocacy', weeks: '10-12' }
  ]

  phases.forEach(({ name, weeks }) => {
    const phase = tacticalOrchestration[name]
    if (!phase) return

    // Pillar 1: Owned Content (Signaldesk)
    if (phase.pillar1_ownedActions) {
      phase.pillar1_ownedActions.forEach((action: any) => {
        signaldeskActions.push({
          phase: name,
          weeks,
          pillar: 'Owned Content',
          contentType: action.contentType,
          targetStakeholder: action.targetStakeholder,
          positioningMessage: action.positioningMessage,
          psychologicalLever: action.psychologicalLever,
          timing: action.timing,
          channels: action.channels,
          requiredElements: action.requiredElements,
          executionOwner: 'signaldesk',
          autoExecuteReady: true,
          readyForNivContent: true
        })
      })
    }

    // Pillar 2: Relationships (Organization)
    if (phase.pillar2_relationshipOrchestration) {
      phase.pillar2_relationshipOrchestration.forEach((action: any) => {
        organizationActions.push({
          phase: name,
          weeks,
          pillar: 'Relationships',
          who: action.who,
          action: action.action,
          timing: action.timing,
          goal: action.goal,
          executionOwner: 'organization',
          autoExecuteReady: false,
          userMustComplete: true
        })
      })
    }

    // Pillar 3: Events (Organization)
    if (phase.pillar3_eventOrchestration) {
      phase.pillar3_eventOrchestration.forEach((action: any) => {
        organizationActions.push({
          phase: name,
          weeks,
          pillar: 'Events',
          event: action.event,
          action: action.action,
          timing: action.timing,
          goal: action.goal,
          executionOwner: 'organization',
          autoExecuteReady: false,
          userMustComplete: true
        })
      })
    }

    // Pillar 4: Media Pitches (Signaldesk)
    if (phase.pillar4_mediaEngagement) {
      phase.pillar4_mediaEngagement.forEach((action: any) => {
        signaldeskActions.push({
          phase: name,
          weeks,
          pillar: 'Media Pitches',
          story: action.story,
          journalists: action.journalists,
          timing: action.timing,
          positioningMessage: action.positioningMessage,
          executionOwner: 'signaldesk',
          autoExecuteReady: true,
          readyForNivContent: true
        })
      })
    }
  })

  return {
    summary: {
      totalSignaldeskActions: signaldeskActions.length,
      totalOrganizationActions: organizationActions.length,
      autoExecutableCount: signaldeskActions.length,
      userRequiredCount: organizationActions.length
    },
    signaldeskActions: {
      description: 'Content and pitches that Signaldesk can auto-generate',
      count: signaldeskActions.length,
      items: signaldeskActions
    },
    organizationActions: {
      description: 'Actions that require user execution (events, relationships, approvals)',
      count: organizationActions.length,
      items: organizationActions
    },
    nivContentReadyActions: signaldeskActions.filter(a => a.readyForNivContent),
    executionNotes: [
      'Signaldesk actions can be sent to niv-content-intelligent-v2 for auto-generation',
      'Organization actions require user scheduling, attendance, or relationship building',
      'All content includes psychological context and positioning alignment',
      'Media pitches include real journalist names and contact rationale'
    ]
  }
}
