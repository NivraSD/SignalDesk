// Test scenario planner in isolation

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
  researchData: {
    narrativeLandscape: {
      industry: 'DevOps & Cloud Infrastructure',
      competitors: [
        {
          name: 'CompetitorA',
          positioning: 'Enterprise-grade reliability',
          strengths: ['Market leader', 'Proven track record'],
          weaknesses: ['Expensive', 'Complex setup', 'Slow innovation']
        },
        {
          name: 'CompetitorB',
          positioning: 'Developer-first simplicity',
          strengths: ['Easy to use', 'Modern tech stack'],
          weaknesses: ['Limited enterprise features', 'Scalability concerns']
        }
      ]
    }
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
    }
  },
  riskFactors: [
    'Competitor FUD campaigns',
    'Enterprise sales cycle delays',
    'Developer adoption resistance'
  ]
}

const campaignGoal = 'Launch AI-powered DevOps platform to enterprise IT directors'

async function testScenarioPlanner() {
  console.log('🎲 Testing Scenario Planner in isolation...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-scenario-planner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        enrichedData: mockEnrichedData,
        patternSelection: mockPatternSelection,
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

    const scenarioPlanning = await response.json()

    console.log('✅ Scenario Planning Generated Successfully!\n')
    console.log('Scenarios:', scenarioPlanning.scenarios?.length || 0)

    if (scenarioPlanning.scenarios) {
      scenarioPlanning.scenarios.forEach((s, i) => {
        console.log(`\n${i+1}. ${s.threat}`)
        console.log(`   Category: ${s.category}`)
        console.log(`   Severity: ${s.severity}`)
        console.log(`   Trigger Signals: ${s.triggerSignals?.length || 0}`)
        console.log(`   Immediate Actions: ${s.immediateActions?.length || 0}`)
      })
    }

    console.log('\n✅ Test Complete!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testScenarioPlanner()
