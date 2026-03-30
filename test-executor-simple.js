const fetch = require('node-fetch')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testExecutor() {
  console.log('🧪 Testing executor with minimal request...\n')

  // Get the latest session
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: session, error } = await supabase
    .from('campaign_builder_sessions')
    .select('id, blueprint, campaign_goal')
    .not('blueprint', 'is', null)
    .eq('id', '86165256-4f3b-44f9-b04a-ef7bac1c12e5')  // Use known good session
    .single()

  if (error || !session) {
    console.error('❌ Could not fetch session:', error)
    return
  }

  console.log(`📋 Testing with session: ${session.id}`)
  console.log(`   Campaign goal: ${session.campaign_goal}\n`)

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-campaign-executor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        blueprintId: session.id,
        blueprint: session.blueprint,
        campaignType: 'VECTOR_CAMPAIGN',
        orgId: 'OpenAI',
        organizationContext: {
          name: 'OpenAI',
          industry: 'Technology'
        }
      })
    })

    console.log(`📡 Response status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Success!')
      console.log('   Architecture:', data.architecture)
      console.log('   Phases generated:', data.phasesGenerated)
      console.log('   Total content:', data.totalContentPieces)
    } else {
      const errorText = await response.text()
      console.error('❌ Error response:', errorText.substring(0, 500))
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

testExecutor()
