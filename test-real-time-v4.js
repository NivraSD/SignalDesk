#!/usr/bin/env node
// Test the Real-Time Intelligence Orchestrator V4 (fast mode - no deep enrichment)

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testRealTimeV4() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Real-Time Intelligence Orchestrator V4 Test')
  console.log('  (Fast Mode - No Deep Enrichment)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log(`🎯 Organization: OpenAI`)
  console.log(`   Time window: 24 hours`)
  console.log(`   Fast mode: YES (Discovery + Monitor Stage 1 only)\n`)

  const startTime = Date.now()

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/real-time-intelligence-orchestrator-v4`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          organization_name: 'OpenAI',
          time_window: '24hours'
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error:', response.status, response.statusText)
      console.error('Details:', error)
      return
    }

    const data = await response.json()
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('✅ Real-Time Intelligence V4 Complete!\n')
    console.log(`📊 Results (${elapsed}s execution):`)
    console.log(`   - ${data.articles_analyzed} total articles`)
    console.log(`   - ${data.articles_in_time_window} articles in ${data.time_window}`)
    console.log(`   - Execution time: ${data.execution_time_ms}ms`)

    console.log(`\n📰 Breaking Summary:`)
    console.log(`   ${data.breaking_summary}\n`)

    if (data.profile_summary) {
      console.log(`🎯 Profile Summary:`)
      console.log(`   - ${data.profile_summary.competitors} competitors`)
      console.log(`   - ${data.profile_summary.stakeholders} stakeholders`)
      console.log(`   - ${data.profile_summary.keywords} keywords\n`)
    }

    if (data.articles && data.articles.length > 0) {
      console.log(`📄 Top 5 Recent Articles:\n`)
      data.articles.slice(0, 5).forEach((article, idx) => {
        console.log(`   ${idx + 1}. ${article.title}`)
        console.log(`      Source: ${article.source}`)
        console.log(`      Published: ${article.published_at || article.publishedAt}`)
        console.log(`      URL: ${article.url}`)
        console.log()
      })
    }

    console.log(`\n⚡ V4 Speed Benefits:`)
    console.log(`   ✅ Fast: ${elapsed}s (vs 2-3 minutes for full pipeline)`)
    console.log(`   ✅ Discovery + Monitor Stage 1 only`)
    console.log(`   ✅ No expensive Firecrawl scraping`)
    console.log(`   ✅ No deep LLM enrichment`)
    console.log(`   ✅ Perfect for real-time dashboards`)
    console.log(`\n   Note: ${data.note}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testRealTimeV4()
