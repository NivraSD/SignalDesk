const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function applyCampaignsTable() {
  console.log('Reading migration file...')
  const sql = fs.readFileSync('supabase/migrations/20251009_create_campaigns_table.sql', 'utf8')

  console.log('Applying campaigns table migration...')

  // Split into individual statements and execute
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') ||
        statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY') ||
        statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('CREATE TRIGGER') ||
        statement.includes('GRANT')) {
      console.log(`Executing: ${statement.substring(0, 60)}...`)
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      if (error) {
        console.log(`Note: ${error.message}`)
      }
    }
  }

  console.log('\nVerifying campaigns table...')
  const { data, error } = await supabase.from('campaigns').select('count').limit(0)

  if (error) {
    console.error('Error verifying table:', error)
  } else {
    console.log('✅ Campaigns table exists and is accessible!')
  }
}

applyCampaignsTable().catch(console.error)
