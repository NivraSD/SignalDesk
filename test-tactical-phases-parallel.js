// Test both tactical phase functions in parallel
const fs = require('fs')
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const influenceStrategies = JSON.parse(fs.readFileSync('influence-mapper-output.json', 'utf-8'))

const mockPatternGuidance = {
  selectedPattern: {
    pattern: "CHORUS",
    rationale: "Multiple independent voices needed for B2B credibility",
    pillarEmphasis: {
      pillar1_owned: "Medium",
      pillar2_relationships: "Heavy",
      pillar3_events: "Medium",
      pillar4_media: "Heavy"
    }
  }
}

const mockResearchData = {
  channelIntelligence: {
    journalists: [
      { name: "Sarah Chen", outlet: "TechCrunch", beat: "Enterprise SaaS", relevanceScore: 0.95 },
      { name: "Mike Roberts", outlet: "CIO.com", beat: "IT Infrastructure", relevanceScore: 0.92 },
      { name: "Alex Kumar", outlet: "The New Stack", beat: "DevOps & Cloud", relevanceScore: 0.89 }
    ]
  }
}

async function callPhaseFunction(endpoint, label) {
  console.log(`⏳ Calling ${label}...`)
  const startTime = Date.now()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      influenceStrategies,
      patternGuidance: mockPatternGuidance,
      researchData: mockResearchData,
      campaignGoal: "Position our platform as combining enterprise reliability with developer velocity",
      orgId: "test-org"
    })
  })

  const elapsedTime = Date.now() - startTime

  if (!response.ok) {
    throw new Error(`${label} failed: ${await response.text()}`)
  }

  const result = await response.json()
  console.log(`✅ ${label} complete in ${elapsedTime}ms`)

  return { result, elapsedTime }
}

async function testParallelPhases() {
  console.log('🧪 Testing Tactical Phases in Parallel...\n')

  const overallStart = Date.now()

  try {
    // Call both functions in parallel
    const [phases12Response, phases34Response] = await Promise.all([
      callPhaseFunction('niv-blueprint-tactical-phases-1-2', 'Phases 1-2'),
      callPhaseFunction('niv-blueprint-tactical-phases-3-4', 'Phases 3-4')
    ])

    const totalTime = Date.now() - overallStart

    console.log(`\n🎉 All Phases Complete!`)
    console.log(`⏱️  Total parallel time: ${totalTime}ms`)
    console.log(`   Phase 1-2 time: ${phases12Response.elapsedTime}ms`)
    console.log(`   Phase 3-4 time: ${phases34Response.elapsedTime}ms`)

    // Merge results
    const fullOrchestration = {
      orchestrationStrategy: {
        ...phases12Response.result.orchestrationStrategy,
        ...phases34Response.result.orchestrationStrategy
      }
    }

    // Count content pieces
    const phases = fullOrchestration.orchestrationStrategy
    let totalContent = 0
    Object.keys(phases).forEach(phaseKey => {
      const phase = phases[phaseKey]
      console.log(`\n   ${phaseKey}:`)
      console.log(`      Objective: ${phase.objective}`)

      if (phase.pillar1_ownedActions?.organizationalVoice) {
        const count = phase.pillar1_ownedActions.organizationalVoice.reduce((sum, voice) =>
          sum + (voice.contentNeeds?.length || 0), 0)
        console.log(`      Pillar 1 content: ${count}`)
        totalContent += count
      }

      if (phase.pillar2_relationshipOrchestration?.tier1Influencers) {
        console.log(`      Pillar 2 influencers: ${phase.pillar2_relationshipOrchestration.tier1Influencers.length}`)
      }

      if (phase.convergenceStrategy) {
        console.log(`      Convergence: ${phase.convergenceStrategy.substring(0, 70)}...`)
      }
    })

    console.log(`\n   Total content pieces: ${totalContent}`)
    console.log('\n📄 Full output saved to tactical-orchestration-complete.json')

    fs.writeFileSync('tactical-orchestration-complete.json', JSON.stringify(fullOrchestration, null, 2))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testParallelPhases()
