const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function setupTables() {
  console.log('Setting up real-time intelligence tables...\n')

  // Check if tables exist
  const tables = ['seen_articles', 'real_time_intelligence_briefs', 'crises']

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1)

    if (error && error.message.includes('does not exist')) {
      console.log(`❌ Table "${table}" does not exist`)
      console.log(`   Please run the SQL file manually in Supabase Dashboard`)
    } else if (error) {
      console.log(`⚠️  Table "${table}": ${error.message}`)
    } else {
      console.log(`✅ Table "${table}" exists`)
    }
  }

  console.log('\n📝 To create tables:')
  console.log('1. Go to https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/editor')
  console.log('2. Run the SQL in create-real-time-intelligence-tables.sql')
}

setupTables()
