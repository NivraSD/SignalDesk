const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testQuickSearch() {
  console.log('🧪 Quick Sora 2 Search Test\n')

  const testQuery = "Sora 2"

  console.log('📤 Searching for:', testQuery)
  console.log('Mode: quick (faster)\n')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        query: testQuery,
        organizationId: 'OpenAI',
        searchMode: 'quick', // Use quick mode for faster results
        useCache: false
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.error('❌ Search failed:', response.statusText)
      const error = await response.text()
      console.error(error)
      return
    }

    const data = await response.json()

    console.log('✅ Search completed\n')
    console.log('📊 Results:', data.totalResults)
    console.log('🔍 Enhanced queries:', data.enhancedQueries?.slice(0, 3).join(' | '))
    console.log('')

    if (data.results && data.results.length > 0) {
      console.log('📰 Top 3 Results:')
      data.results.slice(0, 3).forEach((result, i) => {
        console.log(`${i + 1}. ${result.title}`)
        console.log(`   ${result.source?.name} - Relevance: ${(result.relevanceScore * 100).toFixed(0)}%`)
      })
    } else {
      console.log('⚠️ No results found')
    }
  } catch (error) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      console.error('❌ Search timed out after 30 seconds')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
}

testQuickSearch().catch(console.error)
