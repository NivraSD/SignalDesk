// Test NIV orchestrator endpoint
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testNivOrchestrator() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: 'test',
        context: {
          organizationId: 'OpenAI',
          conversationId: 'test-123'
        }
      })
    })

    const responseText = await response.text()
    console.log('Status:', response.status)
    console.log('Response:', responseText)

    if (!response.ok) {
      console.error('Error response:', responseText)
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

testNivOrchestrator()