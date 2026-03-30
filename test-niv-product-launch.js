#!/usr/bin/env node

/**
 * Test NIV with Product Launch Intelligence Prompt
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testProductLaunchPrompt() {
  console.log('🚀 Testing NIV with Product Launch Intelligence Prompt')
  console.log('=' .repeat(60))

  // Use the exact prompt structure from PROMPT_LIBRARY
  const prompt = `Prepare intelligence for our new AI Assistant product launch on January 15, 2025:
1. Analyze 5 recent competitor product launches - what worked/failed
2. Identify optimal announcement timing based on news cycles
3. Find media opportunities to hijack or avoid
4. Predict competitive responses and prepare counters
5. Generate differentiation messages based on market gaps
6. Create crisis scenarios and response plans`

  console.log('📝 Sending prompt to NIV:')
  console.log(prompt)
  console.log('-' .repeat(60))

  try {
    // Call NIV Orchestrator with the product launch prompt
    console.log('\n🤖 Calling NIV Orchestrator...')
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: prompt,
        sessionId: 'product-launch-test',
        conversationId: 'launch-conversation',
        stage: 'full',
        context: {
          organizationId: 'OpenAI',
          activeModule: 'intelligence',
          industry: 'AI/Technology'
        },
        conversationHistory: []
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`NIV Orchestrator failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('\n✅ NIV Response received')
    console.log('   Type:', result.type)
    console.log('   Success:', result.success)

    // Check if strategic framework was generated
    if (result.type === 'strategic-framework' && result.framework) {
      console.log('\n🎯 STRATEGIC FRAMEWORK GENERATED!')
      console.log('=' .repeat(60))

      // Display framework details
      const framework = result.framework

      console.log('\n📋 STRATEGY:')
      console.log('   Objective:', framework.strategy?.objective)
      console.log('   Rationale:', framework.strategy?.rationale)
      console.log('   Time Horizon:', framework.strategy?.timeHorizon)
      console.log('   Success Metrics:', framework.strategy?.successMetrics?.length || 0)
      console.log('   Risks Identified:', framework.strategy?.risks?.length || 0)

      console.log('\n📢 NARRATIVE:')
      console.log('   Core Story:', framework.narrative?.coreStory?.substring(0, 150) + '...')
      console.log('   Supporting Messages:', framework.narrative?.supportingMessages?.length || 0)
      console.log('   Proof Points:', framework.narrative?.proofPoints?.length || 0)

      console.log('\n🗓️ EXECUTION:')
      console.log('   Timeline Phases:', framework.execution?.timeline?.phases?.length || 0)
      if (framework.execution?.timeline?.phases) {
        framework.execution.timeline.phases.forEach((phase, i) => {
          console.log(`     Phase ${i + 1}: ${phase.name} (${phase.startDate} to ${phase.endDate})`)
        })
      }
      console.log('   Primary Channels:', framework.execution?.channels?.primary?.length || 0)
      console.log('   Secondary Channels:', framework.execution?.channels?.secondary?.length || 0)

      console.log('\n🔍 INTELLIGENCE:')
      console.log('   Competitor Moves:', framework.intelligence?.competitorMoves?.length || 0)
      console.log('   Market Signals:', framework.intelligence?.marketSignals?.length || 0)
      console.log('   Opportunity Windows:', framework.intelligence?.opportunities?.length || 0)

      console.log('\n🎯 HANDOFF:')
      console.log('   Target Component:', framework.handoff?.targetComponent)
      console.log('   Priority:', framework.handoff?.priority)
      console.log('   Execution Type:', framework.handoff?.executionType)
      console.log('   Special Instructions:', framework.handoff?.specialInstructions?.length || 0)

      // Check discovery context
      if (result.discovery) {
        console.log('\n🏢 DISCOVERY CONTEXT:')
        console.log('   Organization:', result.discovery.organization?.name)
        console.log('   Industry:', result.discovery.organization?.industry)
        console.log('   Direct Competitors:', result.discovery.competitors?.direct?.length || 0)
        console.log('   Market Trends:', result.discovery.market?.trends?.length || 0)
      }

      console.log('\n✨ SUCCESS! Strategic framework generated for product launch')
      console.log('This framework is ready to be handed off to Campaign Intelligence')

    } else if (result.type === 'intelligence-response') {
      console.log('\n📊 Intelligence Response (No Framework)')
      console.log('NIV returned standard intelligence instead of strategic framework')
      console.log('Message preview:', result.message?.substring(0, 200) + '...')

      console.log('\n⚠️ Note: The prompt should have triggered strategic framework generation')
      console.log('Check that the detectStrategicIntent function recognizes "launch" keyword')
    } else {
      console.log('\n❓ Unknown Response Type:', result.type)
      console.log('Result keys:', Object.keys(result))
    }

  } catch (error) {
    console.error('\n❌ Test FAILED:', error.message)
    console.error('Stack:', error.stack)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('Test complete!')
}

// Run the test
testProductLaunchPrompt().catch(console.error)