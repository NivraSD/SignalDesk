/**
 * Test polling with capture parameters
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

const GENERATION_ID = '2zTTdQD2vmJ345jqoKWBq'  // From latest test
const ORGANIZATION_ID = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
const OPPORTUNITY_ID = 'c0b70e0a-4c84-4f00-8f58-0b7e81eebfd5'

async function testPolling() {
  console.log('🔍 Testing polling with capture for:', GENERATION_ID)
  console.log('')

  const requestBody = {
    generationId: GENERATION_ID,
    capture: true,
    organization_id: ORGANIZATION_ID,
    campaign_id: OPPORTUNITY_ID
  }

  console.log('📤 Request body:')
  console.log(JSON.stringify(requestBody, null, 2))
  console.log('')

  const { data, error } = await supabase.functions.invoke('gamma-presentation', {
    body: requestBody
  })

  if (error) {
    console.error('❌ Edge function error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return
  }

  console.log('📊 Edge Function Response:')
  console.log(JSON.stringify(data, null, 2))

  console.log('\n📋 Analysis:')
  console.log(`   status: ${data.status}`)
  console.log(`   captured: ${data.captured}`)
  console.log(`   capturedId: ${data.capturedId}`)
  console.log(`   exportUrls.pptx: ${data.exportUrls?.pptx || 'NOT PROVIDED'}`)

  if (data.captured) {
    console.log('\n✅ SUCCESS! Presentation was captured!')
    console.log(`   ID: ${data.capturedId}`)
  } else {
    console.log('\n❌ FAILED - capturePresentation did not execute')
  }
}

testPolling().catch(console.error)
