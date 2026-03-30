const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function checkTable() {
  console.log('Checking fireplexity_monitoring table...\n')

  const { data, error } = await supabase
    .from('fireplexity_monitoring')
    .select('*')
    .eq('organization_id', 'OpenAI')
    .order('executed_at', { ascending: false })
    .limit(1)

  if (error) {
    console.log('❌ Error:', error.message)
  } else if (!data || data.length === 0) {
    console.log('⚠️  No records found for OpenAI')
  } else {
    console.log('✅ Found record:')
    console.log('  Organization:', data[0].organization_id)
    console.log('  Executed at:', data[0].executed_at)
    console.log('  Results count:', data[0].results?.length || 0)
    console.log('  Alerts count:', data[0].alerts?.length || 0)

    if (data[0].results && data[0].results.length > 0) {
      console.log('\nFirst result:')
      console.log('  Title:', data[0].results[0].title)
      console.log('  URL:', data[0].results[0].url)
    }
  }
}

checkTable()
