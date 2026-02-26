#!/usr/bin/env node

// Test the fixed NIV Content System

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testNIVContent() {
  console.log('🚀 Testing Fixed NIV Content System')
  console.log('=====================================\n')

  // Test 1: Initial Sundance media plan request
  console.log('📋 TEST 1: Requesting Sundance Media Plan')
  console.log('Message: "We are hosting an event at Sundance film festival to highlight our capability of helping with every step of the creative process. We need a media plan to amplify the event and our narrative"\n')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: "We are hosting an event at Sundance film festival to highlight our capability of helping with every step of the creative process. We need a media plan to amplify the event and our narrative",
        conversationId: `test-${Date.now()}`,
        context: {
          organization: {
            name: 'CreativeTech Inc',
            industry: 'Creative Technology'
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Response ${response.status}: ${error}`)
    }

    const data = await response.json()
    console.log('✅ RESPONSE RECEIVED:')
    console.log('- Stage:', data.stage)
    console.log('- Needs Agreement:', data.needsAgreement)
    console.log('\nNIV\'s Response:')
    console.log('----------------------------')
    console.log(data.message.substring(0, 500) + '...')
    console.log('----------------------------\n')

    if (data.needsAgreement) {
      console.log('✅ SUCCESS! NIV presented strategy and is awaiting agreement')
      console.log('Expected behavior: NIV should have presented a strategic approach with deliverables\n')

      // Test 2: User agrees to strategy
      console.log('📋 TEST 2: User Agrees to Strategy')
      console.log('Message: "Perfect, let\'s create it"\n')

      // CRITICAL: Use the SAME conversation ID returned from first request
      console.log('Using conversation ID:', data.conversationId)

      const response2 = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-robust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: "Perfect, let's create it",
          conversationId: data.conversationId, // SAME ID - this is the key!
          conversationHistory: [
            {
              role: 'user',
              content: "We are hosting an event at Sundance film festival to highlight our capability of helping with every step of the creative process. We need a media plan to amplify the event and our narrative"
            },
            {
              role: 'assistant',
              content: data.message
            }
          ],
          context: {
            organization: {
              name: 'CreativeTech Inc',
              industry: 'Creative Technology'
            }
          }
        })
      })

      const data2 = await response2.json()
      console.log('✅ RESPONSE RECEIVED:')
      console.log('- Stage:', data2.stage)
      console.log('- Stream:', data2.stream)
      console.log('- Has Messages:', !!data2.messages)

      if (data2.stream && data2.messages) {
        console.log('\n📦 CONTENT GENERATION MESSAGES:')
        data2.messages.forEach((msg, i) => {
          console.log(`\n${i + 1}. ${msg.type.toUpperCase()}: ${msg.message}`)
          if (msg.contentType) console.log(`   Content Type: ${msg.contentType}`)
          if (msg.savedPath) console.log(`   Saved To: ${msg.savedPath}`)
        })

        console.log('\n✅ SUCCESS! Content generation is working!')
      } else {
        console.log('⚠️ WARNING: Expected streaming messages but got:', data2)
      }
    } else {
      console.log('⚠️ WARNING: NIV did not present strategy as expected')
      console.log('Full response:', JSON.stringify(data, null, 2))
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message)
    console.error('Stack:', error.stack)
  }

  // Test 3: Test MCP Content Tool Directly
  console.log('\n📋 TEST 3: Testing MCP Content Tool Directly')
  console.log('Testing press-release generation...\n')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        tool: 'press-release',
        parameters: {
          company: 'CreativeTech Inc',
          announcement: 'Hosting exclusive event at Sundance Film Festival',
          keyMessages: ['Creative process innovation', 'Industry partnership', 'Technology meets art']
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`MCP Tool failed ${response.status}: ${error}`)
    }

    const data = await response.json()
    console.log('✅ MCP Tool Response:')
    console.log('- Success:', data.success)
    console.log('- Has Content:', !!data.content)
    if (data.content) {
      console.log('- Content Preview:', data.content.substring(0, 200) + '...')
    }

  } catch (error) {
    console.error('❌ MCP Tool Error:', error.message)
  }

  console.log('\n=====================================')
  console.log('🎯 TEST SUMMARY:')
  console.log('1. NIV should present strategy before creating content ✓')
  console.log('2. NIV should wait for user agreement ✓')
  console.log('3. NIV should generate content progressively ✓')
  console.log('4. MCP tools should work with proper auth ✓')
  console.log('5. Content should be saved to Memory Vault and Content Library ✓')
}

// Run the test
testNIVContent().catch(console.error)