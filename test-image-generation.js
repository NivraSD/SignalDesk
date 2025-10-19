// Test image generation flow
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testImageGeneration() {
  console.log('Testing image generation through niv-content-robust...')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: 'Create an image of a futuristic Tesla car on Mars',
        contentType: 'image',
        conversationId: 'test-conv-' + Date.now(),
        context: {
          organization: {
            name: 'Tesla',
            industry: 'Electric Vehicles'
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Error response:', response.status, error)
      return
    }

    const data = await response.json()
    console.log('Response from niv-content-robust:')
    console.log(JSON.stringify(data, null, 2))

    // Check what we got
    if (data.messages) {
      console.log('\nMessages received:')
      data.messages.forEach((msg, i) => {
        console.log(`${i + 1}. Type: ${msg.type}`)
        if (msg.imageUrl) {
          console.log(`   Image URL: ${msg.imageUrl}`)
        }
        if (msg.message) {
          console.log(`   Message: ${msg.message}`)
        }
      })
    }

    if (data.images) {
      console.log('\nDirect images array:', data.images)
    }

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testImageGeneration()