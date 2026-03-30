const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testPipeline() {
  console.log('🧪 Testing complete NIV pipeline with strategic campaigns save...\n')

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // Use known good session
  const sessionId = '86165256-4f3b-44f9-b04a-ef7bac1c12e5'

  const { data: session, error: sessionError } = await supabase
    .from('campaign_builder_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    console.error('❌ Session not found:', sessionError)
    return
  }

  console.log('📋 Session:', sessionId)
  console.log('   Goal:', session.campaign_goal)
  console.log('   Has blueprint:', !!session.blueprint)
  console.log('   Has part3:', !!session.blueprint?.part3_tacticalOrchestration)

  // Check if strategic campaign already exists
  const { data: existingCampaign } = await supabase
    .from('strategic_campaigns')
    .select('id, campaign_name, total_content_pieces')
    .eq('blueprint_id', sessionId)
    .maybeSingle()

  if (existingCampaign) {
    console.log('\n✅ Strategic campaign already exists!')
    console.log('   ID:', existingCampaign.id)
    console.log('   Name:', existingCampaign.campaign_name)
    console.log('   Content pieces:', existingCampaign.total_content_pieces)
    return
  }

  console.log('\n🚀 Running executor...')
  console.log('   This will:')
  console.log('   1. Generate campaign summary')
  console.log('   2. Generate content with direct Claude calls')
  console.log('   3. Save to strategic_campaigns table')
  console.log('   4. Return organized results')
  console.log('\n⏱️  Waiting up to 120 seconds...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-campaign-executor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        blueprintId: sessionId,
        blueprint: session.blueprint,
        campaignType: 'VECTOR_CAMPAIGN',
        orgId: 'OpenAI',
        organizationContext: {
          name: 'OpenAI',
          industry: 'Technology'
        }
      })
    })

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`\n📡 Response received in ${elapsed}s`)
    console.log(`   Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('\n✅ EXECUTOR SUCCESS!')
      console.log('   Architecture:', data.architecture)
      console.log('   Phases generated:', data.phasesGenerated, '/', data.totalPhases)
      console.log('   Total content pieces:', data.totalContentPieces)
      console.log('   Campaign folder:', data.campaignFolder)

      // Now check if strategic campaign was saved
      console.log('\n🔍 Checking strategic_campaigns table...')
      const { data: savedCampaign, error: checkError } = await supabase
        .from('strategic_campaigns')
        .select('id, campaign_name, total_content_pieces, phases')
        .eq('blueprint_id', sessionId)
        .maybeSingle()

      if (savedCampaign) {
        console.log('✅ STRATEGIC CAMPAIGN SAVED!')
        console.log('   ID:', savedCampaign.id)
        console.log('   Name:', savedCampaign.campaign_name)
        console.log('   Content pieces:', savedCampaign.total_content_pieces)
        console.log('   Phases:', savedCampaign.phases?.length || 0)

        if (savedCampaign.phases?.[0]?.content) {
          console.log('   Phase 1 content:', savedCampaign.phases[0].content.length, 'pieces')
          console.log('\n📄 Sample content from Phase 1:')
          const sample = savedCampaign.phases[0].content[0]
          console.log('   Type:', sample.type)
          console.log('   Stakeholder:', sample.stakeholder)
          console.log('   Brief:', sample.brief?.substring(0, 100) + '...')
          console.log('   Content length:', sample.content?.length, 'chars')
        }
      } else {
        console.log('⚠️  Strategic campaign not found in database')
        if (checkError) console.log('   Error:', checkError.message)
      }
    } else {
      const errorText = await response.text()
      console.error('\n❌ EXECUTOR FAILED')
      console.error('   Error:', errorText.substring(0, 500))
    }
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.error(`\n❌ Request failed after ${elapsed}s:`, error.message)
  }
}

testPipeline()
