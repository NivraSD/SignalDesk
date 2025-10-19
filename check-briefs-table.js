const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function checkTable() {
  console.log('🔍 Checking real_time_intelligence_briefs table...\n')

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('real_time_intelligence_briefs')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error:', error.message)
      console.log('\n⚠️ Table may not exist or has permission issues')
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Table exists with columns:')
      const columns = Object.keys(data[0])
      columns.forEach(col => console.log(`  - ${col}`))
      console.log('\n📊 Sample record:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('⚠️ Table exists but is empty')
      console.log('Cannot determine schema from empty table')
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

checkTable()
