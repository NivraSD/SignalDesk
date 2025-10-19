// Test Fireplexity Real-Time Monitor with mcp-discovery integration

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testIntegration() {
  console.log('🔗 Testing Fireplexity Monitor + mcp-discovery Integration\n')

  try {
    // STEP 1: Check if OpenAI profile exists
    console.log('📋 Step 1: Checking for OpenAI profile in organization_profiles...\n')

    const checkProfile = await fetch(
      `${SUPABASE_URL}/rest/v1/organization_profiles?organization_name=eq.OpenAI`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      }
    )

    const profiles = await checkProfile.json()

    if (profiles.length === 0) {
      console.log('⚠️  No OpenAI profile found. Creating one with mcp-discovery...\n')

      // Create profile with mcp-discovery
      const createResponse = await fetch(
        `${SUPABASE_URL}/functions/v1/mcp-discovery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            organization: 'OpenAI',
            industry_hint: 'artificial intelligence'
          })
        }
      )

      if (!createResponse.ok) {
        const error = await createResponse.text()
        console.error('❌ Failed to create profile:', error)
        return
      }

      const profileData = await createResponse.json()
      console.log('✅ OpenAI profile created!')
      console.log(`   - ${profileData.profile.competition?.direct_competitors?.length || 0} competitors`)
      console.log(`   - ${profileData.profile.monitoring_config?.search_queries?.crisis_queries?.length || 0} crisis queries`)
      console.log(`   - ${profileData.profile.monitoring_config?.search_queries?.opportunity_queries?.length || 0} opportunity queries\n`)
    } else {
      console.log('✅ OpenAI profile found!')
      const profile = profiles[0].profile_data
      console.log(`   - ${profile.competition?.direct_competitors?.length || 0} competitors`)
      console.log(`   - ${profile.monitoring_config?.search_queries?.crisis_queries?.length || 0} crisis queries`)
      console.log(`   - ${profile.monitoring_config?.search_queries?.opportunity_queries?.length || 0} opportunity queries\n`)
    }

    // STEP 2: Run Fireplexity Monitor (it will use profile data automatically)
    console.log('📝 Step 2: Running Fireplexity Monitor (using mcp-discovery data)...\n')

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
          recency_window: '24hours'
          // NOTE: No queries specified - will use mcp-discovery profile
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Error:', error)
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

    // STEP 3: Check saved data
    console.log('\n📊 Step 3: Checking saved data...\n')

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
        console.log(`   Query: ${monitoring[0].query.substring(0, 100)}...`)
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

    console.log('\n✅ Integration test complete!')
    console.log('\n💡 Summary:')
    console.log('   - mcp-discovery creates comprehensive organization profiles')
    console.log('   - Profiles include crisis/opportunity queries from competitors')
    console.log('   - niv-fireplexity-monitor automatically uses profile queries')
    console.log('   - No manual query configuration needed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testIntegration()
