// Test blueprint generation directly with pre-defined research and positioning
// This bypasses the full research and positioning flow

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

// Mock research data (minimal but valid structure)
const mockResearchData = {
  organizationProfile: {
    name: 'TechCorp',
    industry: 'Technology',
    competitors: ['CompetitorA', 'CompetitorB']
  },
  stakeholders: [
    {
      name: 'IT Directors',
      role: 'Technical Decision Maker',
      influenceLevel: 'high',
      psychology: {
        values: ['Reliability', 'Innovation', 'Cost-efficiency'],
        fears: ['System downtime', 'Security breaches', 'Budget overruns'],
        aspirations: ['Operational excellence', 'Digital transformation', 'Career advancement'],
        motivations: ['Proven track record', 'ROI metrics', 'Peer validation']
      },
      decisionTriggers: [
        'Budget approval deadline',
        'System upgrade cycle',
        'Competitive pressure'
      ],
      informationDiet: [
        'TechCrunch',
        'Gartner reports',
        'LinkedIn',
        'Industry conferences'
      ],
      currentPerceptions: {
        ofOrganization: 'Innovative but unproven',
        ofCategory: 'Necessary but risky investment',
        ofCompetitors: 'Established players with track record'
      }
    },
    {
      name: 'Developer Team Leads',
      role: 'Technical Influencer',
      influenceLevel: 'medium',
      psychology: {
        values: ['Developer productivity', 'Code quality', 'Modern tooling'],
        fears: ['Technical debt', 'Vendor lock-in', 'Learning curve'],
        aspirations: ['Faster shipping', 'Better developer experience', 'Team growth'],
        motivations: ['Technical excellence', 'Developer satisfaction', 'Innovation']
      },
      decisionTriggers: [
        'Developer complaints',
        'Deployment bottlenecks',
        'Tool evaluation cycle'
      ],
      informationDiet: [
        'Hacker News',
        'GitHub',
        'Dev.to',
        'Technical blogs'
      ],
      currentPerceptions: {
        ofOrganization: 'Promising but needs validation',
        ofCategory: 'Essential for modern development',
        ofCompetitors: 'Mixed - some good, some bloated'
      }
    },
    {
      name: 'C-Level Executives',
      role: 'Budget Authority',
      influenceLevel: 'high',
      psychology: {
        values: ['Business outcomes', 'Risk mitigation', 'Competitive advantage'],
        fears: ['Failed investments', 'Falling behind competitors', 'Board scrutiny'],
        aspirations: ['Market leadership', 'Operational efficiency', 'Shareholder value'],
        motivations: ['Proven ROI', 'Industry validation', 'Competitive positioning']
      },
      decisionTriggers: [
        'Quarterly review',
        'Competitive threat',
        'Board pressure'
      ],
      informationDiet: [
        'WSJ',
        'Harvard Business Review',
        'Industry analyst briefings',
        'Executive roundtables'
      ],
      currentPerceptions: {
        ofOrganization: 'Emerging player to watch',
        ofCategory: 'Strategic investment area',
        ofCompetitors: 'Established but complacent'
      }
    }
  ],
  narrativeLandscape: {
    industry: 'DevOps & Cloud Infrastructure',
    dominantNarratives: [
      'DevOps transformation is essential for competitiveness',
      'Developer experience drives business outcomes',
      'Cloud-native architectures are the future'
    ],
    emergingThemes: [
      'Platform engineering movement',
      'AI-assisted development',
      'Security-first DevOps'
    ],
    competitors: [
      {
        name: 'CompetitorA',
        positioning: 'Enterprise-grade reliability',
        strengths: ['Market leader', 'Proven track record', 'Large customer base'],
        weaknesses: ['Expensive', 'Complex setup', 'Slow innovation']
      },
      {
        name: 'CompetitorB',
        positioning: 'Developer-first simplicity',
        strengths: ['Easy to use', 'Modern tech stack', 'Fast growing'],
        weaknesses: ['Limited enterprise features', 'Scalability concerns', 'Young company']
      }
    ]
  },
  channelIntelligence: {
    journalists: [
      {
        name: 'Sarah Frier',
        outlet: 'Bloomberg',
        beat: 'Technology',
        tier: 'tier1',
        influence_score: 10
      },
      {
        name: 'Mike Isaac',
        outlet: 'New York Times',
        beat: 'Tech Industry',
        tier: 'tier1',
        influence_score: 10
      },
      {
        name: 'Alex Wilhelm',
        outlet: 'TechCrunch',
        beat: 'Startups & Venture Capital',
        tier: 'tier1',
        influence_score: 9
      }
    ],
    byStakeholder: [
      {
        stakeholder: 'IT Directors',
        informationDiet: ['Gartner', 'Forrester', 'TechCrunch', 'InfoWorld'],
        trustedVoices: ['Industry analysts', 'Peer CIOs', 'Tech influencers']
      },
      {
        stakeholder: 'Developer Team Leads',
        informationDiet: ['Hacker News', 'Dev.to', 'GitHub', 'Stack Overflow'],
        trustedVoices: ['Tech leads at top companies', 'Open source maintainers', 'Conference speakers']
      },
      {
        stakeholder: 'C-Level Executives',
        informationDiet: ['WSJ', 'Bloomberg', 'Harvard Business Review', 'Industry reports'],
        trustedVoices: ['Board members', 'Industry analysts', 'Executive peers']
      }
    ]
  },
  historicalInsights: {
    successfulCampaigns: [
      'Twilio developer-first positioning',
      'Stripe payment infrastructure narrative',
      'Datadog observability category creation'
    ],
    patternRecommendations: [
      'CHORUS pattern works well for B2B DevOps',
      'Multi-stakeholder coordination is critical',
      'Developer evangelism drives bottom-up adoption'
    ]
  },
  competitiveMovements: [
    {
      competitor: 'CompetitorA',
      recentMoves: ['Enterprise AI features', 'Security compliance push']
    },
    {
      competitor: 'CompetitorB',
      recentMoves: ['Series C funding', 'Enterprise tier launch']
    }
  ]
}

