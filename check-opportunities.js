// Check opportunities table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOpportunities() {
  console.log('🔍 Checking opportunities table...\n')

  // Total count
  const { count: totalCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total opportunities: ${totalCount}`)

  // Check for aviation
  const { data: aviation } = await supabase
    .from('opportunities')
    .select('id, title, organization_id, status, created_at')
    .ilike('title', '%aviation%')
    .order('created_at', { ascending: false })

  console.log(`\n✈️ Aviation opportunities: ${aviation?.length || 0}`)
  if (aviation && aviation.length > 0) {
    aviation.forEach(opp => {
      console.log(`  - ${opp.title}`)
      console.log(`    ID: ${opp.id}`)
      console.log(`    Org: ${opp.organization_id}`)
      console.log(`    Status: ${opp.status}`)
      console.log(`    Created: ${opp.created_at}`)
    })
  }

  // Check most recent
  const { data: recent } = await supabase
    .from('opportunities')
    .select('id, title, organization_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log(`\n📋 Most recent opportunities: ${recent?.length || 0}`)
  if (recent) {
    recent.forEach((opp, i) => {
      console.log(`${i + 1}. ${opp.title.substring(0, 60)}...`)
      console.log(`   Status: ${opp.status} | Org: ${opp.organization_id.substring(0, 8)}... | Created: ${opp.created_at}`)
    })
  }

  // Check with specific org ID from UI
  const { data: orgOpps } = await supabase
    .from('opportunities')
    .select('id, title, organization_id, status, created_at')
    .eq('organization_id', '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')
    .order('created_at', { ascending: false })

  console.log(`\n🏢 Opportunities for org 7a2835cb: ${orgOpps?.length || 0}`)
  if (orgOpps) {
    orgOpps.forEach((opp, i) => {
      console.log(`${i + 1}. [${opp.status}] ${opp.title.substring(0, 60)}...`)
    })
  }

  // Check active/executed filter (what UI uses)
  const { data: activeOpps } = await supabase
    .from('opportunities')
    .select('id, title, status')
    .eq('organization_id', '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')
    .in('status', ['active', 'executed'])

  console.log(`\n🎯 Active/Executed opps for org 7a2835cb: ${activeOpps?.length || 0}`)
  if (activeOpps) {
    activeOpps.forEach((opp, i) => {
      console.log(`${i + 1}. [${opp.status}] ${opp.title}`)
    })
  }
}

checkOpportunities()
