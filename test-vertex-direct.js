// Test vertex-ai-visual directly
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testVertexDirect() {
  console.log('Testing vertex-ai-visual directly...')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prompt: 'A futuristic Tesla car on Mars with Earth in the background',
        type: 'image',
        style: 'professional',
        aspectRatio: '16:9'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Error response:', response.status, error)
      return
    }

    const data = await response.json()
    console.log('Response from vertex-ai-visual:')
    console.log(JSON.stringify(data, null, 2))

    // Check what we got
    if (data.images) {
      console.log('\nImages array:', data.images)
    }
    if (data.fallback) {
      console.log('\nFallback:', data.fallback)
    }
    if (data.error) {
      console.log('\nError:', data.error)
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testVertexDirect()