// Mock positioning (Option 2 from typical output)
const mockPositioning = {
  id: 2,
  name: 'The Unified DevOps Intelligence Platform',
  tagline: 'One Platform. Complete Visibility. Faster Shipping.',
  description: 'Position as the only platform that unifies development velocity with enterprise reliability through AI-powered insights.',
  keyMessages: [
    'Eliminate tool sprawl with unified platform',
    'AI-powered insights accelerate decision-making',
    'Enterprise reliability meets developer velocity',
    'Ship faster without compromising quality'
  ],
  differentiators: [
    'Only platform combining dev velocity + enterprise reliability',
    'AI-powered predictive insights (not just dashboards)',
    'Single pane of glass across entire DevOps lifecycle',
    'Built by developers, for developers, trusted by enterprises'
  ],
  targetAudiences: [
    'IT Directors seeking operational excellence',
    'Developer Team Leads wanting faster shipping',
    'C-Level Executives focused on digital transformation'
  ],
  opportunities: [
    'Category creation: "DevOps Intelligence" (not just "DevOps Platform")',
    'Developer evangelism program',
    'Executive roundtables on DevOps transformation',
    'Analyst relations to establish thought leadership'
  ],
  confidenceScore: 85
}

const campaignGoal = 'Launch our new AI-powered DevOps platform to enterprise IT directors and developer team leads. Goal is to position as the only solution combining enterprise reliability with developer velocity.'

