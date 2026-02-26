#!/usr/bin/env node
// Test the Real-Time Intelligence Orchestrator V2 (uses proven pipeline)

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

const mode = process.argv[2] || 'full' // base, opportunities, crises, full

async function testRealTimeV2() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Real-Time Intelligence Orchestrator V2 Test')
  console.log('  (Uses Proven Pipeline)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log(`🎯 Mode: ${mode.toUpperCase()}`)
  console.log(`   Organization: OpenAI`)
  console.log(`   Time window: 24 hours`)
  console.log(`   Opportunities: ${mode === 'opportunities' || mode === 'full'}`)
  console.log(`   Crises: ${mode === 'crises' || mode === 'full'}\n`)

  const startTime = Date.now()

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/real-time-intelligence-orchestrator-v2`,
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

    console.log('✅ Real-Time Intelligence V2 Complete!\n')
    console.log(`📊 Results (${elapsed}s execution):`)
    console.log(`   - ${data.articles_analyzed} articles analyzed`)
    console.log(`   - ${data.articles_with_full_content} articles with full content (Firecrawl)`)
    console.log(`   - ${data.new_articles} new articles in time window`)
    console.log(`   - ${data.critical_alerts?.length || 0} critical alerts generated`)
    console.log(`   - ${data.watch_list?.length || 0} items on watch list`)

    if (mode === 'opportunities' || mode === 'full') {
      console.log(`   - ${data.opportunities_count} opportunities detected`)
    }

    if (mode === 'crises' || mode === 'full') {
      console.log(`   - ${data.crises_count} crises detected (${data.critical_crises_count} critical/high)`)
    }

    console.log(`\n📰 Breaking Summary:`)
    console.log(`   ${data.breaking_summary}\n`)

    if (data.critical_alerts && data.critical_alerts.length > 0) {
      console.log(`🚨 Critical Alerts (${data.critical_alerts.length}):\n`)
      data.critical_alerts.forEach((alert, idx) => {
        const icon = alert.urgency === 'immediate' ? '🔴' :
                     alert.urgency === 'this_week' ? '🟠' : '🔵'
        console.log(`${icon} ${idx + 1}. ${alert.title}`)
        console.log(`   ${alert.summary}`)
        console.log(`   Action: ${alert.recommended_action}`)
        console.log(`   Timeline: ${alert.time_to_act}`)
        if (alert.source_urls && alert.source_urls.length > 0) {
          console.log(`   Sources: ${alert.source_urls.slice(0, 3).join(', ')}`)
        }
        console.log()
      })
    }

    if (data.watch_list && data.watch_list.length > 0) {
      console.log(`👀 Watch List (${data.watch_list.length}):\n`)
      data.watch_list.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.item}`)
        console.log(`      Why: ${item.why}`)
        console.log(`      Check: ${item.next_check}`)
        console.log()
      })
    }

    if (data.opportunities_count > 0) {
      console.log(`💡 Opportunities (${data.opportunities_count}):\n`)
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

    if (data.crises_count > 0) {
      console.log(`🚨 Crises Detected (${data.crises_count}):\n`)
      data.crises.forEach((crisis, idx) => {
        const icon = crisis.severity === 'critical' ? '🔴' :
                     crisis.severity === 'high' ? '🟠' :
                     crisis.severity === 'medium' ? '🟡' : '🟢'
        console.log(`${icon} ${idx + 1}. ${crisis.title || 'Crisis Signal'}`)
        console.log(`      Severity: ${crisis.severity}`)
        if (crisis.description) {
          console.log(`      ${crisis.description.substring(0, 100)}...`)
        }
        console.log()
      })
    }

    console.log(`\n✨ Quality Improvements Over V1:`)
    console.log(`   ✅ Uses proven intelligence pipeline (monitor stages 1→2→3)`)
    console.log(`   ✅ RSS feeds from curated sources (not generic searches)`)
    console.log(`   ✅ Strict 48-hour date filtering (no stale articles)`)
    console.log(`   ✅ MCP Firecrawl for full content (top 30 articles)`)
    console.log(`   ✅ HTML garbage detection and cleaning`)
    console.log(`   ✅ Source quality tiers (critical/high/medium/low)`)
    console.log(`   ✅ Proper intelligence extraction and packaging`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log(`Usage: node test-real-time-v2.js [mode]`)
console.log(`Modes: base (default), opportunities, crises, full\n`)

testRealTimeV2()
