#!/usr/bin/env node

/**
 * Test NIV Fixes for:
 * 1. Organization context awareness
 * 2. Clean responses without process narration
 * 3. Structured strategic frameworks
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testNivFixes() {
  console.log('🧪 Testing NIV Fixes')
  console.log('=' .repeat(60))

  // Test 1: Organization Context Awareness
  console.log('\n1️⃣ TEST: Organization Context Awareness')
  console.log('-' .repeat(60))

  const testQuery1 = "What are our competitors doing with AI?"

  try {
    const response1 = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: testQuery1,
        sessionId: 'test-fixes',
        conversationId: 'test-conversation',
        stage: 'full',
        context: {
          organizationId: 'Tesla',  // Using Tesla as organization
          activeModule: 'intelligence'
        }
      })
    })

    const result1 = await response1.json()
    console.log('Query:', testQuery1)
    console.log('Organization:', 'Tesla')

    // Check if response mentions Tesla specifically
    if (result1.message && result1.message.includes('Tesla')) {
      console.log('✅ Organization context maintained - mentions Tesla')
    } else {
      console.log('⚠️  Organization context issue - should mention Tesla')
    }

    // Check if response is clean (no process narration)
    const processPatterns = [
      "I'm searching",
      "Let me search",
      "I'll look",
      "Checking the",
      "Running the pipeline",
      "Using Fireplexity"
    ]

    const hasProcessNarration = processPatterns.some(pattern =>
      result1.message && result1.message.includes(pattern)
    )

    if (!hasProcessNarration) {
      console.log('✅ Clean response - no process narration')
    } else {
      console.log('⚠️  Response contains process narration')
    }

    console.log('\nResponse preview:', result1.message?.substring(0, 200) + '...')

  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
  }

  // Test 2: Clean Strategic Framework Generation
  console.log('\n\n2️⃣ TEST: Strategic Framework Generation')
  console.log('-' .repeat(60))

  const testQuery2 = "Create a campaign strategy for our new electric vehicle launch"

  try {
    const response2 = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: testQuery2,
        sessionId: 'test-fixes-2',
        conversationId: 'test-conversation-2',
        stage: 'full',
        context: {
          organizationId: 'Tesla',
          activeModule: 'intelligence'
        }
      })
    })

    const result2 = await response2.json()
    console.log('Query:', testQuery2)

    // Check if strategic framework was generated
    if (result2.type === 'strategic-framework') {
      console.log('✅ Strategic framework generated')

      // Check if framework is structured properly
      if (result2.framework) {
        console.log('✅ Framework is structured object, not just text')

        // Check key components
        console.log('\nFramework Components:')
        console.log('  Strategy:', !!result2.framework.strategy ? '✅' : '❌')
        console.log('  Narrative:', !!result2.framework.narrative ? '✅' : '❌')
        console.log('  Execution:', !!result2.framework.execution ? '✅' : '❌')
        console.log('  Handoff:', !!result2.framework.handoff ? '✅' : '❌')
      }

      // Check if message is formatted properly
      if (result2.message && result2.message.includes('**Strategic Framework for Tesla**')) {
        console.log('✅ Message properly formatted with organization name')
      }

    } else {
      console.log('⚠️  No strategic framework generated for strategic query')
    }

    console.log('\nMessage format:', result2.message?.substring(0, 300) + '...')

  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
  }

  // Test 3: No Tool Tags or Process Details
  console.log('\n\n3️⃣ TEST: No Tool Tags or Process Details')
  console.log('-' .repeat(60))

  const testQuery3 = "What's the latest news about our industry?"

  try {
    const response3 = await fetch(`${SUPABASE_URL}/functions/v1/niv-orchestrator-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: testQuery3,
        sessionId: 'test-fixes-3',
        stage: 'full',
        context: {
          organizationId: 'OpenAI',
          activeModule: 'intelligence'
        }
      })
    })

    const result3 = await response3.json()
    console.log('Query:', testQuery3)

    // Check for tool tags
    const toolTags = ['<tool_use>', '</tool_use>', 'tool_name', '{\"tool_name\"']
    const hasToolTags = toolTags.some(tag =>
      result3.message && result3.message.includes(tag)
    )

    if (!hasToolTags) {
      console.log('✅ No tool tags in response')
    } else {
      console.log('⚠️  Response contains tool tags')
    }

    // Check organization is correctly referenced
    if (result3.organizationName === 'OpenAI') {
      console.log('✅ Organization name preserved:', result3.organizationName)
    }

    console.log('\nFull response check:')
    console.log('  Clean of XML tags:', !result3.message?.includes('<') ? '✅' : '⚠️')
    console.log('  Clean of JSON blocks:', !result3.message?.includes('tool_name') ? '✅' : '⚠️')
    console.log('  Mentions organization:', result3.message?.includes('OpenAI') ? '✅' : '⚠️')

  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✨ NIV Fixes Test Complete!')
  console.log('\nSummary:')
  console.log('1. Organization context should be maintained throughout')
  console.log('2. Responses should be clean without process narration')
  console.log('3. Strategic queries should generate structured frameworks')
  console.log('4. No tool tags or XML should appear in responses')
}

// Run the test
testNivFixes().catch(console.error)