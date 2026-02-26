const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjEwMTE2NSwiZXhwIjoyMDUxNjc3MTY1fQ.nxfPYhqLa0Rq6lwfbC1ItJQTRAHMuKg1z5tKevQOt4Y'
)

async function testPipelineDates() {
  console.log('\n🔍 Testing Pipeline Date Handling\n')
  console.log('=' .repeat(60))

  // Step 1: Call monitor-stage-1-fireplexity
  console.log('\n📋 STEP 1: Calling monitor-stage-1-fireplexity...')

  const { data: monitorData, error: monitorError } = await supabase.functions.invoke(
    'monitor-stage-1-fireplexity',
    {
      body: {
        organization: 'OpenAI',
        recency_window: '24hours'
      }
    }
  )

  if (monitorError) {
    console.error('❌ Monitor error:', monitorError)
    return
  }

  console.log(`\n✅ Monitor returned ${monitorData.articles?.length || 0} articles`)

  // Analyze article dates
  if (monitorData.articles && monitorData.articles.length > 0) {
    console.log('\n📅 ARTICLE DATE ANALYSIS:')
    console.log('=' .repeat(60))

    const now = new Date()
    const articles = monitorData.articles

    // Group by age
    const last1h = []
    const last6h = []
    const last24h = []
    const older = []

    articles.forEach(article => {
      const pubDate = new Date(article.published_at)
      const hoursAgo = (now - pubDate) / (1000 * 60 * 60)

      if (hoursAgo < 1) last1h.push(article)
      else if (hoursAgo < 6) last6h.push(article)
      else if (hoursAgo < 24) last24h.push(article)
      else older.push(article)
    })

    console.log(`Last 1 hour:  ${last1h.length} articles`)
    console.log(`Last 6 hours: ${last6h.length} articles`)
    console.log(`Last 24 hours: ${last24h.length} articles`)
    console.log(`Older than 24h: ${older.length} articles`)

    if (older.length > 0) {
      console.log('\n🚨 OLD ARTICLES FOUND:')
      console.log('=' .repeat(60))
      older.slice(0, 10).forEach((article, i) => {
        const pubDate = new Date(article.published_at)
        const daysAgo = Math.floor((now - pubDate) / (1000 * 60 * 60 * 24))
        console.log(`\n${i + 1}. ${article.title}`)
        console.log(`   Published: ${article.published_at} (${daysAgo} days ago)`)
        console.log(`   Source: ${article.source}`)
        console.log(`   Relevance: ${article.relevance_score}`)
        console.log(`   URL: ${article.url?.substring(0, 100)}`)
      })
    }

    // Check newest and oldest
    const sorted = articles.sort((a, b) =>
      new Date(b.published_at) - new Date(a.published_at)
    )

    console.log('\n📊 DATE RANGE:')
    console.log('=' .repeat(60))
    console.log(`Newest: ${sorted[0].published_at}`)
    console.log(`        ${sorted[0].title.substring(0, 100)}`)
    console.log(`Oldest: ${sorted[sorted.length - 1].published_at}`)
    console.log(`        ${sorted[sorted.length - 1].title.substring(0, 100)}`)

    // Check queries used
    console.log('\n🔍 QUERIES USED:')
    console.log('=' .repeat(60))
    console.log(`Keywords used: ${monitorData.metadata?.keywords_used}`)
    console.log(`Recency window: ${monitorData.metadata?.recency_window}`)
    console.log(`Source type: ${monitorData.metadata?.source_type}`)
  }

  console.log('\n' + '='.repeat(60))
}

testPipelineDates().catch(console.error)
