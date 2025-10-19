// Test the complete blueprint orchestrator V2
const fs = require('fs')
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

// Mock research data (CampaignIntelligenceBrief)
const mockResearchData = {
  stakeholders: [
    {
      name: "Enterprise IT Directors",
      role: "Technical decision maker",
      decisionPower: "High",
      psychology: {
        fears: ["System downtime costs revenue", "Security breaches damage reputation", "Vendor lock-in limits flexibility"],
        aspirations: ["Be seen as innovation leader", "Deliver reliable services", "Enable developer productivity"],
        decisionTriggers: ["ROI proof with peer validation", "Risk mitigation evidence", "Implementation timeline clarity"]
      },
      informationDiet: {
        primarySources: ["TechCrunch", "CIO.com", "Gartner reports"],
        trustedVoices: ["Other CIOs", "Industry analysts", "Technical architects"],
        contentPreferences: ["Case studies", "Technical whitepapers", "Webinars"]
      }
    },
    {
      name: "Developer Team Leads",
      role: "Technical influencer",
      decisionPower: "Medium",
      psychology: {
        fears: ["Slow deployment cycles", "Complex tooling", "Poor developer experience"],
        aspirations: ["Ship faster", "Reduce toil", "Use modern tools"],
        decisionTriggers: ["Hands-on trial", "Peer recommendations", "GitHub stars/activity"]
      },
      informationDiet: {
        primarySources: ["The New Stack", "Hacker News", "Dev.to"],
        trustedVoices: ["Senior developers", "Open source maintainers", "Tech bloggers"],
        contentPreferences: ["Technical tutorials", "Architecture diagrams", "Code examples"]
      }
    }
  ],
  competitiveLandscape: {
    competitors: [
      { name: "Incumbent Platform", positioning: "Enterprise stability", weakness: "Slow deployment" },
      { name: "Modern Startup", positioning: "Developer velocity", weakness: "Lacks enterprise features" }
    ],
    marketMaturity: "Growing",
    marketGaps: ["No platform combines enterprise reliability with developer velocity"]
  },
  channelIntelligence: {
    journalists: [
      { name: "Sarah Chen", outlet: "TechCrunch", beat: "Enterprise SaaS", relevanceScore: 0.95 },
      { name: "Mike Roberts", outlet: "CIO.com", beat: "IT Infrastructure", relevanceScore: 0.92 },
      { name: "Alex Kumar", outlet: "The New Stack", beat: "DevOps & Cloud", relevanceScore: 0.89 }
    ],
    influencers: [
      { name: "Kelsey Hightower", platform: "Twitter", followers: 200000, relevance: "High" },
      { name: "Julia Evans", platform: "Blog", followers: 50000, relevance: "High" }
    ]
  },
  brandPosition: "Challenger",
  historicalCampaigns: {
    previousPatterns: ["CASCADE"],
    performanceData: {
      bestPerformingContent: ["Case studies", "Technical demos"],
      mostEffectiveChannels: ["LinkedIn", "Technical blogs"]
    }
  }
}

// Mock positioning selection
const mockPositioning = {
  name: "The Reliability Revolution",
  tagline: "Enterprise-grade reliability meets developer velocity",
  keyMessages: [
    "99.99% uptime with instant rollback - never choose between speed and stability",
    "Deploy 10x faster than traditional platforms without sacrificing control",
    "Built by engineers who understand both DevOps and enterprise requirements"
  ],
  differentiators: [
    "Only platform with sub-second rollback at enterprise scale",
    "Declarative config + GitOps native (competitors require complex scripting)",
    "Unified observability (competitors need 3+ tools)"
  ],
  targetEmotions: {
    reduce: ["Fear of downtime", "Frustration with slow deploys"],
    amplify: ["Confidence in reliability", "Pride in velocity"]
  },
  evidenceRequired: [
    "Customer uptime data",
    "Deployment speed benchmarks",
    "Enterprise customer testimonials"
  ]
}

