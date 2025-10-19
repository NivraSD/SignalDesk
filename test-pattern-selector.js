// Test pattern selector
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const mockResearchData = {
  stakeholders: [
    { name: "Enterprise IT Directors", decisionPower: "High" },
    { name: "Developer Team Leads", decisionPower: "Medium" }
  ],
  competitiveLandscape: {
    competitors: [{ name: "Incumbent" }, { name: "Startup" }],
    marketMaturity: "Growing"
  },
  brandPosition: "Challenger"
}

async function test() {
  console.log('🧪 Testing Pattern Selector...\n')
  const startTime = Date.now()

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-blueprint-pattern-selector`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        campaignGoal: "Position platform as combining reliability with velocity",
        researchData: mockResearchData,
        orgId: "test-org"
      })
    })

    const elapsedTime = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Pattern selector failed (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Pattern selector complete in ${elapsedTime}ms`)
    console.log(`   Selected: ${result.selectedPattern.pattern}`)
    console.log(`   Rationale: ${result.selectedPattern.rationale}`)
    console.log(`   Timeline: ${result.selectedPattern.estimatedTimeline}`)
    console.log(`   Confidence: ${result.selectedPattern.confidence}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

test()
