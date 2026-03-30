// Quick check of Fireplexity monitor results

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function checkResults() {
  console.log('📊 Checking Fireplexity Monitor Results\n')

  // Check monitoring runs
  const monitoring = await fetch(
    `${SUPABASE_URL}/rest/v1/fireplexity_monitoring?organization_id=eq.OpenAI&order=created_at.desc&limit=3`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    }
  )

  const monitoringData = await monitoring.json()

  console.log(`✅ Found ${monitoringData.length} monitoring runs:\n`)
  monitoringData.forEach((run, idx) => {
    console.log(`${idx + 1}. Executed: ${new Date(run.executed_at).toLocaleString()}`)
    console.log(`   Results: ${run.results_count}`)
    console.log(`   Alerts: ${run.alerts_triggered}`)
    console.log(`   Time: ${run.execution_time_ms}ms`)
    console.log()
  })

  // Check alerts
  const alerts = await fetch(
    `${SUPABASE_URL}/rest/v1/real_time_alerts?organization_id=eq.OpenAI&order=created_at.desc&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    }
  )

  const alertsData = await alerts.json()

  console.log(`\n🚨 Found ${alertsData.length} alerts:\n`)
  alertsData.forEach((alert, idx) => {
    console.log(`${idx + 1}. [${alert.alert_type}/${alert.severity}] ${alert.title}`)
    console.log(`   Source: ${alert.source}`)
    console.log(`   Detected: ${new Date(alert.detected_at).toLocaleString()}`)
    console.log()
  })
}

checkResults().catch(console.error)
