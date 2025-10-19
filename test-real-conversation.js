// Test real conversation flow with NIV
async function testConversation() {
  const conversationId = `conv-${Date.now()}`
  const sessionId = `session-${Date.now()}`

  console.log('Starting conversation:', conversationId)

  // Message 1: Vague request
  console.log('\n=== Message 1: Vague request ===')
  let response = await fetch('http://localhost:3000/api/supabase/functions/niv-orchestrator-robust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'I want to do something with AI',
      sessionId,
      stage: 'full',
      conversationHistory: [],
      context: {
        organizationId: 'OpenAI',
        conversationId,
        activeModule: 'intelligence'
      }
    })
  })

  let data = await response.json()
  console.log('NIV Response:', data.message.substring(0, 300) + '...')
  console.log('Concept Stage:', data.conceptState?.stage, 'Confidence:', data.conceptState?.confidence + '%')

  // Message 2: More specific
  console.log('\n=== Message 2: More specific ===')
  response = await fetch('http://localhost:3000/api/supabase/functions/niv-orchestrator-robust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'We want to position ourselves as AI safety leaders',
      sessionId,
      stage: 'full',
      conversationHistory: [
        { role: 'user', content: 'I want to do something with AI' },
        { role: 'assistant', content: data.message }
      ],
      context: {
        organizationId: 'OpenAI',
        conversationId,
        activeModule: 'intelligence'
      }
    })
  })

  data = await response.json()
  console.log('NIV Response:', data.message.substring(0, 300) + '...')
  console.log('Concept Stage:', data.conceptState?.stage, 'Confidence:', data.conceptState?.confidence + '%')

  // Message 3: Add timeline
  console.log('\n=== Message 3: Add timeline ===')
  response = await fetch('http://localhost:3000/api/supabase/functions/niv-orchestrator-robust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'We need to launch in Q1 2025 and target enterprise decision makers',
      sessionId,
      stage: 'full',
      conversationHistory: [
        { role: 'user', content: 'I want to do something with AI' },
        { role: 'assistant', content: 'NIV response...' },
        { role: 'user', content: 'We want to position ourselves as AI safety leaders' },
        { role: 'assistant', content: data.message }
      ],
      context: {
        organizationId: 'OpenAI',
        conversationId,
        activeModule: 'intelligence'
      }
    })
  })

  data = await response.json()
  console.log('NIV Response:', data.message.substring(0, 300) + '...')
  console.log('Concept Stage:', data.conceptState?.stage, 'Confidence:', data.conceptState?.confidence + '%')
  console.log('Concept:', data.conceptState?.concept)
}

testConversation().catch(console.error)