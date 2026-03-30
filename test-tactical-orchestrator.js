// Test tactical orchestrator with influence mapper output
const fs = require('fs')
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

// Load influence mapper output
const influenceStrategies = JSON.parse(fs.readFileSync('influence-mapper-output.json', 'utf-8'))

// Mock pattern guidance
const mockPatternGuidance = {
  selectedPattern: {
    pattern: "CHORUS",
    rationale: "Multiple independent voices needed for B2B credibility",
    pillarEmphasis: {
      pillar1_owned: "Medium - Foundation content",
      pillar2_relationships: "Heavy - Key to pattern success",
      pillar3_events: "Medium - Legitimacy building",
      pillar4_media: "Heavy - Third-party validation critical"
    },
    timingStrategy: "Coordinate Pillar 2 and 4 in same weeks for convergence"
  }
}

// Mock research data with journalists
const mockResearchData = {
  channelIntelligence: {
    journalists: [
      {
        name: "Sarah Chen",
        outlet: "TechCrunch",
        beat: "Enterprise SaaS",
        email: "sarah.chen@techcrunch.com",
        relevanceScore: 0.95
      },
      {
        name: "Mike Roberts",
        outlet: "CIO.com",
        beat: "IT Infrastructure",
        email: "mroberts@cio.com",
        relevanceScore: 0.92
      },
      {
        name: "Alex Kumar",
        outlet: "The New Stack",
        beat: "DevOps & Cloud",
        email: "alex@thenewstack.io",
        relevanceScore: 0.89
      }
    ],
    byStakeholder: [
      {
        stakeholder: "Enterprise IT Directors",
        channels: [
          { name: "LinkedIn", engagement: "High" },
          { name: "CIO.com", engagement: "Medium" }
        ]
      },
      {
        stakeholder: "Engineering Team Leads",
        channels: [
          { name: "HackerNews", engagement: "Very High" },
          { name: "Reddit r/programming", engagement: "High" }
        ]
      }
    ]
  }
}

async function testTacticalOrchestrator() {
  console.log('🧪 Testing Tactical Orchestrator...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-blueprint-tactical-orchestrator`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        influenceStrategies: influenceStrategies,
        patternGuidance: mockPatternGuidance,
        researchData: mockResearchData,
        campaignGoal: "Position our platform as the solution that combines enterprise reliability with developer velocity",
        duration: "12 weeks",
        orgId: "test-org"
      })
    })

    const elapsedTime = Date.now() - startTime

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error:', error)
      return
    }

    const result = await response.json()

    console.log('✅ Tactical Orchestrator Success!')
    console.log(`⏱️  Time: ${elapsedTime}ms`)

    const phases = result.orchestrationStrategy || {}
    console.log(`\n📊 Results:`)
    console.log(`   Phases: ${Object.keys(phases).length}`)

    let totalContent = 0
    Object.keys(phases).forEach((phaseKey, i) => {
      const phase = phases[phaseKey]
      console.log(`\n   ${i + 1}. ${phaseKey}`)
      console.log(`      Objective: ${phase.objective}`)
      console.log(`      Duration: ${phase.duration}`)

      if (phase.pillar1_ownedActions?.organizationalVoice) {
        const contentCount = phase.pillar1_ownedActions.organizationalVoice.reduce((sum, voice) =>
          sum + (voice.contentNeeds?.length || 0), 0)
        console.log(`      Pillar 1 content pieces: ${contentCount}`)
        totalContent += contentCount
      }

      if (phase.pillar2_relationshipOrchestration?.tier1Influencers) {
        console.log(`      Pillar 2 influencers: ${phase.pillar2_relationshipOrchestration.tier1Influencers.length}`)
      }

      if (phase.pillar3_eventOrchestration?.tier1Events) {
        console.log(`      Pillar 3 events: ${phase.pillar3_eventOrchestration.tier1Events.length}`)
      }

      if (phase.pillar4_mediaEngagement?.outletStrategy) {
        console.log(`      Pillar 4 outlets: ${phase.pillar4_mediaEngagement.outletStrategy.length}`)
      }

      if (phase.convergenceStrategy) {
        console.log(`      Convergence: ${phase.convergenceStrategy.substring(0, 80)}...`)
      }
    })

    console.log(`\n   Total content pieces: ${totalContent}`)
    console.log('\n📄 Full output saved to tactical-orchestrator-output.json')

    fs.writeFileSync('tactical-orchestrator-output.json', JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testTacticalOrchestrator()
