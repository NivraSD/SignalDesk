// Test local NIV API route
async function testLocalNiv() {
  try {
    const response = await fetch('http://localhost:3000/api/supabase/functions/niv-orchestrator-robust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'test',
        sessionId: 'test-session',
        stage: 'full',
        conversationHistory: [],
        context: {
          organizationId: 'OpenAI',
          conversationId: 'test-123',
          activeModule: 'intelligence'
        }
      })
    })

    const responseText = await response.text()
    console.log('Status:', response.status)

    try {
      const data = JSON.parse(responseText)
      console.log('Response:', JSON.stringify(data, null, 2))
    } catch {
      console.log('Raw response:', responseText)
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

testLocalNiv()