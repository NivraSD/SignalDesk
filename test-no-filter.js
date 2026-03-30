const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
)

async function test() {
  console.log('🔍 Testing WITHOUT organization filter...')
  
  const { data, error } = await supabase
    .from('content_library')
    .select('id, title, organization_id')
    .limit(10)
  
  if (error) {
    console.error('❌ ERROR:', error)
  } else {
    console.log('✅ Found', data.length, 'items total')
    data.forEach(item => console.log(`   - ${item.title} (org: ${item.organization_id})`))
  }
  
  process.exit(0)
}

test().catch(console.error)
