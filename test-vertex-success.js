const fs = require('fs')
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testVertexGeneration() {
  console.log('🚀 Testing Vertex AI Image Generation with Service Account')
  console.log('=' .repeat(60))

  const response = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      type: 'image',
      prompt: 'A futuristic Tesla Cybertruck driving through a neon-lit city at night, with holographic billboards and flying cars in the background, cyberpunk style, highly detailed',
      style: 'photorealistic',
      aspectRatio: '16:9'
    })
  })

  console.log('Response status:', response.status)
  const result = await response.json()

  if (result.success && result.images && result.images[0]) {
    console.log('✅ Image generation successful!')
    console.log('Model used:', result.images[0].metadata?.model || 'unknown')

    const imageUrl = result.images[0].url
    if (imageUrl.startsWith('data:image')) {
      // It's a base64 image
      const base64Data = imageUrl.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      // Save to file
      const filename = `generated-image-${Date.now()}.png`
      fs.writeFileSync(filename, buffer)
      console.log(`📸 Image saved to: ${filename}`)
      console.log('Image size:', buffer.length, 'bytes')

      // Check if it's a real image (PNG signature)
      const pngSignature = buffer.slice(0, 8).toString('hex')
      if (pngSignature === '89504e470d0a1a0a') {
        console.log('✅ Valid PNG image detected!')
      } else {
        console.log('⚠️ Image format may not be PNG')
      }
    } else if (imageUrl.startsWith('http')) {
      console.log('🌐 Image URL:', imageUrl)
    }

    if (result.images[0].metadata?.safetyRatings) {
      console.log('Safety ratings:', JSON.stringify(result.images[0].metadata.safetyRatings, null, 2))
    }
  } else {
    console.log('❌ Generation failed:', result.error)
    if (result.fallback) {
      console.log('📝 Fallback provided:', result.fallback.type)
      console.log('Reason:', result.fallback.reason)
    }
  }
}

testVertexGeneration().catch(console.error)