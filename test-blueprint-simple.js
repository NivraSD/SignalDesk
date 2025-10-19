/**
 * Simple test - just check what's actually being returned
 */

const mockResearch = {
  stakeholders: [
    {
      name: "Enterprise CFOs",
      size: 5000,
      psychology: {
        values: ["Financial ROI"],
        fears: ["Budget overruns"],
        aspirations: ["Industry leadership"]
      }
    }
  ],
  channelIntelligence: {
    journalists: [
      { name: "Sarah Martinez", outlet: "CFO Magazine", beat: "Technology", tier: "tier1" },
      { name: "David Chen", outlet: "GreenBiz", beat: "Sustainability", tier: "tier1" }
    ]
  },
  narrativeLandscape: {
    dominantNarratives: [
      { narrative: "AI accelerates sustainability", source: "Tech press" }
    ]
  },
  historicalInsights: {
    patternRecommendations: [
      { pattern: "Lead with ROI metrics", rationale: "CFOs need financial proof" }
    ]
  }
}

async function testSimple() {
  console.log('Testing blueprint generation...\n')

  const start = Date.now()
  const response = await fetch('http://localhost:3000/api/generate-blueprint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blueprintType: 'VECTOR',
      campaignGoal: 'Launch AI sustainability platform',
      researchData: mockResearch,
      selectedPositioning: {
        name: "The AI-Powered ROI Platform",
        description: "Position as ROI-focused",
        rationale: "Bridges stakeholders"
      }
    })
  })

  const duration = Math.round((Date.now() - start) / 1000)

  if (!response.ok) {
    console.error('Failed:', response.status)
    const text = await response.text()
    console.error(text)
    return
  }

  const data = await response.json()

  console.log(`✅ Generated in ${duration}s\n`)
  console.log('Response structure:', Object.keys(data))
  console.log('\nData structure:', typeof data, Array.isArray(data) ? 'Array' : 'Object')

  // Check if it's wrapped in "blueprint" key
  if (data.blueprint) {
    console.log('\n✅ Found blueprint key')
    console.log('Blueprint keys:', Object.keys(data.blueprint))

    // Save to file for inspection
    const fs = require('fs')
    fs.writeFileSync('blueprint-output.json', JSON.stringify(data, null, 2))
    console.log('\n📄 Saved full output to blueprint-output.json')

    // Check for our test data
    const text = JSON.stringify(data).toLowerCase()
    console.log('\n🔍 Checking for test data:')
    console.log('  - "Sarah Martinez" found:', text.includes('sarah martinez'))
    console.log('  - "David Chen" found:', text.includes('david chen'))
    console.log('  - "Enterprise CFOs" found:', text.includes('enterprise cfos'))
    console.log('  - "Financial ROI" found:', text.includes('financial roi') || text.includes('roi'))
  } else {
    console.log('\n⚠️  No "blueprint" key found')
    console.log('Top-level keys:', Object.keys(data))

    // Save to file anyway
    const fs = require('fs')
    fs.writeFileSync('blueprint-output.json', JSON.stringify(data, null, 2))
    console.log('\n📄 Saved full output to blueprint-output.json')
  }
}

testSimple().catch(console.error)
