const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
)

async function test() {
  console.log('🧪 Testing INSERT with ANON key...')
  
  const { data, error } = await supabase
    .from('content_library')
    .insert({
      organization_id: '5a8eaca4-ee9a-448a-ab46-1e371c64592f',
      content_type: 'test',
      title: 'Test Insert from Anon',
      content: 'Testing if anon can insert',
      folder: 'test',
      status: 'test'
    })
    .select()
  
  if (error) {
    console.error('❌ INSERT FAILED:', error)
  } else {
    console.log('✅ INSERT SUCCESS:', data)
  }
  
  process.exit(0)
}

test().catch(console.error)