async function testBlueprintGeneration() {
  console.log('🚀 Testing Blueprint V3 Generation...\n')
  console.log('Campaign Goal:', campaignGoal)
  console.log('Positioning:', mockPositioning.name)
  console.log('Stakeholders:', mockResearchData.stakeholders.length)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-blueprint-orchestrator-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        researchData: mockResearchData,
        selectedPositioning: mockPositioning,
        campaignGoal,
        orgId: 'test-org'
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

    const blueprint = await response.json()

    console.log('✅ Blueprint Generated Successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Performance metrics
    if (blueprint.metadata?.performance) {
      console.log('📊 Performance Metrics:')
      console.log(`   Total Time: ${blueprint.metadata.performance.totalTime}`)
      console.log(`   - Enrichment: ${blueprint.metadata.performance.enrichmentTime}`)
      console.log(`   - Pattern Selection: ${blueprint.metadata.performance.patternSelectionTime}`)
      console.log(`   - AI Generation: ${blueprint.metadata.performance.aiGenerationTime}`)
      console.log(`   - Assembly: ${blueprint.metadata.performance.assemblyTime}`)
      console.log('\n')
    }

    // Blueprint structure
    console.log('📋 Blueprint Structure:')
    console.log(`   Part 1: ${blueprint.part1_strategicFoundation ? '✅' : '❌'} Strategic Foundation`)
    console.log(`   Part 2: ${blueprint.part2_psychologicalInfluence ? '✅' : '❌'} Psychological Influence`)
    console.log(`   Part 3: ${blueprint.part3_tacticalOrchestration ? '✅' : '❌'} Tactical Orchestration`)
    console.log(`   Part 4: ${blueprint.part4_scenarioPlanning ? '✅' : '❌'} Scenario Planning`)
    console.log(`   Part 5: ${blueprint.part5_resourceRequirements ? '✅' : '❌'} Resource Requirements`)
    console.log(`   Part 6: ${blueprint.part6_executionRoadmap ? '✅' : '❌'} Execution Roadmap`)
    console.log('\n')

    // Part 1 details
    if (blueprint.part1_strategicFoundation) {
      console.log('🎯 Part 1: Strategic Foundation')
      console.log(`   Pattern: ${blueprint.part1_strategicFoundation.selectedPattern?.pattern}`)
      console.log(`   Alternative: ${blueprint.part1_strategicFoundation.alternativePattern?.pattern}`)
      console.log(`   Stakeholders: ${blueprint.part1_strategicFoundation.targetStakeholders?.length}`)
      console.log('\n')
    }

    // Part 2 details
    if (blueprint.part2_psychologicalInfluence?.influenceStrategies) {
      console.log('🧠 Part 2: Psychological Influence')
      console.log(`   Strategies: ${blueprint.part2_psychologicalInfluence.influenceStrategies.length}`)
      blueprint.part2_psychologicalInfluence.influenceStrategies.forEach(s => {
        console.log(`   - ${s.stakeholder}: ${s.influenceLevers?.length || 0} levers, 4-phase touchpoint strategy`)
      })
      console.log('\n')
    }

    // Part 3 details
    if (blueprint.part3_tacticalOrchestration) {
      console.log('🎯 Part 3: Tactical Orchestration')
      const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
      phases.forEach(phase => {
        if (blueprint.part3_tacticalOrchestration[phase]) {
          const p = blueprint.part3_tacticalOrchestration[phase]
          console.log(`   ${phase}:`)
          console.log(`     - Owned Actions: ${p.pillar1_ownedActions?.contentPieces?.length || 0} pieces`)
          console.log(`     - Relationships: ${p.pillar2_relationshipOrchestration?.tier1Influencers?.length || 0} tier1 influencers`)
          console.log(`     - Events: ${p.pillar3_eventOrchestration?.tier1Events?.length || 0} tier1 events`)
          console.log(`     - Media: ${p.pillar4_mediaEngagement?.storiesToPitch?.length || 0} stories`)

          // Check for real journalist names
          if (p.pillar4_mediaEngagement?.storiesToPitch) {
            const journalists = p.pillar4_mediaEngagement.storiesToPitch
              .flatMap(s => s.targetJournalists || [])
              .map(j => j.name)
              .filter(Boolean)
            if (journalists.length > 0) {
              console.log(`     - Journalists: ${journalists.slice(0, 3).join(', ')}${journalists.length > 3 ? '...' : ''}`)
            }
          }
        }
      })
      console.log('\n')
    }

    // Part 4 details
    if (blueprint.part4_scenarioPlanning?.scenarios) {
      console.log('🎲 Part 4: Scenario Planning')
      console.log(`   Scenarios: ${blueprint.part4_scenarioPlanning.scenarios.length}`)
      blueprint.part4_scenarioPlanning.scenarios.forEach(s => {
        console.log(`   - ${s.threatTitle} (${s.category})`)
      })
      console.log('\n')
    }

    // Part 5 details
    if (blueprint.part5_resourceRequirements) {
      console.log('📊 Part 5: Resource Requirements')
      console.log(`   Total Content Pieces: ${blueprint.part5_resourceRequirements.totalContentPieces}`)
      console.log(`   Total Hours: ${blueprint.part5_resourceRequirements.totalHours}`)
      console.log(`   Total Budget: $${blueprint.part5_resourceRequirements.totalBudget?.toLocaleString()}`)
      console.log(`   Team Size: ${blueprint.part5_resourceRequirements.teamPlanning?.recommendedTeamSize}`)
      console.log('\n')
    }

    // Part 6 details
    if (blueprint.part6_executionRoadmap) {
      console.log('📅 Part 6: Execution Roadmap')
      console.log(`   Weekly Plan: ${blueprint.part6_executionRoadmap.weeklyPlan?.length} weeks`)
      console.log(`   Auto-Execute Ready: ${blueprint.part6_executionRoadmap.integrationInstructions?.autoExecuteReady ? '✅' : '❌'}`)
      console.log('\n')
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Test Complete!\n')

    // Save to file for inspection
    const fs = require('fs')
    fs.writeFileSync('blueprint-test-output.json', JSON.stringify(blueprint, null, 2))
    console.log('📄 Full blueprint saved to: blueprint-test-output.json\n')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

testBlueprintGeneration()
