// Test predictions with OpenAI organization
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOpenAIPredictions() {
  const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

  console.log('🧪 Testing predictions for OpenAI organization...\n')
  console.log(`Organization ID: ${openaiOrgId}`)
  console.log(`Type: ${typeof openaiOrgId}\n`)

  // Check if intelligence data exists
  console.log('1. Checking for intelligence data...')
  const { data: intel, error: intelError } = await supabase
    .from('real_time_intelligence')
    .select('*')
    .eq('organization_id', openaiOrgId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (intelError) {
    console.log('   ❌ Error:', intelError.message)
  } else {
    console.log(`   ✅ Found ${intel.length} intelligence records`)
    if (intel.length > 0) {
      console.log(`   Latest: ${intel[0].title || intel[0].description}`)
    }
  }

  console.log('\n2. Calling pattern detector...')
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stakeholder-pattern-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organizationId: openaiOrgId
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('   ✅ Pattern detector responded:')
      console.log(`      Success: ${data.success}`)
      console.log(`      Predictions generated: ${data.predictions_generated || 0}`)
      console.log(`      Events analyzed: ${data.events_analyzed || 0}`)
      console.log(`      Stakeholders analyzed: ${data.stakeholders_analyzed || 0}`)
      if (data.message) console.log(`      Message: ${data.message}`)

      if (data.predictions && data.predictions.length > 0) {
        console.log(`\n   📊 Sample prediction:`)
        const pred = data.predictions[0]
        console.log(`      Stakeholder: ${pred.stakeholder_name}`)
        console.log(`      Action: ${pred.predicted_action}`)
        console.log(`      Probability: ${(pred.probability * 100).toFixed(0)}%`)
        console.log(`      Confidence: ${pred.confidence_level}`)
      }
    } else {
      console.log('   ❌ Error:', data.error || response.statusText)
    }
  } catch (err) {
    console.log('   ❌ Exception:', err.message)
  }

  console.log('\n3. Checking predictions table...')
  const { data: predictions, error: predError } = await supabase
    .from('stakeholder_predictions')
    .select('*')
    .eq('organization_id', openaiOrgId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (predError) {
    console.log('   ❌ Error:', predError.message)
  } else {
    console.log(`   ✅ Found ${predictions.length} predictions in database`)
    predictions.forEach(p => {
      console.log(`      • ${p.predicted_action} (${(p.probability * 100).toFixed(0)}% confidence)`)
    })
  }

  console.log('\n✅ Test complete!')
}

testOpenAIPredictions().catch(console.error)
