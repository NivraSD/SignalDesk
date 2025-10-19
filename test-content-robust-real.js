// Test niv-content-robust with a real content request
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testRealContent() {
  console.log('🚀 Testing niv-content-robust with real content request')
  console.log('================================\n')

  // Test 1: Initial message
  console.log('📝 Test 1: Initial message about media plan')
  const request1 = {
    message: "We're launching a new AI product next week and need a media plan to announce it",
    conversationId: `test-real-${Date.now()}`,
    conversationHistory: [],
    context: {
      organization: {
        name: 'TechCorp',
        industry: 'Technology',
        description: 'AI innovation company'
      }
    }
  }

  try {
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify(request1),
      signal: AbortSignal.timeout(30000)
    })

    if (response1.ok) {
      const result1 = await response1.json()
      console.log('✅ Response received')
      console.log('Message:', result1.message)
      console.log('Stage:', result1.stage)
      console.log('Generated content count:', result1.generatedCount)
      console.log('')

      // Test 2: Follow-up with details
      console.log('📝 Test 2: Follow-up with product details')
      const request2 = {
        message: "It's a new AI assistant for developers. We want to emphasize how it speeds up coding by 10x. Target audience is software engineers.",
        conversationId: request1.conversationId,
        conversationHistory: [
          { role: 'user', content: request1.message },
          { role: 'assistant', content: result1.message }
        ],
        context: request1.context
      }

      const response2 = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify(request2),
        signal: AbortSignal.timeout(30000)
      })

      if (response2.ok) {
        const result2 = await response2.json()
        console.log('✅ Response received')
        console.log('Message:', result2.message)
        console.log('Stage:', result2.stage)
        console.log('')

        // Test 3: Request media plan creation
        console.log('📝 Test 3: Request media plan creation')
        const request3 = {
          message: "Great, please create the complete media plan now",
          conversationId: request1.conversationId,
          conversationHistory: [
            { role: 'user', content: request2.message },
            { role: 'assistant', content: result2.message }
          ],
          context: request1.context
        }

        const response3 = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify(request3),
          signal: AbortSignal.timeout(60000) // 60 seconds for content generation
        })

        if (response3.ok) {
          const result3 = await response3.json()
          console.log('✅ Content generated!')
          console.log('Message:', result3.message)
          console.log('Stage:', result3.stage)
          console.log('Generated content types:', Object.keys(result3.content || {}))
          console.log('Total generated:', result3.generatedCount)

          // Show a sample of the content
          if (result3.content && Object.keys(result3.content).length > 0) {
            const firstType = Object.keys(result3.content)[0]
            console.log(`\n📄 Sample (${firstType}):`)
            console.log(result3.content[firstType].substring(0, 200) + '...')
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
}

testRealContent().catch(console.error)