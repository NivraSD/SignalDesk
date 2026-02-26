// Check what tables executive synthesis uses
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

async function checkSynthesisTables() {
  console.log('🔍 Checking executive synthesis and intelligence tables...\n')

  const tablesToCheck = [
    'opportunities',
    'niv_strategies',
    'intelligence_findings',
    'synthesis_results',
    'research_results',
    'discovery_results',
    'content_library',
    'memory_vault'
  ]

  for (const tableName of tablesToCheck) {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('organization_id', openaiOrgId)
      .limit(1)

    if (error) {
      console.log(`❌ ${tableName}: ${error.message.split('\n')[0]}`)
    } else {
      console.log(`✅ ${tableName}: ${count || 0} records`)
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log(`   Columns: ${columns.slice(0, 8).join(', ')}${columns.length > 8 ? '...' : ''}`)
      }
    }
  }
}

checkSynthesisTables().catch(console.error)
