/**
 * Quick poll test to see debug info
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

const GENERATION_ID = 'lXOAGW3gC6zzXOFf6zCr1'  // From last test
const ORGANIZATION_ID = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
const OPPORTUNITY_ID = '19da7428-88ab-4280-aabb-af76790f6abc'

async function quickPoll() {
  console.log('🔍 Quick poll with debug info')
  console.log('')

  const { data, error } = await supabase.functions.invoke('gamma-presentation', {
    body: {
      generationId: GENERATION_ID,
      capture: true,
      organization_id: ORGANIZATION_ID,
      campaign_id: OPPORTUNITY_ID
    }
  })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log('📊 Response:')
  console.log(JSON.stringify(data, null, 2))
}

quickPoll().catch(console.error)
