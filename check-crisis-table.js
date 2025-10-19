const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkCrisisTable() {
  console.log('Checking crisis_events table...')
  
  const { data, error } = await supabase
    .from('crisis_events')
    .select('count')
    .limit(1)
  
  if (error) {
    console.log('❌ Error accessing crisis_events table:', error.message)
    console.log('Error code:', error.code)
    console.log('Error details:', error.details)
    console.log('Error hint:', error.hint)
  } else {
    console.log('✅ crisis_events table exists and is accessible')
    console.log('Data:', data)
  }
}

checkCrisisTable()
