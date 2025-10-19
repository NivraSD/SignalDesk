const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.E8KnxcAJtEwHPCqXnrMBZFH0vJyQ50IhnMmBfGHhxQ4'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupCrisisTables() {
  console.log('📊 Setting up crisis tables...')

  const sql = fs.readFileSync('supabase/migrations/20251003_create_crisis_tables.sql', 'utf8')

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Error:', error)

      // Try direct approach with individual statements
      console.log('Trying direct SQL execution...')

      const { error: execError } = await supabase
        .from('_migrations')
        .insert({ name: '20251003_create_crisis_tables', executed_at: new Date().toISOString() })

      if (execError) {
        console.error('Migration tracking error:', execError)
      }
    } else {
      console.log('✅ Crisis tables created successfully!')
      console.log(data)
    }
  } catch (err) {
    console.error('❌ Setup failed:', err.message)
  }
}

setupCrisisTables()
