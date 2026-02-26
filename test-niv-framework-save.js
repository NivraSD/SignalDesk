#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Test NIV framework generation and saving
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNDU0ODYsImV4cCI6MjA0NzYyMTQ4Nn0.ZsUzCKlp2oqxCNJArNjQKLvRQC1xMJm1nJdK1NvCmrs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testFrameworkSave() {
  console.log('🧪 Testing NIV framework generation and saving...\n')

  // Test cases that should trigger framework generation
  const testCases = [
    {
      name: 'Explicit framework request',
      message: 'Create a strategic framework for our Q1 2025 product launch campaign',
      expectedType: 'strategic-framework'
    },
    {
      name: 'Save to memory vault request',
      message: 'Based on our discussion, save this to Memory Vault for the upcoming campaign',
      expectedType: 'strategic-framework'
    },
    {
      name: 'Finalize strategy request',
      message: 'Let\'s finalize the strategy and make it ready for execution',
      expectedType: 'strategic-framework'
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log(`   Message: "${testCase.message}"`)

    try {
      // Call NIV orchestrator
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: testCase.message,
          organizationId: 'test-org',
          conversationHistory: [],
          conceptState: {
            concept: { goal: 'Test framework generation' },
            researchHistory: [{
              query: 'test research',
              results: {
                keyFindings: ['Test finding 1', 'Test finding 2'],
                intelligencePipeline: {
                  articles: [
                    { title: 'Test Article', summary: 'Test summary' }
                  ],
                  synthesis: 'Test synthesis of research'
                }
              }
            }]
          }
        })
      })

      const data = await response.json()

      // Show full response for debugging
      if (!data.type) {
        console.log(`   Response status: ${response.status}`)
        console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}...`)
      }

      console.log(`   Response type: ${data.type}`)
      console.log(`   Has framework: ${data.framework ? 'YES' : 'NO'}`)
      console.log(`   Ready for handoff: ${data.readyForHandoff || false}`)

      if (data.type === testCase.expectedType) {
        console.log(`   ✅ PASS - Got expected type`)

        // Check if framework has required structure
        if (data.framework) {
          const hasStrategy = !!data.framework.strategy
          const hasTactics = !!data.framework.tactics
          const hasIntelligence = !!data.framework.intelligence
          const hasDiscovery = !!data.framework.discovery

          console.log(`   Framework structure:`)
          console.log(`     - Strategy: ${hasStrategy ? '✓' : '✗'}`)
          console.log(`     - Tactics: ${hasTactics ? '✓' : '✗'}`)
          console.log(`     - Intelligence: ${hasIntelligence ? '✓' : '✗'}`)
          console.log(`     - Discovery: ${hasDiscovery ? '✓' : '✗'}`)

          // Check if it has actual content (not empty)
          const articleCount = data.framework.intelligence?.supporting_data?.articles?.length || 0
          const findingsCount = data.framework.intelligence?.key_findings?.length || 0

          console.log(`   Content stats:`)
          console.log(`     - Articles: ${articleCount}`)
          console.log(`     - Key findings: ${findingsCount}`)

          if (articleCount > 0 && findingsCount > 0) {
            console.log(`   ✅ Framework has substance`)
          } else {
            console.log(`   ⚠️  Framework lacks content`)
          }
        }
      } else {
        console.log(`   ❌ FAIL - Expected ${testCase.expectedType}, got ${data.type}`)
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`)
    }
  }

  // Now test that regular queries DON'T trigger framework generation
  console.log('\n\n📝 Testing non-framework queries (should NOT generate frameworks):')

  const nonFrameworkQueries = [
    'What are the latest news about our competitor?',
    'Research market trends in AI',
    'Tell me about recent product launches in our industry'
  ]

  for (const query of nonFrameworkQueries) {
    console.log(`\n   Query: "${query}"`)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: query,
          organizationId: 'test-org',
          conversationHistory: [],
          conceptState: {
            concept: { goal: 'Research' },
            researchHistory: []
          }
        })
      })

      const data = await response.json()

      if (data.type !== 'strategic-framework') {
        console.log(`   ✅ Correctly returned type: ${data.type}`)
      } else {
        console.log(`   ❌ Incorrectly generated framework for research query`)
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`)
    }
  }

  console.log('\n\n✨ Test complete!')
}

testFrameworkSave().catch(console.error)