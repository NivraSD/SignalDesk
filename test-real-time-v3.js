#!/usr/bin/env node
// Test the Real-Time Intelligence Orchestrator V3 (wrapper around proven pipeline)

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

const mode = process.argv[2] || 'full' // base, opportunities, crises, full

async function testRealTimeV3() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Real-Time Intelligence Orchestrator V3 Test')
  console.log('  (Wrapper Around Proven Pipeline)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log(`🎯 Mode: ${mode.toUpperCase()}`)
  console.log(`   Organization: OpenAI`)
  console.log(`   Time window: 24 hours`)
  console.log(`   Opportunities: ${mode === 'opportunities' || mode === 'full'}`)
  console.log(`   Crises: ${mode === 'crises' || mode === 'full'}\n`)

  const startTime = Date.now()

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/real-time-intelligence-orchestrator-v3`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          organization_name: 'OpenAI',
          time_window: '24hours',
          route_to_opportunities: mode === 'opportunities' || mode === 'full',
          route_to_crisis: mode === 'crises' || mode === 'full'
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

    console.log('✅ Real-Time Intelligence V3 Complete!\n')
    console.log(`📊 Results (${elapsed}s execution):`)
    console.log(`   - ${data.articles_analyzed} articles analyzed`)
    console.log(`   - ${data.opportunities_count} opportunities detected`)
    console.log(`   - ${data.crises_count} crises detected`)

    console.log(`\n📰 Breaking Summary:`)
    console.log(`   ${data.breaking_summary}\n`)

    if (data.opportunities && data.opportunities.length > 0) {
      console.log(`💡 Opportunities (${data.opportunities.length}):\n`)
      data.opportunities.slice(0, 3).forEach((opp, idx) => {
        console.log(`   ${idx + 1}. ${opp.title}`)
        console.log(`      Category: ${opp.category}`)
        console.log(`      Urgency: ${opp.urgency}`)
        if (opp.campaign_name) {
          console.log(`      Campaign: ${opp.campaign_name}`)
        }
        console.log()
      })
    }

    console.log(`\n✨ V3 Benefits:`)
    console.log(`   ✅ Wraps proven intelligence-orchestrator-v2`)
    console.log(`   ✅ Uses complete pipeline: Discovery → Monitor → Relevance → Enrichment → Synthesis`)
    console.log(`   ✅ RSS feeds from curated sources`)
    console.log(`   ✅ 48-hour date filtering`)
    console.log(`   ✅ MCP Firecrawl for top 30 articles`)
    console.log(`   ✅ HTML garbage detection`)
    console.log(`   ✅ Proper opportunity detection`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log(`Usage: node test-real-time-v3.js [mode]`)
console.log(`Modes: base (default), opportunities, crises, full\n`)

testRealTimeV3()
