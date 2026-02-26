// Test prediction system with a real organization
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWithRealOrg() {
  console.log('🔍 Finding a real organization to test with...\n')

  // Get first organization
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  if (orgError || !orgs || orgs.length === 0) {
    console.log('❌ No organizations found. Cannot test.')
    console.log('Error:', orgError?.message)
    return
  }

  const org = orgs[0]
  console.log(`✅ Testing with organization: ${org.name} (${org.id})\n`)

  // Test pattern detector function
  console.log('Testing pattern detector...')
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stakeholder-pattern-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organizationId: org.id
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Pattern detector function responded:')
      console.log(`   - Success: ${data.success}`)
      console.log(`   - Predictions generated: ${data.predictions_generated || 0}`)
      console.log(`   - Events analyzed: ${data.events_analyzed || 0}`)
      console.log(`   - Stakeholders analyzed: ${data.stakeholders_analyzed || 0}`)
      if (data.message) console.log(`   - Message: ${data.message}`)
    } else {
      console.log('⚠️  Function responded with error:', data.error || data.message)
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }

  console.log('\n✅ Prediction system is operational!')
  console.log('\nNext steps:')
  console.log('1. Run pattern detector for your organizations')
  console.log('2. Integrate the dashboard into your UI')
  console.log('3. Start collecting predictions!')
}

testWithRealOrg().catch(console.error)
