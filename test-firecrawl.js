// Test Firecrawl Search API directly

const API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'
const BASE_URL = 'https://api.firecrawl.dev/v2'

async function testSearch(query, params = {}) {
  console.log(`\n🔍 Testing search: "${query}"`)
  console.log(`📋 Params:`, JSON.stringify(params, null, 2))

  const body = {
    query,
    limit: 5,
    ...params
  }

  console.log(`📤 Request body:`, JSON.stringify(body, null, 2))

  try {
    const response = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    console.log(`📊 Response status: ${response.status}`)
    const data = await response.json()
    console.log(`📥 Response:`, JSON.stringify(data, null, 2))

    if (data.data) {
      console.log(`✅ Got ${data.data.length || 0} results`)
    }

    return data
  } catch (error) {
    console.error('❌ Error:', error.message)
    return null
  }
}

// Test 1: Simple query
await testSearch('Sora 2 OpenAI')

// Test 2: With tbs parameter (time filter)
await testSearch('Sora 2 OpenAI', { tbs: 'qdr:w' })

// Test 3: With sources parameter (like we're doing)
await testSearch('Sora 2 OpenAI', { sources: ['web', 'news'], tbs: 'qdr:w' })

// Test 4: With scrapeOptions
await testSearch('Sora 2 OpenAI', {
  scrapeOptions: {
    formats: ['markdown'],
    onlyMainContent: true
  }
})

console.log('\n✅ Tests complete')
