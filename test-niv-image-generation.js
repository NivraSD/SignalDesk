// Test NIV image generation specifically
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testImageGeneration() {
  console.log('🎨 Testing NIV Image Generation')
  console.log('=' .repeat(40))

  const conversationId = 'test-image-' + Date.now()

  // First, establish strategy
  console.log('\n1️⃣ Setting up strategy...')
  const strategyResponse = await fetch(SUPABASE_URL + '/functions/v1/niv-content-robust', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      conversationId,
      message: 'Create an image about Tesla innovation',
      orgId: 'c77c3de8-5c73-48ef-b449-91e7022f1234'
    })
  })

  const strategy = await strategyResponse.json()
  console.log('Strategy response:', strategy.message?.substring(0, 200))

  // Approve strategy
  console.log('\n2️⃣ Approving strategy...')
  const approvalResponse = await fetch(SUPABASE_URL + '/functions/v1/niv-content-robust', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      conversationId,
      message: 'approved',
      orgId: 'c77c3de8-5c73-48ef-b449-91e7022f1234',
      selectedContentType: 'image'  // Explicitly select image
    })
  })

  const result = await approvalResponse.json()
  console.log('\n📸 Image Generation Result:')
  console.log('- Success:', result.success)
  console.log('- Message:', result.message?.substring(0, 300))

  // Check for generated content
  if (result.generatedContent) {
    console.log('\n✅ Generated Content Found:')
    result.generatedContent.forEach(item => {
      console.log('  - ' + item.type + ': ' + (item.title || item.contentType))
      if (item.content) {
        if (item.content.startsWith('http') || item.content.startsWith('data:')) {
          console.log('    URL: ' + item.content.substring(0, 100) + '...')
        } else {
          console.log('    Content: ' + item.content.substring(0, 100) + '...')
        }
      }
    })
  }

  // Test direct vertex-ai-visual call
  console.log('\n3️⃣ Testing direct vertex-ai-visual...')
  const vertexResponse = await fetch(SUPABASE_URL + '/functions/v1/vertex-ai-visual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      type: 'image',
      prompt: 'Tesla electric car on Mars with Earth in background',
      style: 'photorealistic',
      aspectRatio: '16:9'
    })
  })

  const vertexResult = await vertexResponse.json()
  console.log('\n🔧 Vertex AI Direct Result:')
  console.log('- Success:', vertexResult.success)
  if (vertexResult.images) {
    console.log('- Images:', vertexResult.images.length)
    vertexResult.images.forEach((img, i) => {
      console.log('  Image ' + (i+1) + ': ' + (img.url?.substring(0, 100) || 'no URL') + '...')
    })
  }
  if (vertexResult.error) {
    console.log('- Error:', vertexResult.error)
  }
  if (vertexResult.fallback) {
    console.log('- Fallback:', vertexResult.fallback.type)
  }
}

testImageGeneration().catch(console.error)
