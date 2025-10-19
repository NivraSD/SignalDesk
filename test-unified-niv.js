// Test the unified NIV Orchestrator Robust system with content generation

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testUnifiedNIV() {
  console.log('🚀 Testing Unified NIV System')
  console.log('================================\n')

  // Test 1: Content Generation Request
  console.log('📝 Test 1: Content Generation - Media Plan')
  const contentRequest = {
    message: "Create a media plan for our new AI product launch next month. We need press release, social posts, and media pitch.",
    conversationId: `test-unified-${Date.now()}`,
    conversationHistory: [],
    context: {
      organizationId: 'tesla',
      activeModule: 'content-generator',
      industry: 'Technology',
      framework: null
    },
    stage: 'full'
  }

  try {
    const contentResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(contentRequest)
    })

    if (!contentResponse.ok) {
      throw new Error(`Content request failed: ${contentResponse.status}`)
    }

    const contentResult = await contentResponse.json()
    console.log('✅ Content Generation Response:')
    console.log('- Message:', contentResult.message?.substring(0, 200) + '...')
    console.log('- Has content generation:', !!contentResult.contentGeneration)
    console.log('- Content types detected:', contentResult.contentGeneration?.types)
    console.log('')

  } catch (error) {
    console.error('❌ Content generation test failed:', error.message)
  }

  // Test 2: Research Request
  console.log('🔍 Test 2: Research Request')
  const researchRequest = {
    message: "What are the latest trends in AI regulation?",
    conversationId: `test-research-${Date.now()}`,
    conversationHistory: [],
    context: {
      organizationId: 'openai',
      activeModule: 'intelligence',
      industry: 'Technology'
    },
    stage: 'full'
  }

  try {
    const researchResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(researchRequest)
    })

    if (!researchResponse.ok) {
      throw new Error(`Research request failed: ${researchResponse.status}`)
    }

    const researchResult = await researchResponse.json()
    console.log('✅ Research Response:')
    console.log('- Message:', researchResult.message?.substring(0, 200) + '...')
    console.log('- Has intelligence pipeline:', !!researchResult.intelligencePipeline)
    console.log('- Article count:', researchResult.intelligencePipeline?.articles?.length || 0)
    console.log('')

  } catch (error) {
    console.error('❌ Research test failed:', error.message)
  }

  // Test 3: Framework Generation Request
  console.log('🎯 Test 3: Strategic Framework Request')
  const frameworkRequest = {
    message: "Create a strategic framework for our Q1 product launch",
    conversationId: `test-framework-${Date.now()}`,
    conversationHistory: [
      { role: 'user', content: 'We are launching a new AI tool' },
      { role: 'assistant', content: 'I understand you\'re launching a new AI tool.' }
    ],
    context: {
      organizationId: 'tesla',
      activeModule: 'framework-creator',
      industry: 'Technology'
    },
    stage: 'full'
  }

  try {
    const frameworkResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(frameworkRequest)
    })

    if (!frameworkResponse.ok) {
      throw new Error(`Framework request failed: ${frameworkResponse.status}`)
    }

    const frameworkResult = await frameworkResponse.json()
    console.log('✅ Framework Response:')
    console.log('- Message:', frameworkResult.message?.substring(0, 200) + '...')
    console.log('- Has framework:', !!frameworkResult.framework)
    console.log('- Framework type:', frameworkResult.framework?.type)
    console.log('')

  } catch (error) {
    console.error('❌ Framework test failed:', error.message)
  }

  console.log('\n================================')
  console.log('✨ Unified NIV System Test Complete!')
}

// Run the test
testUnifiedNIV().catch(console.error)