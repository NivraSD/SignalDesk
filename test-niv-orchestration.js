// Test NIV's self-orchestration capability with complex queries
async function testNivOrchestration() {
  console.log('=== Testing NIV Self-Orchestration ===\n')

  const testQueries = [
    {
      name: "Complex Multi-Topic Query",
      query: "Give me a comprehensive analysis of OpenAI's position in the AI safety landscape, including their competitors, regulatory challenges, and market opportunities for 2025",
      expectedSteps: 3
    },
    {
      name: "Comparative Analysis",
      query: "Compare OpenAI versus Anthropic versus Google DeepMind in terms of technology, market position, and AI safety approaches",
      expectedSteps: 3
    },
    {
      name: "Deep Dive Research",
      query: "I need a thorough research on AI regulation evolution from 2020 to 2025, including all major legislation, key players, and future implications",
      expectedSteps: 4
    }
  ]

  for (const test of testQueries) {
    console.log(`\n📝 Test: ${test.name}`)
    console.log(`Query: "${test.query}"`)
    console.log('-'.repeat(50))

    try {
      const response = await fetch('http://localhost:3000/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: test.query,
          sessionId: `test-orchestration-${Date.now()}`,
          stage: 'full',
          conversationHistory: [],
          context: {
            organizationId: 'OpenAI',
            conversationId: `test-conv-${Date.now()}`,
            activeModule: 'intelligence'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()

        console.log('✅ Response received')

        if (data.orchestrated) {
          console.log(`🤖 Self-orchestration activated!`)
          console.log(`📋 Research plan: ${data.researchPlan?.steps?.length || 0} steps`)

          if (data.researchPlan?.steps) {
            console.log('\nResearch Steps:')
            data.researchPlan.steps.forEach((step, i) => {
              console.log(`  ${i+1}. [${step.type}] ${step.query.substring(0, 60)}...`)
            })
          }

          console.log(`\n📰 Articles gathered: ${data.framework?.intelligencePipeline?.articles?.length || 0}`)
          console.log(`🔍 Key findings: ${data.keyFindings?.length || 0}`)
        } else {
          console.log('❌ Self-orchestration not triggered')
          console.log('Reason: Query not complex enough or single-step was sufficient')
        }

        console.log(`\nNIV Response Preview: ${data.message.substring(0, 200)}...`)

      } else {
        console.error('❌ Response error:', response.status, await response.text())
      }
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }
}

// Run the test
testNivOrchestration().catch(console.error)