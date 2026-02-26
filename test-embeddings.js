// Test the generate-embeddings function
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEmbedding() {
  console.log('🧪 Testing Voyage AI embedding generation...\n')

  const testText = `
    Microsoft announces new AI capabilities for enterprise customers.
    The company's latest innovation in artificial intelligence focuses on
    natural language processing and computer vision applications.
  `.trim()

  console.log(`📝 Test text (${testText.length} chars):`)
  console.log(testText)
  console.log('\n⏳ Generating embedding...\n')

  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { text: testText }
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Success!')
    console.log(`📊 Model: ${data.model}`)
    console.log(`📏 Dimensions: ${data.dimensions}`)
    console.log(`🔢 Tokens used: ${data.usage.total_tokens}`)
    console.log(`\n🎯 First 5 embedding values:`)
    console.log(data.embedding.slice(0, 5))
    console.log('...')

    // Verify it's 1024 dimensions
    if (data.dimensions === 1024) {
      console.log('\n✅ Correct! voyage-3-large produces 1024-dimensional embeddings')
    } else {
      console.log(`\n⚠️  Warning: Expected 1024 dimensions, got ${data.dimensions}`)
    }

  } catch (err) {
    console.error('❌ Exception:', err.message)
  }
}

testEmbedding()
