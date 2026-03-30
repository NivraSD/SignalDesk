const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testStakeholderOrchestrationBlueprint() {
  console.log('🧪 Testing new stakeholder orchestration blueprint generator...\n')

  try {
    // Get a recent session with Parts 1 and 2
    console.log('📋 Finding recent campaign session with blueprint...')
    const { data: sessions, error: sessionError } = await supabase
      .from('campaign_builder_sessions')
      .select('*')
      .not('blueprint', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    if (sessionError) throw sessionError
    if (!sessions || sessions.length === 0) {
      throw new Error('No sessions found with blueprints')
    }

    // Find a session with both parts
    let session = null
    for (const s of sessions) {
      if (s.blueprint?.part1_strategicFoundation && s.blueprint?.part2_psychologicalInfluence) {
        session = s
        break
      }
    }

    if (!session) {
      throw new Error('No sessions found with Parts 1 & 2 in blueprint')
    }

    console.log(`✅ Found session: ${session.id}`)
    console.log(`   Goal: ${session.campaign_goal}`)
    console.log(`   Stakeholders: ${session.blueprint.part1_strategicFoundation?.targetStakeholders?.length || 0}`)

    // Part 2 can have different structures
    const influenceLeversCount = session.blueprint.part2_psychologicalInfluence?.influenceStrategies?.reduce((sum, s) => sum + (s.influenceLevers?.length || 0), 0)
      || session.blueprint.part2_psychologicalInfluence?.stakeholderProfiles?.reduce((sum, s) => sum + (s.influenceLevers?.length || 0), 0)
      || 0
    console.log(`   Influence levers: ${influenceLeversCount}`)

    // Call new blueprint generator
    console.log('\n🚀 Calling stakeholder orchestration blueprint generator...')
    console.log('   This will generate a priority-sequenced execution plan')

    const startTime = Date.now()

    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-blueprint-stakeholder-orchestration',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          part1_strategicFoundation: session.blueprint.part1_strategicFoundation,
          part2_psychologicalInfluence: session.blueprint.part2_psychologicalInfluence,
          sessionId: session.id,
          orgId: session.org_id
        })
      }
    )

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`\n📡 Response received in ${duration}s`)
    console.log(`   Status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ERROR:', errorText)
      return
    }

    const result = await response.json()

    if (!result.success) {
      console.error('❌ Generation failed:', result.error)
      return
    }

    console.log('\n✅ BLUEPRINT GENERATED!')
    console.log(`   Total stakeholders: ${result.metadata.totalStakeholders}`)
    console.log(`   Total influence levers: ${result.metadata.totalLevers}`)
    console.log(`   Total execution steps: ${result.metadata.totalSteps}`)

    // Show detailed breakdown
    console.log('\n📊 STAKEHOLDER ORCHESTRATION PLAN:\n')

    const plans = result.part3_stakeholderOrchestration.stakeholderOrchestrationPlans

    plans.forEach((plan, idx) => {
      console.log(`${plan.stakeholder.priority}. ${plan.stakeholder.name}`)
      console.log(`   Levers: ${plan.influenceLevers.length}`)

      plan.influenceLevers.forEach((lever, leverIdx) => {
        console.log(`   ${plan.stakeholder.priority}.${lever.priority} ${lever.leverName} (${lever.leverType})`)
        console.log(`       Objective: ${lever.objective}`)
        console.log(`       Steps: ${lever.executionSequence.length}`)

        // Show first 2 steps as examples
        lever.executionSequence.slice(0, 2).forEach((step) => {
          console.log(`       ${step.step}. ${step.label}`)

          const autoContentCount = step.signaldeskAutoExecute?.ownedContent?.length || 0
          const autoMediaCount = step.signaldeskAutoExecute?.mediaEngagement?.length || 0
          const userTaskCount = step.userMustExecute?.length || 0

          if (autoContentCount > 0 || autoMediaCount > 0) {
            console.log(`          🤖 Auto: ${autoContentCount} content + ${autoMediaCount} media`)
          }
          if (userTaskCount > 0) {
            console.log(`          👤 User: ${userTaskCount} tasks`)
          }
          if (step.dependencies.length > 0) {
            console.log(`          ⚠️  Depends on: ${step.dependencies.join(', ')}`)
          }
        })

        if (lever.executionSequence.length > 2) {
          console.log(`       ... and ${lever.executionSequence.length - 2} more steps`)
        }
        console.log('')
      })
    })

    // Count totals
    let totalAutoContent = 0
    let totalMediaEngagement = 0
    let totalUserTasks = 0

    plans.forEach(plan => {
      plan.influenceLevers.forEach(lever => {
        lever.executionSequence.forEach(step => {
          totalAutoContent += step.signaldeskAutoExecute?.ownedContent?.length || 0
          totalMediaEngagement += step.signaldeskAutoExecute?.mediaEngagement?.length || 0
          totalUserTasks += step.userMustExecute?.length || 0
        })
      })
    })

    console.log('📈 EXECUTION SUMMARY:')
    console.log(`   🤖 Signaldesk auto-execute:`)
    console.log(`      - ${totalAutoContent} content pieces`)
    console.log(`      - ${totalMediaEngagement} media engagements`)
    console.log(`   👤 User must execute: ${totalUserTasks} tasks`)
    console.log(`   ⏱️  Total duration: ${duration}s`)

    console.log('\n✅ TEST COMPLETE')
    console.log(`   Session ${session.id} now has Part 3: Stakeholder Orchestration`)

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error(error)
  }
}

testStakeholderOrchestrationBlueprint()
