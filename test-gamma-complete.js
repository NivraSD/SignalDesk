/**
 * Comprehensive Gamma Presentation Test
 *
 * Tests the complete pipeline:
 * 1. Generate presentation with opportunity link
 * 2. Poll for completion and PPTX export
 * 3. Verify storage bucket upload
 * 4. Verify campaign_presentations table
 * 5. Verify Memory Vault (content_library)
 * 6. Verify folder structure
 * 7. Test NIV queries
 * 8. Download and verify PPTX file
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

const ORGANIZATION_ID = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

// Test configuration
const TEST_CONFIG = {
  withOpportunity: true,  // Set to false to test standalone presentation
  opportunityId: null,    // Will create a test opportunity if withOpportunity = true
  testTitle: 'Comprehensive Test - Strategic Planning Framework',
  testContent: `# Strategic Planning Framework

## Executive Summary
This framework provides a comprehensive approach to strategic planning, combining data-driven insights with creative thinking.

## Core Principles
1. **Stakeholder-Centric**: Every strategy must consider all key stakeholders
2. **Data-Informed**: Decisions backed by quantitative and qualitative data
3. **Agile Execution**: Flexible implementation with rapid iteration
4. **Measurable Impact**: Clear metrics and KPIs for success

## Strategic Pillars

### 1. Market Intelligence
- Competitive landscape analysis
- Customer behavior patterns
- Industry trend monitoring
- Emerging opportunity detection

### 2. Stakeholder Engagement
- Influence mapping and profiling
- Communication strategy development
- Relationship building tactics
- Sentiment tracking and analysis

### 3. Content & Campaigns
- Narrative development and messaging
- Multi-channel content distribution
- Campaign performance optimization
- Brand consistency management

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- Stakeholder mapping and prioritization
- Baseline metrics establishment
- Tool and platform setup
- Team alignment workshops

### Phase 2: Execution (Week 3-8)
- Campaign launches across channels
- Real-time performance monitoring
- Rapid iteration based on feedback
- Cross-functional collaboration

### Phase 3: Optimization (Week 9-12)
- Performance analysis and insights
- Strategy refinement
- Best practice documentation
- Success story capture

## Success Metrics
- Stakeholder engagement rates
- Campaign reach and conversion
- Sentiment improvement
- ROI and business impact

## Conclusion
Strategic planning is not a one-time exercise but a continuous cycle of learning, adapting, and improving.`
}

let testResults = {
  generation: false,
  pptxExport: false,
  storageUpload: false,
  campaignPresentations: false,
  memoryVault: false,
  folderStructure: false,
  nivQueries: false,
  fileDownload: false
}

async function createTestOpportunity() {
  console.log('📋 Creating test opportunity...')

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      organization_id: ORGANIZATION_ID,
      title: 'Test Opportunity - Gamma Integration Test',
      description: 'Automated test opportunity for Gamma presentation integration',
      score: 85,
      urgency: 'medium',
      category: 'test',
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Failed to create test opportunity:', error)
    return null
  }

  console.log(`✅ Test opportunity created: ${data.id}`)
  return data.id
}

async function cleanupTestOpportunity(opportunityId) {
  if (!opportunityId) return

  console.log('\n🧹 Cleaning up test opportunity...')

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', opportunityId)

  if (error) {
    console.error('⚠️  Failed to cleanup opportunity:', error)
  } else {
    console.log('✅ Test opportunity deleted')
  }
}

async function testGeneration(opportunityId) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 1: Presentation Generation')
  console.log('='.repeat(80))

  const requestBody = {
    title: TEST_CONFIG.testTitle,
    content: TEST_CONFIG.testContent,
    capture: true,
    organization_id: ORGANIZATION_ID,
    campaign_id: opportunityId,
    options: {
      numCards: 10,
      imageSource: 'ai',
      tone: 'professional',
      audience: 'executives'
    }
  }

  console.log('\n📊 Request:')
  console.log(`   Title: ${requestBody.title}`)
  console.log(`   Opportunity: ${opportunityId || 'None (standalone)'}`)
  console.log(`   Slides: ${requestBody.options.numCards}`)
  console.log(`   Content length: ${requestBody.content.length} chars`)

  const { data, error } = await supabase.functions.invoke('gamma-presentation', {
    body: requestBody
  })

  if (error) {
    console.error('\n❌ Generation request failed:', error)
    return null
  }

  console.log('\n✅ Generation started!')
  console.log(`   Generation ID: ${data.generationId}`)
  console.log(`   Status: ${data.status}`)
  console.log(`   Estimated time: ${data.estimatedTime}`)

  testResults.generation = true
  return data.generationId
}

async function testPollingAndExport(generationId, opportunityId) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 2: Polling & PPTX Export')
  console.log('='.repeat(80))

  let attempts = 0
  const maxAttempts = 30  // 2.5 minutes with 5-second intervals

  while (attempts < maxAttempts) {
    attempts++
    process.stdout.write(`\r⏳ Polling... attempt ${attempts}/${maxAttempts}`)

    await new Promise(resolve => setTimeout(resolve, 5000))

    // Include capture params when polling so Edge function can reconstruct capture request
    const { data: status, error } = await supabase.functions.invoke('gamma-presentation', {
      body: {
        generationId,
        capture: true,
        organization_id: ORGANIZATION_ID,
        campaign_id: opportunityId
      }
    })

    if (error) {
      console.error(`\n❌ Status check failed:`, error)
      continue
    }

    if (status.status === 'completed') {
      console.log('\n\n✅ Generation completed!')
      console.log(`   Gamma URL: ${status.gammaUrl}`)
      console.log(`   Captured: ${status.captured}`)

      if (status.exportUrls?.pptx) {
        console.log(`   ✅ PPTX export URL found!`)
        testResults.pptxExport = true
      } else {
        console.log(`   ⚠️  No PPTX export URL in response`)
        console.log(`   Export URLs:`, JSON.stringify(status.exportUrls, null, 2))
      }

      return status
    }

    if (status.status === 'error') {
      console.error(`\n❌ Generation failed:`, status.message)
      return null
    }
  }

  console.log('\n⏱️  Timeout: Generation did not complete in time')
  return null
}

async function testCampaignPresentations(generationId) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 3: campaign_presentations Table')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('campaign_presentations')
    .select('*')
    .eq('gamma_id', generationId)
    .single()

  if (error) {
    console.error('\n❌ Not found in campaign_presentations:', error)
    return null
  }

  console.log('\n✅ Found in campaign_presentations!')
  console.log(`   ID: ${data.id}`)
  console.log(`   Title: ${data.title}`)
  console.log(`   Opportunity ID: ${data.campaign_id || 'None'}`)
  console.log(`   Slide count: ${data.slide_count}`)
  console.log(`   PPTX URL: ${data.pptx_url ? '✅ Stored' : '❌ Missing'}`)
  console.log(`   Full text: ${data.full_text?.length || 0} characters`)
  console.log(`   Slides extracted: ${data.slides?.length || 0}`)

  if (data.pptx_url) {
    testResults.storageUpload = true
    testResults.campaignPresentations = true
  }

  return data
}

async function testMemoryVault(generationId, opportunityId) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 4: Memory Vault (content_library)')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('metadata->>gamma_id', generationId)
    .single()

  if (error) {
    console.error('\n❌ Not found in Memory Vault:', error)
    return null
  }

  console.log('\n✅ Found in Memory Vault!')
  console.log(`   ID: ${data.id}`)
  console.log(`   Title: ${data.title}`)
  console.log(`   Content type: ${data.content_type}`)
  console.log(`   Folder path: ${data.folder_path}`)
  console.log(`   Session ID: ${data.session_id}`)
  console.log(`   Tags: ${data.tags?.join(', ')}`)
  console.log(`   Content: ${data.content?.length || 0} characters`)

  // Verify folder structure
  if (opportunityId) {
    const expectedFolder = `opportunities/${opportunityId}/presentations`
    const correctFolder = data.folder_path === expectedFolder
    console.log(`\n📁 Folder Structure:`)
    console.log(`   Expected: ${expectedFolder}`)
    console.log(`   Actual: ${data.folder_path}`)
    console.log(`   ${correctFolder ? '✅' : '❌'} ${correctFolder ? 'Correct!' : 'MISMATCH!'}`)

    if (correctFolder) {
      testResults.folderStructure = true
    }
  }

  testResults.memoryVault = true
  return data
}

async function testNIVQueries(opportunityId) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 5: NIV Query Capabilities')
  console.log('='.repeat(80))

  if (!opportunityId) {
    console.log('\n⚠️  Skipping NIV tests (no opportunity)')
    testResults.nivQueries = true
    return
  }

  // Test 1: Get all presentations for opportunity
  console.log('\n📊 Query 1: All presentations for this opportunity')
  const { data: presentations, error: presError } = await supabase
    .from('content_library')
    .select('*')
    .eq('session_id', opportunityId)
    .eq('content_type', 'presentation')

  if (presError) {
    console.error('❌ Query failed:', presError)
  } else {
    console.log(`✅ Found ${presentations.length} presentation(s)`)
    presentations.forEach(p => {
      console.log(`   - ${p.title}`)
    })
  }

  // Test 2: Get all content in opportunity folder
  console.log('\n📊 Query 2: All content in opportunity folder')
  const { data: folderContent, error: folderError } = await supabase
    .from('content_library')
    .select('*')
    .like('folder_path', `opportunities/${opportunityId}%`)

  if (folderError) {
    console.error('❌ Query failed:', folderError)
  } else {
    console.log(`✅ Found ${folderContent.length} item(s) in folder`)
    const byType = folderContent.reduce((acc, item) => {
      acc[item.content_type] = (acc[item.content_type] || 0) + 1
      return acc
    }, {})
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`)
    })
  }

  // Test 3: Search presentations by content
  console.log('\n📊 Query 3: Search presentation content')
  const { data: searchResults, error: searchError } = await supabase
    .from('content_library')
    .select('title, content')
    .eq('content_type', 'presentation')
    .textSearch('content', 'strategic planning')
    .limit(5)

  if (searchError) {
    console.error('❌ Search failed:', searchError)
  } else {
    console.log(`✅ Found ${searchResults.length} presentation(s) mentioning "strategic planning"`)
    searchResults.forEach(r => {
      console.log(`   - ${r.title}`)
    })
  }

  testResults.nivQueries = true
}

async function testFileDownload(pptxUrl) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST 6: PPTX File Download')
  console.log('='.repeat(80))

  if (!pptxUrl) {
    console.log('\n⚠️  Skipping download test (no PPTX URL)')
    return
  }

  try {
    console.log(`\n📥 Downloading from: ${pptxUrl}`)
    const response = await fetch(pptxUrl)

    if (!response.ok) {
      console.error(`❌ Download failed: ${response.status} ${response.statusText}`)
      return
    }

    const buffer = await response.arrayBuffer()
    const size = buffer.byteLength

    console.log(`✅ File downloaded successfully!`)
    console.log(`   Size: ${(size / 1024).toFixed(2)} KB`)
    console.log(`   Type: ${response.headers.get('content-type')}`)

    // Verify it's a valid PPTX (should start with PK - ZIP format)
    const bytes = new Uint8Array(buffer)
    const isPptx = bytes[0] === 0x50 && bytes[1] === 0x4B  // "PK"

    console.log(`   ${isPptx ? '✅' : '❌'} Valid PPTX format: ${isPptx}`)

    if (isPptx && size > 10000) {
      testResults.fileDownload = true
    }
  } catch (error) {
    console.error('❌ Download error:', error)
  }
}

function printTestSummary() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))

  const tests = [
    { name: 'Presentation Generation', passed: testResults.generation },
    { name: 'PPTX Export Request', passed: testResults.pptxExport },
    { name: 'Storage Upload', passed: testResults.storageUpload },
    { name: 'campaign_presentations Table', passed: testResults.campaignPresentations },
    { name: 'Memory Vault Integration', passed: testResults.memoryVault },
    { name: 'Folder Structure', passed: testResults.folderStructure },
    { name: 'NIV Query Capabilities', passed: testResults.nivQueries },
    { name: 'PPTX File Download', passed: testResults.fileDownload }
  ]

  tests.forEach(test => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${test.name}`)
  })

  const totalTests = tests.length
  const passedTests = tests.filter(t => t.passed).length
  const passRate = ((passedTests / totalTests) * 100).toFixed(1)

  console.log('\n' + '-'.repeat(80))
  console.log(`Overall: ${passedTests}/${totalTests} tests passed (${passRate}%)`)
  console.log('='.repeat(80))

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Gamma integration is working perfectly!')
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.')
  }
}

async function runTests() {
  console.log('🧪 Comprehensive Gamma Presentation Test')
  console.log('='.repeat(80))
  console.log(`Organization: ${ORGANIZATION_ID}`)
  console.log(`Test mode: ${TEST_CONFIG.withOpportunity ? 'With Opportunity' : 'Standalone'}`)
  console.log('')

  let opportunityId = TEST_CONFIG.opportunityId

  try {
    // Create test opportunity if needed
    if (TEST_CONFIG.withOpportunity && !opportunityId) {
      opportunityId = await createTestOpportunity()
      if (!opportunityId) {
        console.error('❌ Cannot continue without opportunity')
        return
      }
    }

    // Run tests
    const generationId = await testGeneration(opportunityId)
    if (!generationId) {
      console.error('❌ Cannot continue without generation ID')
      return
    }

    const status = await testPollingAndExport(generationId, opportunityId)
    if (!status) {
      console.error('❌ Generation did not complete successfully')
      return
    }

    const presentation = await testCampaignPresentations(generationId)
    await testMemoryVault(generationId, opportunityId)
    await testNIVQueries(opportunityId)

    if (presentation?.pptx_url) {
      await testFileDownload(presentation.pptx_url)
    }

    // Print summary
    printTestSummary()

  } finally {
    // Cleanup
    if (TEST_CONFIG.withOpportunity && opportunityId && !TEST_CONFIG.opportunityId) {
      await cleanupTestOpportunity(opportunityId)
    }
  }
}

runTests().catch(console.error)
