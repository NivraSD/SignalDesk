import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlueprintRequest {
  researchData: any // CampaignIntelligenceBrief
  selectedPositioning: any
  campaignGoal: string
  orgId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      researchData,
      selectedPositioning,
      campaignGoal,
      orgId
    } = await req.json() as BlueprintRequest

    console.log('🎯 Blueprint Orchestrator V2:', {
      goal: campaignGoal.substring(0, 50),
      stakeholderCount: researchData?.stakeholders?.length || 0,
      positioning: selectedPositioning?.name || 'Unknown'
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const overallStart = Date.now()

    // ============================================================
    // STAGE 1: Influence Mapping + Pattern Selection (Parallel)
    // ============================================================
    console.log('⏳ Stage 1: Influence mapping + Pattern selection...')
    const stage1Start = Date.now()

    const [influenceResponse, patternResponse] = await Promise.all([
      supabase.functions.invoke('niv-blueprint-influence-mapper', {
        body: {
          researchData,
          selectedPositioning,
          campaignGoal,
          orgId
        }
      }),
      supabase.functions.invoke('niv-blueprint-pattern-selector', {
        body: {
          campaignGoal,
          researchData,
          historicalInsights: researchData?.historicalCampaigns,
          orgId
        }
      })
    ])

    if (influenceResponse.error) {
      throw new Error(`Influence mapper failed: ${influenceResponse.error.message}`)
    }
    if (patternResponse.error) {
      throw new Error(`Pattern selector failed: ${patternResponse.error.message}`)
    }

    const influenceStrategies = influenceResponse.data
    const patternGuidance = patternResponse.data

    const stage1Time = Date.now() - stage1Start
    console.log(`✅ Stage 1 complete in ${stage1Time}ms`)
    console.log(`   Pattern: ${patternGuidance.selectedPattern.pattern}`)
    console.log(`   Influence strategies: ${influenceStrategies.influenceStrategies?.length || 0}`)

    // ============================================================
    // STAGE 2: Tactical Generation + Scenario Planning (Parallel)
    // ============================================================
    console.log('⏳ Stage 2: Tactical phases + Scenario planning...')
    const stage2Start = Date.now()

    const [phases12Response, phases34Response, scenariosResponse] = await Promise.all([
      supabase.functions.invoke('niv-blueprint-tactical-phases-1-2', {
        body: {
          influenceStrategies,
          patternGuidance,
          researchData,
          campaignGoal,
          orgId
        }
      }),
      supabase.functions.invoke('niv-blueprint-tactical-phases-3-4', {
        body: {
          influenceStrategies,
          patternGuidance,
          researchData,
          campaignGoal,
          orgId
        }
      }),
      supabase.functions.invoke('niv-blueprint-scenario-planner', {
        body: {
          campaignGoal,
          researchData,
          selectedPositioning,
          influenceStrategies,
          orgId
        }
      })
    ])

    if (phases12Response.error) {
      throw new Error(`Tactical phases 1-2 failed: ${phases12Response.error.message}`)
    }
    if (phases34Response.error) {
      throw new Error(`Tactical phases 3-4 failed: ${phases34Response.error.message}`)
    }
    if (scenariosResponse.error) {
      throw new Error(`Scenario planner failed: ${scenariosResponse.error.message}`)
    }

    // Merge tactical phases
    const orchestrationStrategy = {
      ...phases12Response.data.orchestrationStrategy,
      ...phases34Response.data.orchestrationStrategy
    }

    const scenarioPlaybooks = scenariosResponse.data

    const stage2Time = Date.now() - stage2Start
    console.log(`✅ Stage 2 complete in ${stage2Time}ms`)
    console.log(`   Phases: ${Object.keys(orchestrationStrategy).length}`)
    console.log(`   Scenarios: ${scenarioPlaybooks.threatScenarios?.length || 0}`)

    // ============================================================
    // STAGE 3: Resource Calculation
    // ============================================================
    console.log('⏳ Stage 3: Resource calculation...')
    const stage3Start = Date.now()

    const resourceResponse = await supabase.functions.invoke('niv-blueprint-resource-calculator', {
      body: {
        orchestrationStrategy,
        scenarioPlaybooks,
        campaignGoal,
        orgId
      }
    })

    if (resourceResponse.error) {
      throw new Error(`Resource calculator failed: ${resourceResponse.error.message}`)
    }

    const resourceData = resourceResponse.data

    const stage3Time = Date.now() - stage3Start
    console.log(`✅ Stage 3 complete in ${stage3Time}ms`)
    console.log(`   Content pieces: ${resourceData.resourceRequirements.total.contentPieces}`)
    console.log(`   Total hours: ${resourceData.resourceRequirements.total.totalHours}`)

    // ============================================================
    // COMPILE FINAL 6-PART BLUEPRINT
    // ============================================================
    const totalTime = Date.now() - overallStart

    const blueprint = {
      metadata: {
        campaignGoal,
        generatedAt: new Date().toISOString(),
        processingTime: `${totalTime}ms`,
        orgId
      },

      // Part 1: Strategic Foundation
      part1_strategicFoundation: {
        positioningStrategy: selectedPositioning,
        selectedPattern: patternGuidance.selectedPattern,
        alternativePattern: patternGuidance.alternativePattern,
        campaignTimeline: patternGuidance.selectedPattern.estimatedTimeline,
        targetStakeholders: researchData?.stakeholders?.map((s: any) => ({
          name: s.name,
          role: s.role,
          decisionPower: s.decisionPower
        })) || []
      },

      // Part 2: Psychological Influence Strategy
      part2_psychologicalInfluenceStrategy: {
        influenceStrategies: influenceStrategies.influenceStrategies,
        stakeholderJourneyMap: influenceStrategies.influenceStrategies?.map((s: any) => ({
          stakeholder: s.stakeholder,
          journeyPhases: {
            awareness: s.touchpointStrategy?.phase1_awareness,
            consideration: s.touchpointStrategy?.phase2_consideration,
            conversion: s.touchpointStrategy?.phase3_conversion,
            advocacy: s.touchpointStrategy?.phase4_advocacy
          }
        })) || []
      },

      // Part 3: Four-Pillar Tactical Orchestration
      part3_tacticalOrchestration: orchestrationStrategy,

      // Part 4: Scenario Planning & Counter-Narratives
      part4_scenarioPlanning: {
        threatScenarios: scenarioPlaybooks.threatScenarios,
        scenarioCount: scenarioPlaybooks.threatScenarios?.length || 0,
        coverageByCategory: scenarioPlaybooks.threatScenarios?.reduce((acc: any, s: any) => {
          acc[s.category] = (acc[s.category] || 0) + 1
          return acc
        }, {}) || {}
      },

      // Part 5: Resource Requirements & Team Planning
      part5_resourceRequirements: {
        ...resourceData.resourceRequirements,
        adaptationMetrics: resourceData.adaptationMetrics
      },

      // Part 6: Execution Roadmap
      part6_executionRoadmap: {
        weekByWeekPlan: generateWeekByWeekPlan(orchestrationStrategy, patternGuidance.selectedPattern.estimatedTimeline),
        milestones: [
          {
            week: 3,
            milestone: "Phase 1 (Awareness) Complete",
            successCriteria: "Stakeholder engagement >2%, content published, influencers engaged"
          },
          {
            week: 6,
            milestone: "Phase 2 (Consideration) Complete",
            successCriteria: "Stakeholder progression rate >40%, events executed, media coverage achieved"
          },
          {
            week: 9,
            milestone: "Phase 3 (Conversion) Complete",
            successCriteria: "Conversion actions initiated, decision triggers activated"
          },
          {
            week: 12,
            milestone: "Phase 4 (Advocacy) Complete",
            successCriteria: "Customer advocates activated, case studies published"
          }
        ],
        integrationInstructions: {
          forNivContentIntelligent: "This blueprint contains structured content requests. Each contentNeed includes: contentType, targetStakeholder, psychologicalLever, positioningMessage, messageFraming, requiredElements (toneOfVoice, keyPoints, proofPoints, callToAction), timing, distributionChannels. Pass these to niv-content-intelligent-v2 for actual content generation.",
          autoExecuteReady: true,
          contentGenerationOrder: "Generate Phase 1 content first, then Phase 2, etc. Each phase builds on previous."
        }
      }
    }

    console.log(`\n🎉 Complete Blueprint Generated!`)
    console.log(`   Total time: ${totalTime}ms`)
    console.log(`   Stage 1 (Influence + Pattern): ${stage1Time}ms`)
    console.log(`   Stage 2 (Tactical + Scenarios): ${stage2Time}ms`)
    console.log(`   Stage 3 (Resources): ${stage3Time}ms`)
    console.log(`   Content pieces: ${resourceData.resourceRequirements.total.contentPieces}`)
    console.log(`   Total hours: ${resourceData.resourceRequirements.total.totalHours}`)
    console.log(`   Team size: ${resourceData.resourceRequirements.total.teamSize}`)

    return new Response(
      JSON.stringify(blueprint),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Blueprint orchestrator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to generate week-by-week execution plan
function generateWeekByWeekPlan(orchestrationStrategy: any, timeline: string) {
  const weeks = []
  const phaseKeys = Object.keys(orchestrationStrategy)

  // Phase 1: Weeks 1-3
  if (phaseKeys[0]) {
    const phase = orchestrationStrategy[phaseKeys[0]]
    weeks.push({
      week: 1,
      phase: "Phase 1 - Awareness",
      focus: phase.messageTheme || "Establish awareness",
      activities: [
        "Launch owned content (Pillar 1)",
        "Initiate influencer outreach (Pillar 2)",
        "Register for target events (Pillar 3)",
        "Begin journalist briefings (Pillar 4)"
      ]
    })
  }

  // Phase 2: Weeks 4-6
  if (phaseKeys[1]) {
    const phase = orchestrationStrategy[phaseKeys[1]]
    weeks.push({
      week: 4,
      phase: "Phase 2 - Consideration",
      focus: phase.messageTheme || "Drive consideration",
      activities: [
        "Publish deeper content (Pillar 1)",
        "Activate influencer advocacy (Pillar 2)",
        "Execute event presence (Pillar 3)",
        "Secure media coverage (Pillar 4)"
      ]
    })
  }

  // Phase 3: Weeks 7-9
  if (phaseKeys[2]) {
    const phase = orchestrationStrategy[phaseKeys[2]]
    weeks.push({
      week: 7,
      phase: "Phase 3 - Conversion",
      focus: phase.messageTheme || "Drive conversions",
      activities: [
        "Launch conversion content (Pillar 1)",
        "Turn influencers into advocates (Pillar 2)",
        "Customer showcase events (Pillar 3)",
        "Success story media pitches (Pillar 4)"
      ]
    })
  }

  // Phase 4: Weeks 10-12
  if (phaseKeys[3]) {
    const phase = orchestrationStrategy[phaseKeys[3]]
    weeks.push({
      week: 10,
      phase: "Phase 4 - Advocacy",
      focus: phase.messageTheme || "Build advocacy",
      activities: [
        "Publish advocacy enablement content (Pillar 1)",
        "Enable reference advocates (Pillar 2)",
        "Speaking opportunities & advisory boards (Pillar 3)",
        "Industry leadership positioning (Pillar 4)"
      ]
    })
  }

  return weeks
}
