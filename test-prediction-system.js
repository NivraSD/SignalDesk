// Test Prediction System Deployment
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPredictionSystem() {
  console.log('🧪 Testing Prediction System Deployment...\n')

  // Test 1: Check if stakeholder_patterns table exists and has data
  console.log('1. Checking pattern library...')
  try {
    const { data: patterns, error } = await supabase
      .from('stakeholder_patterns')
      .select('pattern_name, stakeholder_type, reliability_score')
      .limit(10)

    if (error) {
      console.log('   ❌ Error accessing patterns:', error.message)
      if (error.message.includes('does not exist')) {
        console.log('   ⚠️  Tables not created yet. Migration may have partially failed.')
      }
    } else {
      console.log(`   ✅ Pattern library exists with ${patterns.length} patterns:`)
      patterns.forEach(p => {
        console.log(`      • ${p.pattern_name} (${p.stakeholder_type}) - ${(p.reliability_score * 100).toFixed(0)}% reliability`)
      })
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message)
  }

  console.log('')

  // Test 2: Check if stakeholder_profiles table exists
  console.log('2. Checking stakeholder profiles table...')
  try {
    const { count, error } = await supabase
      .from('stakeholder_profiles')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log('   ❌ Error accessing profiles:', error.message)
    } else {
      console.log(`   ✅ Stakeholder profiles table exists with ${count || 0} profiles`)
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message)
  }

  console.log('')

  // Test 3: Check if stakeholder_predictions table exists
  console.log('3. Checking predictions table...')
  try {
    const { count, error } = await supabase
      .from('stakeholder_predictions')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log('   ❌ Error accessing predictions:', error.message)
    } else {
      console.log(`   ✅ Predictions table exists with ${count || 0} predictions`)
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message)
  }

  console.log('')

  // Test 4: Check if pattern detector function is deployed
  console.log('4. Testing pattern detector function...')
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stakeholder-pattern-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organizationId: 'test-org-id'
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('   ✅ Pattern detector function is deployed and responding')
      console.log(`      Response: ${data.message || data.success || JSON.stringify(data).substring(0, 100)}`)
    } else {
      console.log('   ⚠️  Function responded with error:', data.error || response.statusText)
      console.log('      This is expected if no organization exists with that ID')
    }
  } catch (err) {
    console.log('   ❌ Exception calling function:', err.message)
  }

  console.log('')

  // Test 5: Check if profiler function is deployed
  console.log('5. Testing stakeholder profiler function...')
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stakeholder-profiler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organizationId: 'test-org-id',
        stakeholderName: 'Test Stakeholder'
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('   ✅ Stakeholder profiler function is deployed and responding')
      console.log(`      Response: ${data.message || data.success || JSON.stringify(data).substring(0, 100)}`)
    } else {
      console.log('   ⚠️  Function responded with error:', data.error || response.statusText)
      console.log('      This is expected if no organization exists with that ID')
    }
  } catch (err) {
    console.log('   ❌ Exception calling function:', err.message)
  }

  console.log('')
  console.log('─────────────────────────────────────────────────────')
  console.log('Test Summary:')
  console.log('─────────────────────────────────────────────────────')
  console.log('If you see ✅ for all tests, the system is deployed!')
  console.log('If you see ❌ for tables, run the migration again.')
  console.log('If functions work but tables don\'t exist, check Supabase dashboard.')
  console.log('')
}

testPredictionSystem().catch(console.error)
