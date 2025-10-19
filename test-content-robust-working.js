// Test niv-content-robust - now working!
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testContentGeneration() {
  console.log('🚀 Testing NIV Content Generation')
  console.log('================================\n')

  const conversationId = `test-${Date.now()}`

  // Direct request for media plan
  console.log('📝 Requesting media plan generation directly')
  const request = {
    message: "Create a media plan for our AI coding assistant launch. It's called CodeBoost, speeds up development by 10x using advanced AI. Target audience is software engineers. Launch is next Tuesday. Just create the full media plan now with all components.",
    conversationId,
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
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(90000) // 90 seconds for content generation
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Response received!')
      console.log('\nMessage:', result.message)
      console.log('\nStage:', result.stage)
      console.log('Generated content types:', Object.keys(result.content || {}))
      console.log('Total generated count:', result.generatedCount)

      if (result.content && Object.keys(result.content).length > 0) {
        console.log('\n📦 Generated Content:')
        for (const [type, content] of Object.entries(result.content)) {
          console.log(`\n--- ${type.toUpperCase()} ---`)
          console.log(content.substring(0, 300) + '...')
        }
      } else {
        console.log('\n⚠️ No content was generated')
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testContentGeneration().catch(console.error)