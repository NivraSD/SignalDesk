// Test Fireplexity Real-Time Monitor

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testFireplexityMonitor() {
  console.log('🧪 Testing Fireplexity Real-Time Monitor\n')

  try {
    console.log('📝 Calling niv-fireplexity-monitor...\n')

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
          organization_name: 'OpenAI',
          queries: [
            'OpenAI breaking news',
            'OpenAI ChatGPT',
            'OpenAI GPT-5',
            'Sam Altman OpenAI',
            'Anthropic Claude',
            'OpenAI safety'
          ],
          relevance_threshold: 60,
          recency_window: '24hours'
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

    console.log('✅ Monitor Response:\n')
    console.log(`📊 Results found: ${data.results_found}`)
    console.log(`🚨 Alerts triggered: ${data.alerts_triggered}`)
    console.log(`⏱️  Execution time: ${data.execution_time_ms}ms`)

    if (data.alerts && data.alerts.length > 0) {
      console.log('\n🚨 Alerts Detected:\n')
      data.alerts.forEach((alert, idx) => {
        console.log(`${idx + 1}. ${alert.title}`)
        console.log(`   Type: ${alert.type}`)
        console.log(`   Severity: ${alert.severity}`)
        console.log()
      })
    } else {
      console.log('\nℹ️ No alerts detected')
    }

    // Check database for saved results
    console.log('\n📊 Checking database...\n')

    const checkMonitoring = await fetch(
      `${SUPABASE_URL}/rest/v1/fireplexity_monitoring?organization_id=eq.OpenAI&order=created_at.desc&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      }
    )

    if (checkMonitoring.ok) {
      const monitoring = await checkMonitoring.json()
      if (monitoring.length > 0) {
        console.log('✅ Latest monitoring run:')
        console.log(`   Results: ${monitoring[0].results_count}`)
        console.log(`   Alerts: ${monitoring[0].alerts_triggered}`)
        console.log(`   Executed: ${new Date(monitoring[0].executed_at).toLocaleString()}`)
      }
    }

    const checkAlerts = await fetch(
      `${SUPABASE_URL}/rest/v1/real_time_alerts?organization_id=eq.OpenAI&source=eq.fireplexity&order=created_at.desc&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      }
    )

    if (checkAlerts.ok) {
      const alerts = await checkAlerts.json()
      if (alerts.length > 0) {
        console.log(`\n✅ Saved ${alerts.length} alerts to database:`)
        alerts.forEach((alert, idx) => {
          console.log(`   ${idx + 1}. [${alert.alert_type}/${alert.severity}] ${alert.title}`)
        })
      }
    }

    console.log('\n✅ Test complete!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFireplexityMonitor()
