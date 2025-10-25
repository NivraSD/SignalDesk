/**
 * Test script for Gamma presentation export functionality
 *
 * This tests the complete flow:
 * 1. Generate presentation with PPTX export
 * 2. Poll for completion
 * 3. Verify PPTX was downloaded and stored
 * 4. Verify content was extracted
 * 5. Verify saved to Memory Vault
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Your organization ID and optional opportunity ID
const ORGANIZATION_ID = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'  // Replace with your org ID
const OPPORTUNITY_ID = null  // Set to an opportunity UUID to test folder integration

// If testing with an opportunity, the presentation will be stored at:
// - Storage: {org_id}/opportunities/{opportunity_id}/presentations/{title}_{gamma_id}.pptx
// - Memory Vault: opportunities/{opportunity_id}/presentations

async function testGammaExport() {
  console.log('🧪 Testing Gamma Presentation Export\n')

  // Step 1: Generate presentation
  console.log('📊 Step 1: Generating presentation...')
  console.log(`   ${OPPORTUNITY_ID ? `Linked to opportunity: ${OPPORTUNITY_ID}` : 'Standalone presentation'}\n`)

  const { data: generateResult, error: generateError } = await supabase.functions.invoke('gamma-presentation', {
    body: {
      title: 'Test Export - AI in Healthcare',
      content: `# AI in Healthcare

## Overview
Artificial Intelligence is transforming healthcare through:
- Improved diagnostics
- Personalized treatment plans
- Drug discovery acceleration
- Patient monitoring systems

## Key Benefits
1. Faster and more accurate diagnoses
2. Reduced healthcare costs
3. Better patient outcomes
4. Enhanced research capabilities

## Challenges
- Data privacy concerns
- Integration with existing systems
- Regulatory compliance
- Training healthcare professionals

## Future Outlook
AI will continue to revolutionize healthcare, making it more accessible, affordable, and effective.`,
      capture: true,  // Enable capture
      organization_id: ORGANIZATION_ID,
      campaign_id: OPPORTUNITY_ID,  // Links to opportunity (if set)
      options: {
        numCards: 5,
        imageSource: 'ai',
        tone: 'professional'
      }
    }
  })

  if (generateError) {
    console.error('❌ Generation failed:', generateError)
    return
  }

  const generationId = generateResult.generationId
  console.log(`✅ Generation started: ${generationId}`)
  console.log(`⏱️  Estimated time: ${generateResult.estimatedTime}\n`)

  // Step 2: Poll for completion
  console.log('⏳ Step 2: Polling for completion...')

  let attempts = 0
  const maxAttempts = 24  // 2 minutes with 5-second intervals

  while (attempts < maxAttempts) {
    attempts++
    console.log(`  Attempt ${attempts}/${maxAttempts}...`)

    await new Promise(resolve => setTimeout(resolve, 5000))  // Wait 5 seconds

    const { data: status, error: statusError } = await supabase.functions.invoke('gamma-presentation', {
      body: { generationId }
    })

    if (statusError) {
      console.error('  ❌ Status check failed:', statusError)
      continue
    }

    console.log(`  Status: ${status.status}`)

    if (status.status === 'completed') {
      console.log('\n✅ Presentation completed!\n')

      // Step 3: Check results
      console.log('📋 Step 3: Checking results...')
      console.log('  Gamma URL:', status.gammaUrl)
      console.log('  Captured:', status.captured)
      console.log('  Export URLs:', JSON.stringify(status.exportUrls, null, 2))

      if (status.exportUrls?.pptx) {
        console.log('  ✅ PPTX export URL found!')
      } else {
        console.log('  ⚠️  No PPTX export URL in response')
      }

      // Step 4: Check database
      console.log('\n📂 Step 4: Checking database...')

      // Check campaign_presentations
      const { data: presentation, error: presError } = await supabase
        .from('campaign_presentations')
        .select('*')
        .eq('gamma_id', generationId)
        .single()

      if (presError) {
        console.error('  ❌ campaign_presentations check failed:', presError)
      } else {
        console.log('  ✅ Found in campaign_presentations:')
        console.log(`     ID: ${presentation.id}`)
        console.log(`     Title: ${presentation.title}`)
        console.log(`     Opportunity: ${presentation.campaign_id || 'None (standalone)'}`)
        console.log(`     Slide count: ${presentation.slide_count}`)
        console.log(`     PPTX URL: ${presentation.pptx_url || 'Not stored'}`)
        console.log(`     Full text length: ${presentation.full_text?.length || 0} chars`)
        console.log(`     Slides extracted: ${presentation.slides?.length || 0}`)

        if (presentation.pptx_url && OPPORTUNITY_ID) {
          console.log(`\n     📁 Storage path includes opportunity folder:`)
          console.log(`        Expected: opportunities/${OPPORTUNITY_ID}/presentations/`)
          const hasOpportunityFolder = presentation.pptx_url.includes(`/opportunities/${OPPORTUNITY_ID}/`)
          console.log(`        ${hasOpportunityFolder ? '✅' : '❌'} Verified in path`)
        }
      }

      // Check content_library (Memory Vault)
      const { data: memoryVault, error: mvError } = await supabase
        .from('content_library')
        .select('*')
        .eq('metadata->>gamma_id', generationId)
        .single()

      if (mvError) {
        console.log('  ⚠️  Not found in Memory Vault (content_library)')
        if (presentation && !presentation.pptx_url) {
          console.log('     Reason: No PPTX was downloaded (export URL not provided by Gamma)')
        }
      } else {
        console.log('  ✅ Found in Memory Vault:')
        console.log(`     ID: ${memoryVault.id}`)
        console.log(`     Title: ${memoryVault.title}`)
        console.log(`     Content type: ${memoryVault.content_type}`)
        console.log(`     Content length: ${memoryVault.content?.length || 0} chars`)
        console.log(`     Tags: ${memoryVault.tags?.join(', ')}`)
        console.log(`     Folder path: ${memoryVault.folder_path}`)

        if (OPPORTUNITY_ID) {
          const expectedFolder = `opportunities/${OPPORTUNITY_ID}/presentations`
          const correctFolder = memoryVault.folder_path === expectedFolder
          console.log(`\n     📁 Opportunity folder organization:`)
          console.log(`        Expected: ${expectedFolder}`)
          console.log(`        ${correctFolder ? '✅' : '❌'} ${correctFolder ? 'Correct!' : 'Mismatch'}`)
        }
      }

      // Step 5: Summary
      console.log('\n📊 Test Summary:')
      console.log('  ✅ Presentation generated successfully')
      console.log(`  ${presentation ? '✅' : '❌'} Saved to campaign_presentations`)
      console.log(`  ${presentation?.pptx_url ? '✅' : '⚠️ '} PPTX downloaded and stored`)
      console.log(`  ${presentation?.full_text && presentation.full_text.length > 200 ? '✅' : '⚠️ '} Content extracted`)
      console.log(`  ${memoryVault ? '✅' : '⚠️ '} Saved to Memory Vault`)

      if (!presentation?.pptx_url) {
        console.log('\n⚠️  NOTE: PPTX was not downloaded.')
        console.log('   This could mean:')
        console.log('   1. Gamma did not provide pptxDownloadUrl in the response')
        console.log('   2. The exportAs parameter was not properly sent')
        console.log('   3. There was an error during download/upload')
        console.log('\n   Check the Edge Function logs for more details:')
        console.log('   supabase functions logs gamma-presentation')
      }

      return
    }

    if (status.status === 'error') {
      console.error('\n❌ Generation failed!')
      console.error('  Message:', status.message)
      return
    }
  }

  console.log('\n⏱️  Timeout: Presentation did not complete in time')
  console.log('   Try checking status manually:')
  console.log(`   supabase functions invoke gamma-presentation --body '{"generationId":"${generationId}"}'`)
}

testGammaExport().catch(console.error)
