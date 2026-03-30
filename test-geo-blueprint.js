// Test niv-geo-vector-orchestrator blueprint generation
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// Test with a realistic scenario
const testInput = {
  campaignGoal: 'Increase adoption of our project management SaaS among startup founders',
  objective: 'drive_sales',
  organizationName: 'TaskFlow',
  industry: 'B2B SaaS - Project Management',

  // From content selector (realistic output from our tests)
  selectedContentTypes: {
    automated: [
      { id: 'schema-optimization', label: 'Schema.org Markup Optimization', citation_rate: 75 },
      { id: 'case-study', label: 'Case Studies', citation_rate: 55 },
      { id: 'blog-post', label: 'Blog Posts', citation_rate: 40 },
      { id: 'faq-schema', label: 'FAQ Schema Markup', citation_rate: 60 },
      { id: 'value-proposition', label: 'Value Proposition', citation_rate: 40 },
      { id: 'press-release', label: 'Press Releases', citation_rate: 50 },
      { id: 'infographic', label: 'Infographics', citation_rate: 50 },
      { id: 'competitive-positioning', label: 'Competitive Positioning', citation_rate: 45 }
    ],
    user_assisted: [
      { id: 'comparison-copy', label: 'G2/Capterra Profile Optimization', citation_rate: 65, time_per_week: 1 },
      { id: 'doc-outline', label: 'Documentation Outlines', citation_rate: 70, time_per_week: 2 }
    ]
  },

  constraints: {
    time_per_week: 3,
    technical_capability: 'medium'
  }
}

