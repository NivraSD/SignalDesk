/**
 * Direct test of the stakeholder orchestration function
 */

const mockPart1 = {
  targetStakeholders: [
    {
      name: "Enterprise CFOs",
      size: 5000,
      keyCharacteristics: ["ROI-focused", "Risk-averse"],
      currentPerceptions: "Skeptical of new technology"
    }
  ]
}

const mockPart2 = {
  influenceStrategies: [
    {
      stakeholder: "Enterprise CFOs",
      influenceLevers: [
        {
          leverName: "Fear Mitigation: Budget Overruns",
          leverType: "Fear Mitigation",
          psychologicalTrigger: "Show predictable ROI and cost controls",
          emotionalResonance: "Financial security and control"
        },
        {
          leverName: "Aspiration Activation: Industry Leadership",
          leverType: "Aspiration Activation",
          psychologicalTrigger: "Position as competitive advantage",
          emotionalResonance: "Being recognized as innovation leader"
        }
      ],
      channelIntelligence: {
        journalists: [
          { name: "Sarah Martinez", outlet: "CFO Magazine", beat: "Technology", tier: "tier1" },
          { name: "David Chen", outlet: "GreenBiz", beat: "Sustainability", tier: "tier1" }
        ]
      }
    }
  ]
}

async function testDirect() {
  console.log('Testing stakeholder orchestration directly...\n')

  const startTime = Date.now()

  try {
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-blueprint-stakeholder-orchestration',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          part1_strategicFoundation: mockPart1,
          part2_psychologicalInfluence: mockPart2
        })
      }
    )

    const duration = Math.round((Date.now() - startTime) / 1000)

    if (!response.ok) {
      console.error('❌ Failed:', response.status, response.statusText)
      const text = await response.text()
      console.error('Error response:', text)
      return
    }

    const data = await response.json()

    console.log(`✅ Generated in ${duration}s\n`)
    console.log('Response keys:', Object.keys(data))

    if (data.success) {
      console.log('\n✅ Success!')
      const orchestration = data.part3_stakeholderOrchestration
      console.log('Stakeholder plans:', orchestration.stakeholderOrchestrationPlans?.length || 0)

      if (orchestration.stakeholderOrchestrationPlans?.length > 0) {
        const firstPlan = orchestration.stakeholderOrchestrationPlans[0]
        console.log('First plan stakeholder:', firstPlan.stakeholder?.name)
        console.log('Influence levers:', firstPlan.influenceLevers?.length || 0)

        if (firstPlan.influenceLevers?.length > 0) {
          const firstLever = firstPlan.influenceLevers[0]
          console.log('First lever:', firstLever.leverName)
          console.log('Campaign channels:')
          console.log('  - Media pitches:', firstLever.campaign?.mediaPitches?.length || 0)
          console.log('  - Social posts:', firstLever.campaign?.socialPosts?.length || 0)
          console.log('  - Thought leadership:', firstLever.campaign?.thoughtLeadership?.length || 0)
          console.log('  - Additional tactics:', firstLever.campaign?.additionalTactics?.length || 0)
        }
      }
    } else {
      console.error('\n❌ Error:', data.error)
    }

    // Save to file
    const fs = require('fs')
    fs.writeFileSync('stakeholder-orchestration-test.json', JSON.stringify(data, null, 2))
    console.log('\n📄 Saved to stakeholder-orchestration-test.json')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDirect().catch(console.error)
