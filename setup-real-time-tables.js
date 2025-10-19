// Setup Real-Time Intelligence Tables
const fs = require('fs')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function setupTables() {
  console.log('📊 Setting up Real-Time Intelligence tables...\n')

  // Read SQL file
  const sql = fs.readFileSync('create-real-time-intelligence-tables.sql', 'utf8')

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`Found ${statements.length} SQL statements\n`)

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comments
    if (statement.trim().startsWith('--')) continue

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ query: statement })
      })

      if (!response.ok) {
        const error = await response.text()
        console.log(`❌ Statement ${i + 1} failed:`, error.substring(0, 200))
      } else {
        // Show first few words of statement
        const preview = statement.substring(0, 60).replace(/\n/g, ' ')
        console.log(`✅ Statement ${i + 1}: ${preview}...`)
      }
    } catch (error) {
      console.error(`❌ Error on statement ${i + 1}:`, error.message)
    }
  }

  console.log('\n✅ Table setup complete!')
}

setupTables().catch(console.error)
