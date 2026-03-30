/**
 * Test generation with capture enabled from the start
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

const ORGANIZATION_ID = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

async function testGenerationWithCapture() {
  console.log('🧪 Testing generation with capture enabled from start')
  console.log('')

  const requestBody = {
    title: 'Test Presentation - Direct Capture',
    content: `# Test Presentation

This is a test presentation to verify the capture functionality works correctly.

## Key Points
- Point 1: Capture should work
- Point 2: Data should be saved
- Point 3: Memory Vault should have it

## Conclusion
If this works, we'll see the presentation in both tables.`,
    capture: true,
    organization_id: ORGANIZATION_ID,
    campaign_id: null,  // Standalone presentation
    options: {
      numCards: 5,
      imageSource: 'ai'
    }
  }

  console.log('📤 Sending generation request with capture enabled...')
  console.log('')

  const { data, error } = await supabase.functions.invoke('gamma-presentation', {
    body: requestBody
  })

  if (error) {
    console.error('❌ Generation failed:', error)
    return
  }

  console.log('✅ Generation started!')
  console.log(`   Generation ID: ${data.generationId}`)
  console.log(`   Status: ${data.status}`)
  console.log('')

  // Now poll for completion
  console.log('⏳ Polling for completion...')
  let attempts = 0
  const maxAttempts = 30

  while (attempts < maxAttempts) {
    attempts++
    await new Promise(resolve => setTimeout(resolve, 5000))

    const { data: status, error: statusError } = await supabase.functions.invoke('gamma-presentation', {
      body: { generationId: data.generationId }
    })

    if (statusError) {
      console.error(`❌ Status check failed:`, statusError)
      continue
    }

    console.log(`   Attempt ${attempts}: ${status.status}`)

    if (status.status === 'completed') {
      console.log('')
      console.log('✅ Generation completed!')
      console.log(`   Gamma URL: ${status.gammaUrl}`)
      console.log(`   Captured: ${status.captured}`)
      console.log(`   Captured ID: ${status.capturedId || 'N/A'}`)
      console.log(`   PPTX URL: ${status.exportUrls?.pptx || 'N/A'}`)

      // Check database
      console.log('')
      console.log('📊 Checking database...')

      const { data: dbCheck } = await supabase
        .from('campaign_presentations')
        .select('id, title')
        .eq('gamma_id', data.generationId)

      if (dbCheck && dbCheck.length > 0) {
        console.log(`✅ Found in database! ID: ${dbCheck[0].id}`)
      } else {
        console.log('❌ NOT found in database')
      }

      break
    }

    if (status.status === 'error') {
      console.error('❌ Generation failed:', status.message)
      break
    }
  }
}

testGenerationWithCapture().catch(console.error)