async function testBlueprintGeneration() {
  console.log('🧪 Testing GEO-VECTOR Blueprint Generator')
  console.log('=' .repeat(80))
  console.log('\n📋 Input:')
  console.log(`Organization: ${testInput.organizationName}`)
  console.log(`Objective: ${testInput.objective}`)
  console.log(`Automated content types: ${testInput.selectedContentTypes.automated.length}`)
  console.log(`User-assisted content types: ${testInput.selectedContentTypes.user_assisted.length}`)
  console.log(`Time available: ${testInput.constraints.time_per_week} hours/week`)

  console.log('\n⏳ Generating blueprint (this may take 30-60 seconds)...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-geo-vector-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(testInput)
      }
    )

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error:', error)
      return
    }

    const result = await response.json()

    if (!result.success || !result.blueprint) {
      console.error('❌ Invalid response:', result)
      return
    }

    const blueprint = result.blueprint

    console.log(`✅ Blueprint generated in ${elapsed}s\n`)
    console.log('='.repeat(80))
    console.log('📊 BLUEPRINT SUMMARY')
    console.log('='.repeat(80))

    // Strategic Foundation
    console.log('\n📍 Strategic Foundation:')
    console.log(`  Objective: ${blueprint.strategicFoundation.primaryObjective}`)
    console.log(`  Target Queries: ${blueprint.strategicFoundation.targetQueries?.length || 0}`)
    if (blueprint.strategicFoundation.targetQueries) {
      blueprint.strategicFoundation.targetQueries.slice(0, 3).forEach(q => {
        console.log(`    - "${q}"`)
      })
    }
    console.log(`  Success Metrics:`)
    blueprint.strategicFoundation.successMetrics?.forEach(m => {
      console.log(`    - ${m}`)
    })

    // AI Platform Priorities
    console.log('\n🤖 AI Platform Priorities:')
    Object.entries(blueprint.strategicFoundation.aiPlatformPriorities || {}).forEach(([platform, data]) => {
      console.log(`  ${platform}: ${data.importance} - ${data.rationale}`)
    })

    // GEO Source Analysis
    console.log('\n🎯 Source Opportunities:')
    Object.entries(blueprint.geoSourceAnalysis?.sourceImportance || {}).forEach(([source, data]) => {
      console.log(`  ${source}: ${data.priority} priority (score: ${data.opportunity_score})`)
      console.log(`    → ${data.reasoning}`)
    })

    // Tactical Plan
    console.log('\n⚡ Automated Actions:')
    blueprint.threeTierTacticalPlan.automated?.forEach((action, idx) => {
      console.log(`  ${idx + 1}. ${action.content_type} (Priority ${action.priority})`)
      console.log(`     Timeline: ${action.timeline}`)
      console.log(`     Citation Rate: ${action.citation_rate}%`)
      console.log(`     SignalDesk does: ${action.what_signaldesk_does.substring(0, 100)}...`)
      console.log(`     User does: ${action.user_action.substring(0, 100)}...`)
    })

    console.log('\n🤝 User-Assisted Actions:')
    blueprint.threeTierTacticalPlan.userAssisted?.forEach((action, idx) => {
      console.log(`  ${idx + 1}. ${action.content_type} (Priority ${action.priority})`)
      console.log(`     Timeline: ${action.timeline}`)
      console.log(`     Citation Rate: ${action.citation_rate}%`)
      console.log(`     Time Required: ${action.time_estimate}`)
      console.log(`     SignalDesk provides:`)
      action.what_signaldesk_does?.slice(0, 2).forEach(item => {
        console.log(`       - ${item}`)
      })
    })

    // Execution Roadmap
    console.log('\n📅 Execution Roadmap (Sample):')
    const weeks = ['week1', 'week2', 'week3', 'week12']
    weeks.forEach(week => {
      if (blueprint.executionRoadmap?.[week]) {
        console.log(`  ${week.toUpperCase()}:`)
        console.log(`    Automated: ${blueprint.executionRoadmap[week].automated?.join(', ')}`)
        console.log(`    User-Assisted: ${blueprint.executionRoadmap[week].user_assisted?.join(', ')}`)
      }
    })

    // Resource Requirements
    console.log('\n💼 Resource Requirements:')
    console.log(`  Automated Content: ${blueprint.resourceRequirements.automated_content?.count} types`)
    console.log(`  User-Assisted Content: ${blueprint.resourceRequirements.user_assisted_content?.count} types`)
    console.log(`  User Time: ${blueprint.resourceRequirements.automated_content?.user_time}`)
    console.log(`  Expected Impact: ${blueprint.resourceRequirements.expected_impact}`)
    console.log(`  Total Timeline: ${blueprint.resourceRequirements.total_timeline}`)

    // Validation
    console.log('\n✅ Validation:')

    const automatedCount = blueprint.threeTierTacticalPlan.automated?.length || 0
    const userAssistedCount = blueprint.threeTierTacticalPlan.userAssisted?.length || 0
    const expectedAutomated = testInput.selectedContentTypes.automated.length
    const expectedUserAssisted = testInput.selectedContentTypes.user_assisted.length

    if (automatedCount === expectedAutomated) {
      console.log(`  ✅ All ${expectedAutomated} automated content types included`)
    } else {
      console.log(`  ❌ Expected ${expectedAutomated} automated, got ${automatedCount}`)
    }

    if (userAssistedCount === expectedUserAssisted) {
      console.log(`  ✅ All ${expectedUserAssisted} user-assisted content types included`)
    } else {
      console.log(`  ❌ Expected ${expectedUserAssisted} user-assisted, got ${userAssistedCount}`)
    }

    // Check for schema-optimization priority
    const schemaAction = blueprint.threeTierTacticalPlan.automated?.find(a => a.content_type === 'schema-optimization')
    if (schemaAction && schemaAction.priority === 1) {
      console.log(`  ✅ Schema optimization is priority 1`)
    } else {
      console.log(`  ❌ Schema optimization should be priority 1`)
    }

    // Check roadmap completeness
    const weekCount = Object.keys(blueprint.executionRoadmap || {}).length
    if (weekCount === 12) {
      console.log(`  ✅ Complete 12-week roadmap`)
    } else {
      console.log(`  ⚠️  Roadmap has ${weekCount} weeks (expected 12)`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ Blueprint generation test complete!')
    console.log('='.repeat(80))

    // Save to file for inspection
    const fs = require('fs')
    fs.writeFileSync(
      'test-blueprint-output.json',
      JSON.stringify(blueprint, null, 2)
    )
    console.log('\n📄 Full blueprint saved to: test-blueprint-output.json')

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testBlueprintGeneration().catch(console.error)
