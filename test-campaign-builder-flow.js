/**
 * Test the complete campaign builder flow to verify:
 * 1. Research generation works
 * 2. Positioning generation works (via new API route)
 * 3. Blueprint generation adapts research (not regenerates)
 * 4. Journalist names from research appear in blueprint
 * 5. Stakeholder psychology from research maps to campaign
 */

const testCampaignGoal = "Launch a new AI-powered sustainability platform targeting enterprise CFOs and sustainability officers"

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Campaign Builder Flow\n')

  // Step 1: Test Research Generation
  console.log('📊 Step 1: Testing Research Generation...')

  // First, create a session by sending the campaign goal
  const intentResponse = await fetch('http://localhost:3000/api/campaign-builder-orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orgId: 'test-org',
      userId: 'test-user',
      message: testCampaignGoal,
      campaignGoal: testCampaignGoal
    })
  })

  if (!intentResponse.ok) {
    console.error('❌ Intent stage failed:', intentResponse.status)
    const errorText = await intentResponse.text()
    console.error('Error:', errorText)
    return
  }

  const intentData = await intentResponse.json()
  console.log('✅ Intent captured, session:', intentData.sessionId)

  // Now confirm to trigger research
  const researchResponse = await fetch('http://localhost:3000/api/campaign-builder-orchestrator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: intentData.sessionId,
      orgId: 'test-org',
      message: 'yes, proceed with research',
      campaignGoal: testCampaignGoal
    })
  })

  if (!researchResponse.ok) {
    console.error('❌ Research failed:', researchResponse.status)
    return
  }

  const researchData = await researchResponse.json()
  console.log('✅ Research completed')
  console.log('   - Stakeholders found:', researchData.research?.stakeholders?.length || 0)
  console.log('   - Journalists found:', researchData.research?.channelIntelligence?.journalists?.length || 0)
  console.log('   - Narratives found:', researchData.research?.narrativeLandscape?.dominantNarratives?.length || 0)

  // Extract sample data
  const sampleStakeholder = researchData.research?.stakeholders?.[0]
  const sampleJournalist = researchData.research?.channelIntelligence?.journalists?.[0]

  console.log('\n📌 Sample Research Data:')
  if (sampleStakeholder) {
    console.log('   Stakeholder:', sampleStakeholder.name, '- Psychology:', sampleStakeholder.psychology?.values?.[0] || 'N/A')
  }
  if (sampleJournalist) {
    console.log('   Journalist:', sampleJournalist.name, 'from', sampleJournalist.outlet, '- Beat:', sampleJournalist.beat)
  }

  // Step 2: Test Positioning Generation
  console.log('\n📊 Step 2: Testing Positioning Generation...')
  const positioningResponse = await fetch('http://localhost:3000/api/generate-positioning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      researchData: researchData.research,
      campaignGoal: testCampaignGoal
    })
  })

  if (!positioningResponse.ok) {
    console.error('❌ Positioning failed:', positioningResponse.status)
    return
  }

  const positioningData = await positioningResponse.json()
  console.log('✅ Positioning completed')
  console.log('   - Options generated:', positioningData.positioning?.options?.length || 0)

  const selectedPositioning = positioningData.positioning?.options?.[0]
  console.log('   - Selected:', selectedPositioning?.name || 'N/A')

  // Step 3: Test Blueprint Generation with Research Adaptation
  console.log('\n📊 Step 3: Testing Blueprint Generation (with research adaptation)...')
  const startTime = Date.now()

  const blueprintResponse = await fetch('http://localhost:3000/api/generate-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blueprintType: 'VECTOR',
      campaignGoal: testCampaignGoal,
      researchData: researchData.research,
      selectedPositioning: selectedPositioning
    })
  })

  const duration = Math.round((Date.now() - startTime) / 1000)

  if (!blueprintResponse.ok) {
    console.error('❌ Blueprint failed:', blueprintResponse.status)
    return
  }

  const blueprintData = await blueprintResponse.json()
  console.log(`✅ Blueprint completed in ${duration}s`)

  // Step 4: Verify Research Data Adaptation
  console.log('\n🔍 Step 4: Verifying Research Data was ADAPTED (not regenerated)...')

  const blueprint = blueprintData.blueprint
  const stakeholderMapping = blueprint?.stakeholderMapping
  const pillar4 = blueprint?.fourPillars?.find(p => p.pillar === 'Pillar 4 - Media Engagement')

  // Check if stakeholder names from research appear in blueprint
  let stakeholdersMatched = 0
  if (stakeholderMapping && researchData.research?.stakeholders) {
    researchData.research.stakeholders.forEach(researchStakeholder => {
      const found = stakeholderMapping.some(mapped =>
        mapped.stakeholder?.toLowerCase().includes(researchStakeholder.name?.toLowerCase())
      )
      if (found) stakeholdersMatched++
    })
  }

  console.log(`   ✓ Stakeholders from research in blueprint: ${stakeholdersMatched}/${researchData.research?.stakeholders?.length || 0}`)

  // Check if journalist names from research appear in Pillar 4
  let journalistsMatched = 0
  if (pillar4 && researchData.research?.channelIntelligence?.journalists) {
    const pillar4Text = JSON.stringify(pillar4).toLowerCase()
    researchData.research.channelIntelligence.journalists.slice(0, 15).forEach(researchJournalist => {
      if (pillar4Text.includes(researchJournalist.name?.toLowerCase())) {
        journalistsMatched++
        console.log(`   ✓ Found journalist: ${researchJournalist.name} from ${researchJournalist.outlet}`)
      }
    })
  }

  console.log(`   ✓ Journalists from research in Pillar 4: ${journalistsMatched}/15`)

  // Check if psychology from research appears in campaign
  let psychologyMatched = false
  if (sampleStakeholder?.psychology?.values?.[0]) {
    const blueprintText = JSON.stringify(blueprint).toLowerCase()
    const psychologyValue = sampleStakeholder.psychology.values[0].toLowerCase()
    psychologyMatched = blueprintText.includes(psychologyValue)
    console.log(`   ${psychologyMatched ? '✓' : '✗'} Psychology value "${sampleStakeholder.psychology.values[0]}" found in blueprint`)
  }

  // Final Assessment
  console.log('\n📋 FINAL ASSESSMENT:')

  if (duration < 90) {
    console.log('   ✅ Generation time acceptable (<90s)')
  } else {
    console.log(`   ⚠️  Generation time high: ${duration}s (may still be regenerating research)`)
  }

  if (stakeholdersMatched > 0) {
    console.log('   ✅ Stakeholders adapted from research')
  } else {
    console.log('   ❌ Stakeholders NOT found - may be regenerating')
  }

  if (journalistsMatched >= 5) {
    console.log('   ✅ Journalists adapted from research')
  } else {
    console.log('   ❌ Journalists NOT found - may be regenerating')
  }

  if (psychologyMatched) {
    console.log('   ✅ Stakeholder psychology preserved')
  } else {
    console.log('   ⚠️  Psychology not clearly preserved')
  }

  // Success criteria
  const success = duration < 90 && stakeholdersMatched > 0 && journalistsMatched >= 5

  if (success) {
    console.log('\n🎉 SUCCESS: Blueprint is properly adapting research data!')
  } else {
    console.log('\n❌ ISSUES DETECTED: Blueprint may still be regenerating research')
    console.log('\nRecommendations:')
    if (duration >= 90) {
      console.log('   - Duration too high: Verify edge function is using structured JSON')
    }
    if (stakeholdersMatched === 0) {
      console.log('   - Check stakeholder mapping instructions in blueprint generator')
    }
    if (journalistsMatched < 5) {
      console.log('   - Check Pillar 4 instructions are using actual journalist names')
    }
  }
}

testCompleteFlow().catch(console.error)
