const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testSocialIntelligence() {
  console.log('🧪 Testing Social Intelligence MCP\n')

  console.log('📸 Testing Instagram hashtag scraping...')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-social-intelligence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      tool: 'search_instagram_public',
      arguments: {
        hashtag: 'ai',
        time_range: '24h'
      }
    })
  })

  if (!response.ok) {
    console.error('❌ Request failed:', response.status, response.statusText)
    const error = await response.text()
    console.error('Error details:', error)
    return
  }

  const data = await response.json()

  console.log('\n✅ Response received:')
  console.log('Success:', data.success)
  console.log('Results:', data.results?.length || 0, 'posts found')

  if (data.results && data.results.length > 0) {
    console.log('\n📊 Sample results:')
    data.results.slice(0, 3).forEach((result, i) => {
      console.log(`\n${i + 1}.`, {
        platform: result.platform,
        type: result.type,
        content: result.content?.substring(0, 100) + '...',
        url: result.url
      })
    })
  } else {
    console.log('\n⚠️ No results returned')
    console.log('Full response:', JSON.stringify(data, null, 2))
  }
}

testSocialIntelligence().catch(console.error)
