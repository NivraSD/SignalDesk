// Test the influence mapper with realistic data
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const mockResearchData = {
  stakeholders: [
    {
      name: "Enterprise IT Directors",
      size: "5,000 decision makers in F500",
      psychology: {
        values: ["Reliability", "Innovation", "Efficiency"],
        fears: ["System downtime", "Security breaches", "Budget overruns"],
        aspirations: ["Be seen as innovation leader", "Reduce operational costs", "Improve team productivity"],
        biases: ["Risk aversion", "Peer validation needed"]
      },
      informationDiet: {
        primarySources: ["TechCrunch", "CIO.com", "Gartner reports"],
        trustedVoices: ["Other CIOs", "Industry analysts", "Technical thought leaders"],
        consumptionHabits: "Read technical blogs daily, attend quarterly conferences"
      },
      decisionTriggers: ["ROI proof with peer validation", "Case studies from similar companies"],
      currentPerceptions: {
        ofOrganization: "Unaware of our solution"
      }
    },
    {
      name: "Engineering Team Leads",
      size: "10,000 technical leaders",
      psychology: {
        values: ["Technical excellence", "Developer experience", "Scalability"],
        fears: ["Technical debt", "Poor developer experience", "Vendor lock-in"],
        aspirations: ["Ship faster", "Attract top engineering talent", "Build cutting-edge systems"],
        biases: ["Prefer open source", "Trust technical communities"]
      },
      informationDiet: {
        primarySources: ["HackerNews", "Reddit r/programming", "Technical blogs"],
        trustedVoices: ["Open source maintainers", "Technical bloggers", "Conference speakers"],
        consumptionHabits: "Daily HackerNews, weekly deep technical reads"
      },
      decisionTriggers: ["Technical deep-dives that show architecture", "Open source contributions"],
      currentPerceptions: {
        ofOrganization: "Unaware"
      }
    }
  ],
  narrativeLandscape: {
    dominantNarratives: [
      {
        narrative: "Cloud infrastructure is complex and expensive",
        source: "Industry publications"
      }
    ],
    narrativeVacuums: [
      {
        opportunity: "No one is talking about developer productivity as reliability metric",
        rationale: "Focus is on uptime, not dev velocity"
      }
    ],
    competitivePositioning: [
      {
        competitor: "AWS",
        positioning: "Massive scale but complex"
      }
    ]
  },
  channelIntelligence: {
    byStakeholder: [
      {
        stakeholder: "Enterprise IT Directors",
        channels: [
          { name: "LinkedIn", engagement: "High" },
          { name: "CIO.com", engagement: "Medium" },
          { name: "Industry conferences", engagement: "High" }
        ]
      },
      {
        stakeholder: "Engineering Team Leads",
        channels: [
          { name: "HackerNews", engagement: "Very High" },
          { name: "Reddit r/programming", engagement: "High" },
          { name: "Technical blogs", engagement: "High" }
        ]
      }
    ]
  }
}

const mockPositioning = {
  name: "The Reliability Revolution",
  description: "Enterprise-grade reliability meets developer velocity",
  tagline: "Ship faster without breaking things",
  keyMessages: [
    "99.99% uptime with instant rollback",
    "Deploy 10x faster than traditional platforms",
    "Built by former AWS engineers who understand scale",
    "Zero-config observability and debugging"
  ],
  differentiators: [
    "Only platform with sub-second rollback",
    "Real-time debugging in production",
    "Open-source core with enterprise features"
  ],
  targetAudiences: ["Enterprise IT Directors", "Engineering Team Leads", "CTOs"],
  opportunities: [
    "Narrative vacuum around developer velocity as reliability metric",
    "Growing frustration with AWS complexity"
  ],
  risks: [
    "May be seen as 'too good to be true' without proof",
    "Need strong peer validation for enterprise adoption"
  ]
}

async function testInfluenceMapper() {
  console.log('🧪 Testing Influence Mapper...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-blueprint-influence-mapper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        researchData: mockResearchData,
        selectedPositioning: mockPositioning,
        campaignGoal: "Position our platform as the solution that combines enterprise reliability with developer velocity, targeting F500 companies",
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

    console.log('✅ Influence Mapper Success!')
    console.log(`⏱️  Time: ${elapsedTime}ms`)
    console.log(`\n📊 Results:`)
    console.log(`   Stakeholders: ${result.influenceStrategies?.length || 0}`)

    result.influenceStrategies?.forEach((strategy, i) => {
      console.log(`\n   ${i + 1}. ${strategy.stakeholder}`)
      console.log(`      Primary Fear: ${strategy.psychologicalProfile?.primaryFear}`)
      console.log(`      Primary Aspiration: ${strategy.psychologicalProfile?.primaryAspiration}`)
      console.log(`      Core Message: ${strategy.positioningAlignment?.coreMessage}`)
      console.log(`      Influence Levers: ${strategy.influenceLevers?.length || 0}`)

      strategy.influenceLevers?.forEach((lever, j) => {
        console.log(`         - ${lever.lever}: ${lever.positioningMessage}`)
      })
    })

    console.log('\n📄 Full output saved to influence-mapper-output.json')

    // Write to file for inspection
    const fs = require('fs')
    fs.writeFileSync('influence-mapper-output.json', JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testInfluenceMapper()
