// Check ALL predictions
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllPredictions() {
  console.log('🔍 Checking ALL predictions...\n')

  const { data, error, count } = await supabase
    .from('predictions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log(`Total predictions: ${count}`)

  if (data && data.length > 0) {
    console.log(`\nShowing ${data.length} most recent:`)
    data.forEach((pred, idx) => {
      console.log(`\n${idx + 1}. ${pred.title}`)
      console.log(`   Organization ID: ${pred.organization_id}`)
      console.log(`   Type of org ID: ${typeof pred.organization_id}`)
      console.log(`   Created: ${pred.created_at}`)
      console.log(`   Category: ${pred.category}`)
      console.log(`   Confidence: ${pred.confidence_score}%`)
    })
  } else {
    console.log('No predictions found!')
  }
}

checkAllPredictions()
