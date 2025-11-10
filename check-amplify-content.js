const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAmplifyContent() {
  const amplifyOrgId = '7eae4fc0-32e0-46d9-bfd6-cd44946d9b76'

  console.log('🔍 Checking content for Amplify:', amplifyOrgId, '\n')

  // Check content_library
  const { data: content, error: contentError } = await supabase
    .from('content_library')
    .select('id, title, content_type, created_at, organization_id')
    .eq('organization_id', amplifyOrgId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (contentError) {
    console.error('❌ Error fetching content:', contentError)
  } else {
    console.log(`✅ Found ${content.length} content items for Amplify:`)
    content.forEach(c => {
      console.log(`   - [${c.content_type}] ${c.title} (${c.created_at})`)
    })
  }

  console.log('\n🔍 Checking ALL content (no org filter)...\n')

  const { data: allContent, error: allError } = await supabase
    .from('content_library')
    .select('id, title, organization_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (allError) {
    console.error('❌ Error:', allError)
  } else {
    console.log(`✅ Found ${allContent.length} content items total:`)
    allContent.forEach(c => {
      console.log(`   - ${c.title} (org: ${c.organization_id || 'null'})`)
    })
  }

  process.exit(0)
}

checkAmplifyContent().catch(console.error)
