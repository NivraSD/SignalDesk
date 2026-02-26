/**
 * Test what our Edge function returns when polling for status
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

const GENERATION_ID = 'HuJmokGGoGwlCaQiMRw9D'  // From latest test
const ORGANIZATION_ID = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

async function testEdgeFunctionResponse() {
  console.log('🔍 Testing Edge function response for generation:', GENERATION_ID)
  console.log('')

  // Call our Edge function with the same parameters as the test
  const { data, error } = await supabase.functions.invoke('gamma-presentation', {
    body: {
      generationId: GENERATION_ID,
      // Include capture request to trigger capturePresentation
      capture: true,
      organization_id: ORGANIZATION_ID,
      campaign_id: '6a6d89d6-9089-49ab-8187-c76ebc62589a'
    }
  })

  if (error) {
    console.error('❌ Edge function error:', error)
    return
  }

  console.log('📊 Edge Function Response:')
  console.log(JSON.stringify(data, null, 2))

  console.log('\n📋 Key Fields:')
  console.log(`   status: ${data.status}`)
  console.log(`   captured: ${data.captured}`)
  console.log(`   exportUrls.pptx: ${data.exportUrls?.pptx || 'NOT PROVIDED'}`)
  console.log(`   message: ${data.message}`)

  if (data.captured) {
    console.log(`\n✅ Captured! ID: ${data.capturedId}`)
  } else {
    console.log('\n❌ NOT captured - capturePresentation did not execute or failed')
  }
}

testEdgeFunctionResponse().catch(console.error)
