// Check how much content exists in content_library
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContent() {
  console.log('🔍 Checking content_library...\n')

  // Total content count
  const { count: totalCount } = await supabase
    .from('content_library')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 Total items in content_library: ${totalCount}`)

  // Count with embeddings
  const { count: withEmbeddings } = await supabase
    .from('content_library')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null)

  console.log(`✅ Items WITH embeddings: ${withEmbeddings}`)
  console.log(`❌ Items WITHOUT embeddings: ${totalCount - withEmbeddings}`)

  // Sample recent content
  const { data: recentContent } = await supabase
    .from('content_library')
    .select('id, title, content_type, created_at, embedding IS NOT NULL as has_embedding')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('\n📋 Recent content (last 10):')
  recentContent?.forEach((item, i) => {
    console.log(`${i + 1}. [${item.has_embedding ? '✅' : '❌'}] ${item.content_type} - ${item.title.substring(0, 50)}...`)
  })

  // Count by organization
  const { data: orgCounts } = await supabase
    .from('content_library')
    .select('organization_id')
    .limit(1000)

  const orgs = new Set(orgCounts?.map(c => c.organization_id))
  console.log(`\n🏢 Organizations with content: ${orgs.size}`)

  if (totalCount === 0) {
    console.log('\n⚠️ WARNING: No content in database!')
    console.log('   → Semantic search will return 0 results')
    console.log('   → You need to create some content first')
  } else if (withEmbeddings === 0) {
    console.log('\n⚠️ WARNING: No embeddings generated yet!')
    console.log('   → Run backfill or create new content')
  }
}

checkContent()
