#!/usr/bin/env node
// Manual trigger for Fireplexity Real-Time Monitor
// Usage: node run-fireplexity-monitor.js [--with-opportunities]

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

const withOpportunities = process.argv.includes('--with-opportunities')

async function runMonitor() {
  console.log('🔍 Running Fireplexity Real-Time Monitor')
  console.log(`   Organization: OpenAI`)
  console.log(`   Route to Opportunity Engine: ${withOpportunities ? 'YES' : 'NO'}`)
  console.log()

  const startTime = Date.now()

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          organization_id: 'OpenAI',
          relevance_threshold: 60,
          recency_window: '24hours',
          route_to_opportunity_engine: withOpportunities
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

    console.log('✅ Monitor Complete!\n')
    console.log(`📊 Results:`)
    console.log(`   - ${data.results_found} relevant articles found`)
    console.log(`   - ${data.alerts_triggered} alerts detected`)
    if (withOpportunities) {
      console.log(`   - ${data.opportunities_generated} opportunities generated`)
    }
    console.log(`   - ${elapsed}s total execution time\n`)

    if (data.alerts && data.alerts.length > 0) {
      console.log(`🚨 Alerts (${data.alerts.length}):\n`)
      data.alerts.forEach((alert, idx) => {
        const icon = alert.severity === 'critical' ? '🔴' :
                     alert.severity === 'high' ? '🟠' :
                     alert.severity === 'medium' ? '🟡' : '🟢'
        console.log(`${icon} ${idx + 1}. [${alert.type}] ${alert.title}`)
      })
      console.log()
    }

    if (withOpportunities && data.opportunities && data.opportunities.length > 0) {
      console.log(`💡 Opportunities (${data.opportunities.length}):\n`)
      data.opportunities.forEach((opp, idx) => {
        console.log(`   ${idx + 1}. ${opp.title}`)
        console.log(`      Category: ${opp.category}`)
        console.log(`      Confidence: ${opp.confidence}%`)
        console.log()
      })
    }

    console.log('💾 Data saved to:')
    console.log(`   - fireplexity_monitoring table`)
    console.log(`   - real_time_alerts table`)
    if (withOpportunities) {
      console.log(`   - opportunities table`)
    }
    console.log()

  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  Fireplexity Real-Time Monitor')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

runMonitor()
