// Test with existing GOOGLE_ACCESS_TOKEN from Supabase secrets
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testWithExistingAuth() {
  console.log('🔍 Testing vertex-ai-visual with existing Supabase secrets...')
  console.log('You have GOOGLE_ACCESS_TOKEN and GOOGLE_APPLICATION_CREDENTIALS set')
  console.log('=' .repeat(50))

  // The edge function should now use the GOOGLE_ACCESS_TOKEN automatically
  const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      type: 'image',
      prompt: 'A futuristic Tesla car driving on Mars with Earth visible in the sky',
      style: 'photorealistic',
      aspectRatio: '16:9'
    })
  })

  console.log('Response status:', response.status)
  const result = await response.json()
  
  if (result.success) {
    console.log('✅ Image generation successful!')
    if (result.images && result.images[0]) {
      const imageUrl = result.images[0].url
      if (imageUrl.startsWith('data:image')) {
        console.log('📸 Got base64 image (placeholder or generated)')
        console.log('First 100 chars:', imageUrl.substring(0, 100) + '...')
      } else if (imageUrl.startsWith('http')) {
        console.log('🌐 Got image URL:', imageUrl)
      }
    }
  } else {
    console.log('❌ Generation failed:', result.error)
    if (result.fallback) {
      console.log('📝 Fallback provided:', result.fallback.type)
    }
  }

  // Check the edge function logs to see which auth method was used
  console.log('\nTo check which authentication method was used, run:')
  console.log('npx supabase functions logs vertex-ai-visual')
}

testWithExistingAuth().catch(console.error)
