// Debug test for niv-content-robust function

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testContentRobust() {
  console.log('🔍 Testing niv-content-robust with debugging')
  console.log('================================\n')

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
    process.exit(1)
  }

  // Simple test request
  const testRequest = {
    message: "Create a press release about our new AI product launch",
    conversationId: `test-debug-${Date.now()}`,
    conversationHistory: [],
    context: {
      organization: {
        name: 'TechCorp',
        industry: 'Technology',
        description: 'An AI innovation company'
      },
      requestedContentType: 'press-release'
    }
  }

  console.log('📤 Sending request to niv-content-robust...')
  console.log('Request body:', JSON.stringify(testRequest, null, 2))
  console.log('')

  try {
    const startTime = Date.now()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify(testRequest),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const elapsed = Date.now() - startTime
    console.log(`⏱️  Response time: ${elapsed}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()))
    console.log('')

    const responseText = await response.text()
    console.log('📝 Raw response:', responseText)
    console.log('')

    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Parsed response:')
        console.log('- Has message:', !!result.message)
        console.log('- Has content:', !!result.content)
        console.log('- Has deliveryTracking:', !!result.deliveryTracking)
        console.log('- Response structure:', Object.keys(result))

        if (result.message) {
          console.log('\n📨 Message preview:', result.message.substring(0, 200) + '...')
        }

        if (result.content) {
          console.log('\n📄 Content preview:', JSON.stringify(result.content).substring(0, 200) + '...')
        }
      } catch (parseError) {
        console.log('⚠️  Response is not valid JSON')
      }
    } else {
      console.error('❌ Request failed with status:', response.status)
    }

  } catch (error) {
    console.error('❌ Request error:', error)
    console.error('Error details:', error.stack)
  }
}

// Check for service key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️  Loading .env.local for service key...')
  require('dotenv').config({ path: '.env.local' })
}

// Run the test
testContentRobust().catch(console.error)