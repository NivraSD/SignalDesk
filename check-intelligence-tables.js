// Check what intelligence tables exist
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

async function checkIntelligenceTables() {
  console.log('🔍 Checking intelligence-related tables...\n')

  // Try different possible table names
  const tablesToCheck = [
    'real_time_intelligence',
    'realtime_intelligence',
    'intelligence',
    'discovery_profiles',
    'stakeholders',
    'opportunities'
  ]

  for (const tableName of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: false })
      .eq('organization_id', openaiOrgId)
      .limit(3)

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`)
    } else {
      console.log(`✅ ${tableName}: ${count} records found`)
      if (data && data.length > 0) {
        console.log(`   Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}`)
      }
    }
  }
}

checkIntelligenceTables().catch(console.error)
