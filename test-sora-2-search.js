const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testSora2Search() {
  console.log('🧪 Testing Sora 2 Search with Improved Fireplexity\n')

  const testQuery = "Sora 2 launch announcement"

  console.log('📤 Searching for:', testQuery)
  console.log('Expected improvements:')
  console.log('  - Detects "Sora 2" as product version')
  console.log('  - Uses past 3 days filter (qdr:d3) for launch queries')
  console.log('  - Generates variations like "Sora 2 official announcement"')
  console.log('')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      query: testQuery,
      organizationId: 'OpenAI',
      searchMode: 'comprehensive',
      useCache: false // Disable cache to test fresh search
    })
  })

  if (!response.ok) {
    console.error('❌ Search failed:', response.statusText)
    const error = await response.text()
    console.error(error)
    return
  }

  const data = await response.json()

  console.log('✅ Search completed successfully\n')

  console.log('🔍 Enhanced queries used:')
  data.enhancedQueries?.forEach((q, i) => {
    console.log(`  ${i + 1}. "${q}"`)
  })
  console.log('')

  console.log('📊 Results found:', data.totalResults)
  console.log('')

  if (data.results && data.results.length > 0) {
    console.log('📰 Top 5 Results:')
    data.results.slice(0, 5).forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`)
      console.log(`   Source: ${result.source?.name || 'Unknown'}`)
      console.log(`   Type: ${result.sourceType}`)
      console.log(`   Relevance: ${(result.relevanceScore * 100).toFixed(0)}%`)
      console.log(`   URL: ${result.url.substring(0, 80)}...`)
    })
  } else {
    console.log('⚠️ No results found - this indicates a problem!')
  }

  console.log('\n📈 Insights:')
  if (data.insights) {
    console.log('  Top sources:', data.insights.topSources?.join(', ') || 'none')
    console.log('  Themes:', data.insights.themes?.join(', ') || 'none')
  }

  console.log('\n💬 Summary:')
  console.log(data.summary?.substring(0, 300) || 'No summary generated')
}

testSora2Search().catch(console.error)
