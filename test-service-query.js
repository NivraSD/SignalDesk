const { createClient } = require('@supabase/supabase-js')

const serviceClient = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  console.log('🔍 Testing with SERVICE key (bypasses RLS)...')
  
  const { data, error } = await serviceClient
    .from('content_library')
    .select('id, title, organization_id, content_type')
    .eq('organization_id', '5a8eaca4-ee9a-448a-ab46-1e371c64592f')
    .limit(10)
  
  if (error) {
    console.error('❌ ERROR:', error)
  } else {
    console.log('✅ Found', data.length, 'items')
    data.forEach(item => console.log(`   - ${item.title}`))
  }
  
  process.exit(0)
}

test().catch(console.error)
