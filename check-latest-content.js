const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function checkLatestContent() {
  console.log('📊 Checking latest content in Memory Vault...\n')

  // Get latest 10 pieces in test campaign folder
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .like('folder', 'campaigns/test-campaign%')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ No content found in test campaign folder')
  } else {
    console.log(`✅ Found ${data.length} pieces:`)
    data.forEach((piece, idx) => {
      console.log(`\n${idx + 1}. ${piece.content_type}`)
      console.log(`   Title: ${piece.title}`)
      console.log(`   Folder: ${piece.folder}`)
      console.log(`   Created: ${piece.created_at}`)
      console.log(`   Has content: ${!!piece.content} (${piece.content?.length || 0} chars)`)
    })
  }
}

checkLatestContent()
