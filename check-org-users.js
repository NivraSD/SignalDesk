const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkOrgUsers() {
  console.log('📋 Checking organizations and user relationships...\n')

  // Get all organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (orgsError) {
    console.error('❌ Error fetching orgs:', orgsError)
  } else {
    console.log(`✅ Found ${orgs.length} organizations:`)
    orgs.forEach(org => {
      console.log(`   - ${org.name} (${org.id})`)
    })
  }

  console.log('\n📊 Checking org_users relationships...\n')

  // Get all org_users
  const { data: orgUsers, error: orgUsersError } = await supabase
    .from('org_users')
    .select('organization_id, user_id, role, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (orgUsersError) {
    console.error('❌ Error fetching org_users:', orgUsersError)
  } else {
    console.log(`✅ Found ${orgUsers.length} org-user relationships:`)
    orgUsers.forEach(ou => {
      console.log(`   - Org: ${ou.organization_id} | User: ${ou.user_id} | Role: ${ou.role}`)
    })
  }

  console.log('\n🔍 Checking for ghost org IDs...\n')

  // Check if the ghost orgs from earlier exist
  const ghostOrgIds = [
    '7eae4fc0-32e0-46d9-bfd6-cd44946d9b76', // Amplify ghost
    '6a5c4a68-4189-4fb6-88f0-3cafb8fed2ce'  // Teneo ghost
  ]

  for (const ghostId of ghostOrgIds) {
    const { data: ghost, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', ghostId)
      .maybeSingle()

    if (ghost) {
      console.log(`   ✅ FOUND: ${ghost.name} (${ghost.id})`)
    } else {
      console.log(`   ❌ NOT FOUND: ${ghostId}`)
    }
  }

  process.exit(0)
}

checkOrgUsers().catch(console.error)
