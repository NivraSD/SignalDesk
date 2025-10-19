const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testNIVUnderstanding() {
  console.log('🧪 Testing NIV Content with Understanding Step\n')

  const testMessage = "Create a media plan for our Sora 2 video generation launch"

  console.log('📤 Sending message:', testMessage)
  console.log('Stage: acknowledge\n')

  // Step 1: Acknowledgment with understanding
  const ackResponse = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      message: testMessage,
      conversationHistory: [],
      organizationContext: {
        conversationId: `test-understanding-${Date.now()}`,
        organizationId: 'OpenAI'
      },
      stage: 'acknowledge'
    })
  })

  if (!ackResponse.ok) {
    console.error('❌ Acknowledgment failed:', ackResponse.statusText)
    const error = await ackResponse.text()
    console.error(error)
    return
  }

  const ackData = await ackResponse.json()
  console.log('✅ Acknowledgment received:')
  console.log('Message:', ackData.message)
  console.log('\n🧠 Understanding:')
  console.log(JSON.stringify(ackData.understanding, null, 2))

  console.log('\n📊 Understanding analysis:')
  if (ackData.understanding) {
    console.log('- What user wants:', ackData.understanding.what_user_wants)
    console.log('- Content type:', ackData.understanding.content_type)
    console.log('- Entities:', ackData.understanding.entities?.join(', ') || 'none')
    console.log('- Topics:', ackData.understanding.topics?.join(', ') || 'none')
    console.log('- Requires fresh data:', ackData.understanding.requires_fresh_data)
    if (ackData.understanding.why_fresh_data) {
      console.log('- Why:', ackData.understanding.why_fresh_data)
    }
  }

  console.log('\n✅ Understanding step is working like orchestrator-robust!')
}

testNIVUnderstanding().catch(console.error)
