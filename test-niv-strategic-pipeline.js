#!/usr/bin/env node

/**
 * NIV Strategic Pipeline End-to-End Test
 * Tests the complete flow from query to strategic framework to component handoff
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testStrategicPipeline() {
  console.log('🚀 Testing NIV Strategic Pipeline End-to-End')
  console.log('=' .repeat(60))

  // Test queries that should trigger strategic framework generation
  const testQueries = [
    {
      query: "We need to develop a campaign to respond to Microsoft's new AI partnership announcement",
      expectedComponent: 'campaign',
      description: 'Competitive response campaign'
    },
    {
      query: "Help us plan the launch strategy for our new product next quarter",
      expectedComponent: 'campaign',
      description: 'Product launch strategy'
    },
    {
      query: "Create an executive thought leadership plan to position our CEO as an industry expert",
      expectedComponent: 'campaign',
      description: 'Thought leadership campaign'
    }
  ]

  for (const test of testQueries) {
    console.log(`\n📝 Test: ${test.description}`)
    console.log(`Query: "${test.query}"`)
    console.log('-' .repeat(60))

    try {
      // Step 1: Call NIV Orchestrator
      console.log('\n1️⃣ Calling NIV Orchestrator...')
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: test.query,
          sessionId: 'test-session',
          conversationId: 'test-conversation',
          stage: 'full',
          context: {
            organizationId: 'OpenAI',
            activeModule: 'intelligence'
          },
          conversationHistory: []
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`NIV Orchestrator failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ NIV Response received')
      console.log('   Type:', result.type)
      console.log('   Has Framework:', !!result.framework)
      console.log('   Has Discovery:', !!result.discovery)

      // Check if strategic framework was generated
      if (result.type === 'strategic-framework' && result.framework) {
        console.log('\n2️⃣ Strategic Framework Generated:')
        console.log('   Objective:', result.framework.strategy?.objective)
        console.log('   Target Component:', result.framework.handoff?.targetComponent)
        console.log('   Priority:', result.framework.handoff?.priority)
        console.log('   Execution Type:', result.framework.handoff?.executionType)

        // Verify discovery context
        if (result.discovery) {
          console.log('\n3️⃣ Discovery Context:')
          console.log('   Organization:', result.discovery.organization?.name)
          console.log('   Competitors:', result.discovery.competitors?.direct?.length || 0, 'direct competitors')
          console.log('   Session ID:', result.discovery.session?.conversationId)
        }

        // Verify narrative structure
        if (result.framework.narrative) {
          console.log('\n4️⃣ Narrative Architecture:')
          console.log('   Core Story:', result.framework.narrative.coreStory?.substring(0, 100) + '...')
          console.log('   Messages:', result.framework.narrative.supportingMessages?.length || 0, 'supporting messages')
          console.log('   Proof Points:', result.framework.narrative.proofPoints?.length || 0, 'proof points')
        }

        // Verify execution plan
        if (result.framework.execution) {
          console.log('\n5️⃣ Execution Blueprint:')
          console.log('   Phases:', result.framework.execution.timeline?.phases?.length || 0)
          console.log('   Primary Channels:', result.framework.execution.channels?.primary?.length || 0)
          console.log('   Resources Required:', result.framework.execution.resources?.required?.length || 0)
        }

        // Check if handoff is ready
        if (result.readyForHandoff) {
          console.log('\n✅ Ready for component handoff to:', result.framework.handoff?.targetComponent)

          if (result.framework.handoff?.targetComponent === test.expectedComponent) {
            console.log('✅ Target component matches expected:', test.expectedComponent)
          } else {
            console.log('⚠️ Target component mismatch. Expected:', test.expectedComponent, 'Got:', result.framework.handoff?.targetComponent)
          }
        }

        console.log('\n✨ Test PASSED - Strategic framework generated successfully')
      } else {
        console.log('\n⚠️ No strategic framework generated')
        console.log('   Response type:', result.type)

        if (result.type === 'intelligence-response') {
          console.log('   ℹ️ NIV returned standard intelligence response instead of strategic framework')
          console.log('   This query may not have triggered strategic intent detection')
        }
      }

    } catch (error) {
      console.error('\n❌ Test FAILED:', error.message)
    }

    console.log('\n' + '=' .repeat(60))
  }

  // Test non-strategic queries (should NOT generate frameworks)
  console.log('\n\n📋 Testing Non-Strategic Queries (should return intelligence only)')
  console.log('=' .repeat(60))

  const nonStrategicQueries = [
    "What's the latest news about our competitors?",
    "Show me recent regulatory updates",
    "What are the current market trends?"
  ]

  for (const query of nonStrategicQueries) {
    console.log(`\nQuery: "${query}"`)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: query,
          sessionId: 'test-session',
          stage: 'full',
          context: { organizationId: 'OpenAI' }
        })
      })

      const result = await response.json()

      if (result.type === 'intelligence-response') {
        console.log('✅ Correctly returned intelligence response (not strategic framework)')
      } else if (result.type === 'strategic-framework') {
        console.log('⚠️ Unexpectedly generated strategic framework for non-strategic query')
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
    }
  }

  console.log('\n\n🎯 NIV Strategic Pipeline Test Complete!')
}

// Run the test
testStrategicPipeline().catch(console.error)