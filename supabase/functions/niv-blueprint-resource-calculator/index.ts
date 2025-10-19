import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResourceCalculatorRequest {
  orchestrationStrategy: any // All 4 phases
  scenarioPlaybooks?: any
  campaignGoal: string
  orgId: string
}

// Time estimates per content type (hours)
const CONTENT_CREATION_TIME = {
  'blog-post': 4,
  'case-study': 8,
  'whitepaper': 16,
  'video': 12,
  'infographic': 6,
  'social-post': 0.5,
  'email': 2,
  'landing-page': 6,
  'webinar': 12,
  'podcast': 8,
  'ebook': 20,
  'report': 12,
  'press-release': 3,
  'presentation': 4,
  'default': 4
}

// Budget estimates per content type (USD)
const CONTENT_BUDGET = {
  'blog-post': 500,
  'case-study': 2000,
  'whitepaper': 5000,
  'video': 8000,
  'infographic': 1500,
  'social-post': 100,
  'email': 300,
  'landing-page': 2000,
  'webinar': 3000,
  'podcast': 2500,
  'ebook': 6000,
  'report': 4000,
  'press-release': 1000,
  'presentation': 1500,
  'default': 1000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      orchestrationStrategy,
      scenarioPlaybooks,
      campaignGoal,
      orgId
    } = await req.json() as ResourceCalculatorRequest

    console.log('🎯 Resource Calculator:', {
      goal: campaignGoal.substring(0, 50),
      phaseCount: Object.keys(orchestrationStrategy || {}).length
    })

    const startTime = Date.now()

    // Count content pieces by phase and pillar
    const resourceBreakdown: any = {
      byPhase: {},
      byPillar: {
        pillar1_owned: { contentCount: 0, hours: 0, budget: 0 },
        pillar2_relationships: { contentCount: 0, hours: 0, budget: 0 },
        pillar3_events: { contentCount: 0, hours: 0, budget: 0 },
        pillar4_media: { contentCount: 0, hours: 0, budget: 0 }
      },
      total: {
        contentPieces: 0,
        totalHours: 0,
        totalBudget: 0,
        weeklyHours: 0,
        teamSize: 0
      }
    }

    // Count content pieces across all phases
    Object.keys(orchestrationStrategy).forEach((phaseKey) => {
      const phase = orchestrationStrategy[phaseKey]
      const phaseResources: any = {
        contentCount: 0,
        hours: 0,
        budget: 0,
        contentByType: {}
      }

      // Pillar 1: Owned Actions
      if (phase.pillar1_ownedActions?.organizationalVoice) {
        phase.pillar1_ownedActions.organizationalVoice.forEach((voice: any) => {
          if (voice.contentNeeds) {
            voice.contentNeeds.forEach((content: any) => {
              const contentType = (content.contentType || 'default').toLowerCase()
              const hours = CONTENT_CREATION_TIME[contentType] || CONTENT_CREATION_TIME.default
              const budget = CONTENT_BUDGET[contentType] || CONTENT_BUDGET.default

              phaseResources.contentCount++
              phaseResources.hours += hours
              phaseResources.budget += budget

              resourceBreakdown.byPillar.pillar1_owned.contentCount++
              resourceBreakdown.byPillar.pillar1_owned.hours += hours
              resourceBreakdown.byPillar.pillar1_owned.budget += budget

              phaseResources.contentByType[contentType] = (phaseResources.contentByType[contentType] || 0) + 1
            })
          }
        })
      }

      // Pillar 2: Relationship Orchestration (influencer content)
      if (phase.pillar2_relationshipOrchestration?.tier1Influencers) {
        phase.pillar2_relationshipOrchestration.tier1Influencers.forEach((influencer: any) => {
          if (influencer.engagementStrategy?.contentToCreateForThem) {
            influencer.engagementStrategy.contentToCreateForThem.forEach((content: any) => {
              const contentType = (content.contentType || 'default').toLowerCase()
              const hours = CONTENT_CREATION_TIME[contentType] || CONTENT_CREATION_TIME.default
              const budget = CONTENT_BUDGET[contentType] || CONTENT_BUDGET.default

              phaseResources.contentCount++
              phaseResources.hours += hours
              phaseResources.budget += budget

              resourceBreakdown.byPillar.pillar2_relationships.contentCount++
              resourceBreakdown.byPillar.pillar2_relationships.hours += hours
              resourceBreakdown.byPillar.pillar2_relationships.budget += budget

              phaseResources.contentByType[contentType] = (phaseResources.contentByType[contentType] || 0) + 1
            })
          }
        })
      }

      // Pillar 3: Event Orchestration
      if (phase.pillar3_eventOrchestration?.tier1Events) {
        phase.pillar3_eventOrchestration.tier1Events.forEach((event: any) => {
          if (event.contentSignaldeskGenerates) {
            event.contentSignaldeskGenerates.forEach((content: any) => {
              const contentType = (content.contentType || 'presentation').toLowerCase()
              const hours = CONTENT_CREATION_TIME[contentType] || CONTENT_CREATION_TIME.default
              const budget = CONTENT_BUDGET[contentType] || CONTENT_BUDGET.default

              phaseResources.contentCount++
              phaseResources.hours += hours
              phaseResources.budget += budget

              resourceBreakdown.byPillar.pillar3_events.contentCount++
              resourceBreakdown.byPillar.pillar3_events.hours += hours
              resourceBreakdown.byPillar.pillar3_events.budget += budget

              phaseResources.contentByType[contentType] = (phaseResources.contentByType[contentType] || 0) + 1
            })
          }
        })
      }

      // Pillar 4: Media Engagement
      if (phase.pillar4_mediaEngagement?.storiesToPitch) {
        phase.pillar4_mediaEngagement.storiesToPitch.forEach((story: any) => {
          if (story.contentSignaldeskGenerates) {
            story.contentSignaldeskGenerates.forEach((content: any) => {
              const contentType = (content.contentType || 'press-release').toLowerCase()
              const hours = CONTENT_CREATION_TIME[contentType] || CONTENT_CREATION_TIME.default
              const budget = CONTENT_BUDGET[contentType] || CONTENT_BUDGET.default

              phaseResources.contentCount++
              phaseResources.hours += hours
              phaseResources.budget += budget

              resourceBreakdown.byPillar.pillar4_media.contentCount++
              resourceBreakdown.byPillar.pillar4_media.hours += hours
              resourceBreakdown.byPillar.pillar4_media.budget += budget

              phaseResources.contentByType[contentType] = (phaseResources.contentByType[contentType] || 0) + 1
            })
          }
        })
      }

      resourceBreakdown.byPhase[phaseKey] = phaseResources
      resourceBreakdown.total.contentPieces += phaseResources.contentCount
      resourceBreakdown.total.totalHours += phaseResources.hours
      resourceBreakdown.total.totalBudget += phaseResources.budget
    })

    // Calculate weekly hours and team size (assuming 12-week campaign, 40h/week)
    const campaignWeeks = 12
    resourceBreakdown.total.weeklyHours = Math.round(resourceBreakdown.total.totalHours / campaignWeeks)
    resourceBreakdown.total.teamSize = Math.ceil(resourceBreakdown.total.weeklyHours / 40)

    // Add scenario response content
    if (scenarioPlaybooks?.threatScenarios) {
      const scenarioContentCount = scenarioPlaybooks.threatScenarios.reduce((sum: number, scenario: any) => {
        return sum + (scenario.responsePlaybook?.mediumTerm_1to7d?.contentToCreate?.length || 0)
      }, 0)

      resourceBreakdown.total.scenarioResponseContent = scenarioContentCount
      // Add moderate time for scenario content (assume 4h each)
      const scenarioHours = scenarioContentCount * 4
      resourceBreakdown.total.totalHours += scenarioHours
      resourceBreakdown.total.weeklyHours = Math.round(resourceBreakdown.total.totalHours / campaignWeeks)
      resourceBreakdown.total.teamSize = Math.ceil(resourceBreakdown.total.weeklyHours / 40)
    }

    // Add adaptation metrics
    const adaptationMetrics = {
      performanceTracking: {
        kpis: [
          "Content engagement rate (target: >3% across all pieces)",
          "Stakeholder progression (awareness → consideration → conversion rates)",
          "Pillar effectiveness (which pillars drive most conversions)",
          "Channel performance (which channels engage target stakeholders)",
          "Influence velocity (time from awareness to conversion)"
        ],
        reviewCadence: "Weekly for first 4 weeks, bi-weekly thereafter",
        pivotTriggers: [
          "Content engagement <1.5% for 2 consecutive weeks",
          "Stakeholder progression stalled (same stage for 3+ weeks)",
          "Pillar underperforming by 40%+ vs plan"
        ]
      },
      budgetFlexibility: {
        contingencyRecommendation: "20% of total budget",
        reallocationStrategy: "Shift from underperforming pillar to high-performing pillar within same phase",
        emergencyFund: Math.round(resourceBreakdown.total.totalBudget * 0.1)
      },
      teamAdaptations: {
        scaleUpTriggers: [
          "Campaign velocity increased (compressed timeline)",
          "Additional stakeholder segments identified",
          "Competitive response requires counter-campaign"
        ],
        scaleDownOpportunities: [
          "Content reuse across phases higher than expected",
          "Influencer-generated content exceeds targets",
          "Event strategy consolidated"
        ]
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Resource calculation complete: ${resourceBreakdown.total.contentPieces} pieces, ${resourceBreakdown.total.totalHours}h, $${resourceBreakdown.total.totalBudget} in ${elapsedTime}ms`)

    return new Response(
      JSON.stringify({
        resourceRequirements: resourceBreakdown,
        adaptationMetrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Resource calculator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
