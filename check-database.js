/**
 * Check if presentation was saved to database
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

const GENERATION_ID = '2zTTdQD2vmJ345jqoKWBq'

async function checkDatabase() {
  console.log('🔍 Checking database for generation:', GENERATION_ID)
  console.log('')

  // Check campaign_presentations
  console.log('📊 Checking campaign_presentations table...')
  const { data: presentation, error: presError } = await supabase
    .from('campaign_presentations')
    .select('*')
    .eq('gamma_id', GENERATION_ID)

  if (presError) {
    console.error('❌ Error querying campaign_presentations:', presError)
  } else if (presentation && presentation.length > 0) {
    console.log(`✅ Found ${presentation.length} presentation(s) in campaign_presentations!`)
    console.log(JSON.stringify(presentation[0], null, 2))
  } else {
    console.log('❌ NOT found in campaign_presentations')
  }

  console.log('')

  // Check content_library
  console.log('📊 Checking content_library table...')
  const { data: content, error: contentError } = await supabase
    .from('content_library')
    .select('*')
    .eq('metadata->>gamma_id', GENERATION_ID)

  if (contentError) {
    console.error('❌ Error querying content_library:', contentError)
  } else if (content && content.length > 0) {
    console.log(`✅ Found ${content.length} item(s) in content_library!`)
    console.log(JSON.stringify(content[0], null, 2))
  } else {
    console.log('❌ NOT found in content_library')
  }
}

checkDatabase().catch(console.error)
