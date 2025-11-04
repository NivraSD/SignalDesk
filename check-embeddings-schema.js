// Check if embeddings schema is already in place
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking embeddings schema...\n')

  // Check if embedding column exists on content_library
  const { data: contentColumns, error: contentError } = await supabase
    .from('content_library')
    .select('*')
    .limit(1)

  if (contentError) {
    console.error('❌ Error querying content_library:', contentError.message)
    return
  }

  // Check if we have the embedding column
  const hasEmbeddingColumn = contentColumns && contentColumns.length > 0 &&
    contentColumns[0].hasOwnProperty('embedding')

  console.log('📊 Schema Check Results:')
  console.log('========================')
  console.log(`content_library.embedding column: ${hasEmbeddingColumn ? '✅ EXISTS' : '❌ MISSING'}`)

  if (hasEmbeddingColumn) {
    // Check if any content has embeddings
    const { data: withEmbeddings, error } = await supabase
      .from('content_library')
      .select('id, title, embedding_model')
      .not('embedding', 'is', null)
      .limit(5)

    if (!error && withEmbeddings) {
      console.log(`\n📈 Content with embeddings: ${withEmbeddings.length > 0 ? `${withEmbeddings.length} found` : 'None yet'}`)

      if (withEmbeddings.length > 0) {
        console.log('\nSample:')
        withEmbeddings.forEach(item => {
          console.log(`  - ${item.title} (${item.embedding_model})`)
        })
      }
    }

    // Check if functions exist
    console.log('\n🔧 Functions Check:')
    const { data: functions, error: funcError } = await supabase.functions.invoke('generate-embeddings', {
      body: { text: 'test' }
    })

    if (!funcError || funcError.message?.includes('FunctionsHttpError')) {
      console.log('  ✅ generate-embeddings: Deployed')
    } else {
      console.log('  ❌ generate-embeddings: Not found')
    }

    console.log('\n✅ Schema is ready!')
    console.log('\n📝 Next steps:')
    console.log('  1. All new content will automatically get embeddings')
    console.log('  2. Run backfill to add embeddings to existing content')
    console.log('  3. Test semantic search in Memory Vault')
  } else {
    console.log('\n❌ Schema NOT ready!')
    console.log('\n📝 You need to run the migration:')
    console.log('  - Use Supabase Dashboard > SQL Editor')
    console.log('  - Or connect via psql and run: supabase/migrations/20250104_add_semantic_search.sql')
  }
}

checkSchema()
