import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearStaleSearches() {
  console.log('🗑️ Checking fireplexity_searches table...')

  // First, let's see what's in there
  const { data: searches, error: fetchError } = await supabase
    .from('fireplexity_searches')
    .select('id, query, created_at, results')
    .order('created_at', { ascending: false })
    .limit(5)

  if (fetchError) {
    console.error('Error fetching searches:', fetchError)
    return
  }

  if (searches && searches.length > 0) {
    console.log(`Found ${searches.length} saved searches:`)
    searches.forEach(search => {
      const articles = search.results?.articles || []
      console.log(`- Query: "${search.query || 'unknown'}"`)
      console.log(`  Created: ${search.created_at}`)
      console.log(`  Articles: ${articles.length}`)
      if (articles.length > 0 && articles[0].title) {
        console.log(`  First article: "${articles[0].title.substring(0, 100)}..."`)
      }

      // Check if it contains the problematic meta superintelligence article
      const hasMeta = articles.some(a =>
        a.title?.toLowerCase().includes('superintelligence') ||
        a.content?.toLowerCase().includes('meta superintelligence')
      )
      if (hasMeta) {
        console.log('  ⚠️ Contains META SUPERINTELLIGENCE content!')
      }
    })

    // Clear all old searches - especially those with meta superintelligence
    console.log('\n🗑️ Clearing all old fireplexity_searches...')

    // Since id is an integer, we can just delete all by using a broad condition
    const { error: deleteError, count } = await supabase
      .from('fireplexity_searches')
      .delete()
      .gte('id', 0) // Delete all rows where id >= 0 (which is all of them)

    if (deleteError) {
      console.error('Error deleting searches:', deleteError)
    } else {
      console.log('✅ Cleared all old search data')
    }
  } else {
    console.log('No saved searches found')
  }
}

clearStaleSearches()