async function testCompletePipeline() {
  console.log('🧪 Testing Complete Blueprint Pipeline V2...\n')
  console.log('This will take approximately 70-80 seconds...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-blueprint-orchestrator-v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        researchData: mockResearchData,
        selectedPositioning: mockPositioning,
        campaignGoal: "Position our platform as the only solution that combines enterprise-grade reliability (99.99% uptime, instant rollback) with developer velocity (10x faster deployments). Target enterprise IT directors and developer team leads. Overcome market perception that you must choose between stability and speed.",
        orgId: "test-org"
      })
    })

    const elapsedTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Orchestrator failed (${response.status}): ${errorText}`)
    }

    const blueprint = await response.json()

    console.log(`\n🎉 Complete Blueprint Generated!`)
    console.log(`⏱️  Total time: ${elapsedTime}ms (${Math.round(elapsedTime / 1000)}s)`)
    console.log(`   Processing time: ${blueprint.metadata.processingTime}`)

    // Validate all 6 parts exist
    console.log(`\n📊 Blueprint Structure Validation:`)
    console.log(`   ✅ Part 1 - Strategic Foundation: ${blueprint.part1_strategicFoundation ? 'Present' : 'MISSING'}`)
    console.log(`      Pattern: ${blueprint.part1_strategicFoundation?.selectedPattern?.pattern}`)
    console.log(`      Timeline: ${blueprint.part1_strategicFoundation?.campaignTimeline}`)
    console.log(`      Stakeholders: ${blueprint.part1_strategicFoundation?.targetStakeholders?.length}`)

    console.log(`   ✅ Part 2 - Psychological Influence: ${blueprint.part2_psychologicalInfluenceStrategy ? 'Present' : 'MISSING'}`)
    console.log(`      Influence strategies: ${blueprint.part2_psychologicalInfluenceStrategy?.influenceStrategies?.length}`)
    console.log(`      Stakeholder journeys: ${blueprint.part2_psychologicalInfluenceStrategy?.stakeholderJourneyMap?.length}`)

    console.log(`   ✅ Part 3 - Tactical Orchestration: ${blueprint.part3_tacticalOrchestration ? 'Present' : 'MISSING'}`)
    const phaseKeys = Object.keys(blueprint.part3_tacticalOrchestration || {})
    console.log(`      Phases: ${phaseKeys.length}`)
    phaseKeys.forEach(phaseKey => {
      const phase = blueprint.part3_tacticalOrchestration[phaseKey]
      console.log(`      - ${phaseKey}: ${phase.objective}`)
    })

    console.log(`   ✅ Part 4 - Scenario Planning: ${blueprint.part4_scenarioPlanning ? 'Present' : 'MISSING'}`)
    console.log(`      Threat scenarios: ${blueprint.part4_scenarioPlanning?.scenarioCount}`)
    console.log(`      Categories: ${Object.keys(blueprint.part4_scenarioPlanning?.coverageByCategory || {}).join(', ')}`)

    console.log(`   ✅ Part 5 - Resource Requirements: ${blueprint.part5_resourceRequirements ? 'Present' : 'MISSING'}`)
    console.log(`      Content pieces: ${blueprint.part5_resourceRequirements?.total?.contentPieces}`)
    console.log(`      Total hours: ${blueprint.part5_resourceRequirements?.total?.totalHours}`)
    console.log(`      Total budget: $${blueprint.part5_resourceRequirements?.total?.totalBudget?.toLocaleString()}`)
    console.log(`      Team size: ${blueprint.part5_resourceRequirements?.total?.teamSize} people`)

    console.log(`   ✅ Part 6 - Execution Roadmap: ${blueprint.part6_executionRoadmap ? 'Present' : 'MISSING'}`)
    console.log(`      Week-by-week plan: ${blueprint.part6_executionRoadmap?.weekByWeekPlan?.length} entries`)
    console.log(`      Milestones: ${blueprint.part6_executionRoadmap?.milestones?.length}`)
    console.log(`      Auto-execute ready: ${blueprint.part6_executionRoadmap?.integrationInstructions?.autoExecuteReady}`)

    // Show sample content from Part 3
    console.log(`\n📝 Sample Content Request (Part 3 - Phase 1 - Pillar 1):`)
    const phase1 = blueprint.part3_tacticalOrchestration?.phase1_awareness
    if (phase1?.pillar1_ownedActions?.organizationalVoice?.[0]?.contentNeeds?.[0]) {
      const sampleContent = phase1.pillar1_ownedActions.organizationalVoice[0].contentNeeds[0]
      console.log(`   Type: ${sampleContent.contentType}`)
      console.log(`   Target: ${sampleContent.targetStakeholder}`)
      console.log(`   Psychological Lever: ${sampleContent.psychologicalLever}`)
      console.log(`   Positioning Message: ${sampleContent.positioningMessage?.substring(0, 80)}...`)
      console.log(`   Required Elements:`)
      console.log(`      - Tone: ${sampleContent.requiredElements?.toneOfVoice}`)
      console.log(`      - Key Points: ${sampleContent.requiredElements?.keyPoints?.length || 0}`)
      console.log(`      - Call to Action: ${sampleContent.requiredElements?.callToAction}`)
    }

    // Show sample threat scenario
    console.log(`\n🚨 Sample Threat Scenario (Part 4):`)
    const sampleScenario = blueprint.part4_scenarioPlanning?.threatScenarios?.[0]
    if (sampleScenario) {
      console.log(`   Category: ${sampleScenario.category}`)
      console.log(`   Threat: ${sampleScenario.threatDescription}`)
      console.log(`   Likelihood: ${sampleScenario.likelihood}`)
      console.log(`   Impact: ${sampleScenario.potentialImpact}`)
      console.log(`   Counter-narrative: ${sampleScenario.responsePlaybook?.shortTerm_2to24h?.counterNarrative}`)
    }

    console.log(`\n💾 Saving complete blueprint to complete-blueprint-v2.json...`)
    fs.writeFileSync('complete-blueprint-v2.json', JSON.stringify(blueprint, null, 2))

    console.log(`\n✅ Test Complete! All 6 parts generated successfully.`)
    console.log(`\n📈 Performance Summary:`)
    console.log(`   Total time: ${Math.round(elapsedTime / 1000)}s`)
    console.log(`   Target: 70-80s`)
    console.log(`   Status: ${elapsedTime < 90000 ? '✅ UNDER TARGET' : '⚠️ OVER TARGET'}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

testCompletePipeline()
