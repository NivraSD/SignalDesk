const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testMonitorStage1() {
  console.log('Testing monitor-stage-1 directly...\n')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization_name: 'OpenAI'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error:', response.status, error)
      return
    }

    const data = await response.json()

    console.log('✅ monitor-stage-1 Response:')
    console.log('  Results:', data.results?.length || 0)
    console.log('  Profile:', data.profile?.organization_name || 'N/A')
    console.log('  Stats:', JSON.stringify(data.stats, null, 2))

    if (data.results && data.results.length > 0) {
      console.log('\nFirst 3 articles:')
      data.results.slice(0, 3).forEach((article, i) => {
        console.log(`\n${i + 1}. ${article.title}`)
        console.log(`   URL: ${article.url}`)
        console.log(`   Published: ${article.published_at || article.publishedAt}`)
        console.log(`   Source: ${article.source}`)
      })
    } else {
      console.log('\n⚠️ No articles returned!')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testMonitorStage1()
