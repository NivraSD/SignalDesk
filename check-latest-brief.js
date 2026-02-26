const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function checkBrief() {
  console.log('🔍 Checking latest intelligence brief...\n')

  const { data, error } = await supabase
    .from('real_time_intelligence_briefs')
    .select('*')
    .eq('organization_id', '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('✅ Latest brief found:')
  console.log('   ID:', data.id)
  console.log('   Organization:', data.organization_name)
  console.log('   Created:', data.created_at)
  console.log('   Time window:', data.time_window)
  console.log('   Articles analyzed:', data.articles_analyzed)
  console.log('   Alerts generated:', data.alerts_generated)
  console.log('\n📋 Critical Alerts:')
  if (data.critical_alerts && data.critical_alerts.length > 0) {
    data.critical_alerts.forEach((alert, i) => {
      console.log(`\n   Alert ${i + 1}:`)
      console.log('   - Title:', alert.title)
      console.log('   - Severity:', alert.severity)
      console.log('   - Category:', alert.category)
      console.log('   - Summary:', alert.summary?.substring(0, 100))
    })
  } else {
    console.log('   ⚠️ No critical alerts found')
  }

  console.log('\n📊 Breaking Summary:')
  console.log('  ', data.breaking_summary || 'None')
}

checkBrief()
