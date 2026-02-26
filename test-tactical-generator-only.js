// Test tactical generator in isolation

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const mockEnrichedData = {
  positioning: {
    name: 'The Unified DevOps Intelligence Platform',
    keyMessages: [
      'Eliminate tool sprawl',
      'AI-powered insights',
      'Enterprise reliability meets velocity'
    ],
    differentiators: [
      'Only platform combining dev velocity + enterprise reliability'
    ]
  },
  journalists: {
    tier1: [
      { name: 'Sarah Frier', outlet: 'Bloomberg', beat: 'Enterprise tech' },
      { name: 'Mike Isaac', outlet: 'NYT', beat: 'Tech industry' },
      { name: 'Alex Wilhelm', outlet: 'TechCrunch', beat: 'Startups' }
    ]
  },
  knowledgeLibrary: {
    foundational: [
      { type: 'framework', name: 'Jobs-to-be-Done' }
    ],
    pattern_specific: [
      { pattern: 'CHORUS', tactic: 'Multi-stakeholder coordination' }
    ],
    methodologies: [
      { name: 'Developer evangelism' }
    ]
  }
}

const mockPatternSelection = {
  selectedPattern: {
    pattern: 'CHORUS',
    pillarEmphasis: {
      owned: 8,
      relationships: 7,
      events: 6,
      media: 9
    },
    keyMechanics: [
      'Coordinate message across all stakeholders',
      'Leverage analyst relations',
      'Create content hub'
    ]
  }
}

const mockInfluenceStrategies = {
  influenceStrategies: [
    {
      stakeholder: 'IT Directors',
      psychologicalProfile: {
        primaryFear: 'System downtime',
        primaryAspiration: 'Operational excellence',
        decisionTrigger: 'Budget approval deadline'
      },
      positioningAlignment: {
        coreMessage: 'Enterprise reliability meets developer velocity'
      },
      touchpointStrategy: {
        phase1_awareness: {
          objective: 'Make them aware of unified approach'
        },
        phase2_consideration: {
          objective: 'Show proof points of reliability'
        },
        phase3_conversion: {
          objective: 'Remove friction to purchase'
        },
        phase4_advocacy: {
          objective: 'Turn into champions'
        }
      }
    }
  ]
}

const campaignGoal = 'Launch AI-powered DevOps platform to enterprise IT directors'

async function testTacticalGenerator() {
  console.log('🎯 Testing Tactical Generator in isolation (4 phases)...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-tactical-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        enrichedData: mockEnrichedData,
        patternSelection: mockPatternSelection,
        influenceStrategies: mockInfluenceStrategies,
        campaignGoal
      })
    })

    const elapsed = Date.now() - startTime
    console.log(`⏱️  Request completed in ${elapsed}ms\n`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error:', response.status)
      console.error('Details:', errorText)
      return
    }

    const result = await response.json()
    const tacticalOrchestration = result.orchestrationStrategy || result

    console.log('✅ Tactical Orchestration Generated Successfully!\n')

    const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
    phases.forEach((phase, i) => {
      if (tacticalOrchestration[phase]) {
        const p = tacticalOrchestration[phase]
        console.log(`${i+1}. ${phase} (Weeks ${p.weeks})`)
        console.log(`   - Owned Actions: ${p.pillar1_ownedActions?.length || 0}`)
        console.log(`   - Relationships: ${p.pillar2_relationshipOrchestration?.length || 0}`)
        console.log(`   - Events: ${p.pillar3_eventOrchestration?.length || 0}`)
        console.log(`   - Media: ${p.pillar4_mediaEngagement?.length || 0}`)

        // Show sample action from Pillar 1
        if (p.pillar1_ownedActions && p.pillar1_ownedActions.length > 0) {
          const sample = p.pillar1_ownedActions[0]
          console.log(`   Sample: ${sample.contentType} for ${sample.targetStakeholder}`)
          if (sample.keyPoints) {
            console.log(`   Key Points: ${sample.keyPoints.length}`)
          }
        }
      }
    })

    console.log('\n✅ Test Complete!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testTacticalGenerator()
