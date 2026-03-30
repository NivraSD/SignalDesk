// Backfill embeddings for existing content
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runBackfill() {
  console.log('🚀 Starting backfill for content_library...\n')

  let totalProcessed = 0
  let batchNumber = 1

  while (true) {
    console.log(`\n📦 Processing batch ${batchNumber} (50 items)...`)

    const { data, error } = await supabase.functions.invoke('backfill-embeddings', {
      body: {
        table: 'content_library',
        batchSize: 50
      }
    })

    if (error) {
      console.error('❌ Backfill error:', error)
      break
    }

    console.log(`✅ Batch ${batchNumber} complete:`, data)

    totalProcessed += data.processed || 0

    // If we processed 0 items, we're done
    if (data.processed === 0) {
      console.log('\n🎉 Backfill complete!')
      console.log(`📊 Total items processed: ${totalProcessed}`)
      break
    }

    batchNumber++

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

runBackfill()
