const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
)

async function testDirectInsert() {
  console.log('🧪 Testing DIRECT INSERT with ANON key (simulating NIV saves)...\n')

  const { data, error } = await supabase
    .from('content_library')
    .insert({
      organization_id: '7eae4fc0-32e0-46d9-bfd6-cd44946d9b76',
      content_type: 'test-post-restart',
      title: 'Test After PostgREST Restart',
      content: 'Testing if RLS cache is actually cleared',
      folder: 'test',
      status: 'test'
    })
    .select()

  if (error) {
    console.error('❌ INSERT STILL BLOCKED:', error.message)
    console.log('\n⚠️ PostgREST cache NOT cleared yet!')
    console.log('   RLS policies still blocking inserts')
  } else {
    console.log('✅ INSERT SUCCESS:', data)
    console.log('\n✅ PostgREST cache IS cleared!')
    console.log('   NIV saves should work now')
  }

  process.exit(0)
}

testDirectInsert().catch(console.error)
