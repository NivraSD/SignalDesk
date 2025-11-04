// Check for aviation content in the correct Supabase database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAviationContent() {
  console.log('🔍 Checking for Aviation content in content_library...\n')

  // Search for Aviation in content_library
  const { data: aviationContent, error } = await supabase
    .from('content_library')
    .select('id, title, content_type, folder, embedding, embedding_model, created_at')
    .or('title.ilike.%aviation%,folder.ilike.%aviation%')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✈️ Found ${aviationContent?.length || 0} Aviation-related items\n`)

  if (aviationContent && aviationContent.length > 0) {
    aviationContent.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`)
      console.log(`   Type: ${item.content_type}`)
      console.log(`   Folder: ${item.folder || '(no folder)'}`)
      console.log(`   Embedding: ${item.embedding ? `✅ (${item.embedding_model || 'unknown model'})` : '❌ NO EMBEDDING'}`)
      console.log(`   Created: ${item.created_at}`)
      console.log('')
    })
  } else {
    console.log('⚠️ No Aviation content found!')
    console.log('\nLet me check recent content instead...\n')

    const { data: recentContent } = await supabase
      .from('content_library')
      .select('id, title, folder, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('📋 Most recent 10 items:')
    recentContent?.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`)
      console.log(`   Folder: ${item.folder || '(no folder)'}`)
      console.log(`   Created: ${item.created_at}`)
    })
  }
}

checkAviationContent()
