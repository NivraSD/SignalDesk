// Test NIV Research Functionality
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const NIV_EDGE_URL = `${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`

async function testNivResearch() {
  console.log('🧪 Testing NIV Research Functionality...\n')

  // Test 1: Simple research query
  console.log('📋 Test 1: Simple research about OpenAI')
  const test1Message = "What is happening with OpenAI lately?"

  try {
    // Stage 1: Acknowledgment
    console.log('  → Stage 1: Getting acknowledgment...')
    const ackResponse = await fetch(NIV_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: test1Message,
        organizationId: 'openai',
        stage: 'acknowledge',
        sessionId: `test-${Date.now()}`,
        context: { activeModule: 'intelligence' }
      })
    })

    const ackData = await ackResponse.json()
    console.log('  ✅ Acknowledgment:', ackData.message)
    console.log('  📊 Strategy:', ackData.strategy)

    // Stage 2: Full response
    console.log('\n  → Stage 2: Getting full research response...')
    const fullResponse = await fetch(NIV_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: test1Message,
        organizationId: 'openai',
        stage: 'full',
        sessionId: ackData.sessionId,
        context: { activeModule: 'intelligence' }
      })
    })

    const fullData = await fullResponse.json()

    if (fullData.success) {
      console.log('  ✅ Research completed successfully!')
      console.log('  📄 Response preview:', fullData.message?.substring(0, 200) + '...')
      console.log('  🔧 Tools used:', fullData.toolsUsed || 'N/A')
    } else {
      console.error('  ❌ Research failed:', fullData.error)
    }

  } catch (error) {
    console.error('  ❌ Test 1 failed:', error.message)
  }

  // Test 2: Competitor monitoring query
  console.log('\n📋 Test 2: Competitor monitoring')
  const test2Message = "Show me the latest news about Anthropic"

  try {
    // Stage 1: Acknowledgment
    console.log('  → Stage 1: Getting acknowledgment...')
    const ackResponse = await fetch(NIV_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: test2Message,
        organizationId: 'openai',
        stage: 'acknowledge',
        sessionId: `test-${Date.now()}-2`,
        context: { activeModule: 'intelligence' }
      })
    })

    const ackData = await ackResponse.json()
    console.log('  ✅ Acknowledgment:', ackData.message)

    // Stage 2: Full response
    console.log('\n  → Stage 2: Getting full research response...')
    const fullResponse = await fetch(NIV_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: test2Message,
        organizationId: 'openai',
        stage: 'full',
        sessionId: ackData.sessionId,
        context: { activeModule: 'intelligence' }
      })
    })

    const fullData = await fullResponse.json()

    if (fullData.success) {
      console.log('  ✅ Research completed successfully!')
      console.log('  📄 Response contains search results:', fullData.message?.includes('http') || fullData.message?.includes('www'))
    } else {
      console.error('  ❌ Research failed:', fullData.error)
    }

  } catch (error) {
    console.error('  ❌ Test 2 failed:', error.message)
  }

  console.log('\n✨ Testing complete!')
}

testNivResearch()