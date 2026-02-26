// Simple test for niv-content-robust
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testSimple() {
  console.log('Testing niv-content-robust with simple request...')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        message: "Hello",
        conversationId: "test-123"
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    console.log('Status:', response.status)
    const text = await response.text()
    console.log('Response:', text)
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out after 10 seconds')
    } else {
      console.error('Error:', error.message)
    }
  }
}

testSimple()