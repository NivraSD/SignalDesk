const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
)

async function test() {
  console.log('🔍 Testing Amplify content query with ANON key...')
  console.log('   Org ID: 5a8eaca4-ee9a-448a-ab46-1e371c64592f')
  
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('organization_id', '5a8eaca4-ee9a-448a-ab46-1e371c64592f')
    .limit(10)
  
  if (error) {
    console.error('❌ ERROR:', error)
  } else {
    console.log('✅ SUCCESS: Found', data.length, 'items for Amplify')
    data.forEach(item => {
      console.log(`   - ${item.title} (${item.content_type}, folder: ${item.folder})`)
    })
  }
  
  process.exit(0)
}

test().catch(console.error)
