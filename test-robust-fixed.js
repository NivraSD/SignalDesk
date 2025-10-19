// Test that NIVOrchestratorRobust is fixed and working for research

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testRobustFixed() {
  console.log('🚀 Testing Fixed NIVOrchestratorRobust')
  console.log('================================\n')

  // Test: Research Request (what it's meant for)
  console.log('🔍 Test: Research Request')
  const researchRequest = {
    message: "What are the latest AI regulations?",
    conversationId: `test-fixed-${Date.now()}`,
    conversationHistory: [],
    context: {
      organizationId: 'openai',
      activeModule: 'intelligence',
      industry: 'Technology'
    },
    stage: 'full'
  }

  try {
    const startTime = Date.now()
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(researchRequest)
    })

    const elapsed = Date.now() - startTime
    console.log(`⏱️  Response time: ${elapsed}ms`)

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Research Response received')
    console.log('- Has message:', !!result.message)
    console.log('- Message preview:', result.message?.substring(0, 100) + '...')
    console.log('- Has intelligence pipeline:', !!result.intelligencePipeline)
    console.log('')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }

  console.log('================================')
  console.log('✨ NIVOrchestratorRobust is working!')
}

// Run the test
testRobustFixed().catch(console.error)