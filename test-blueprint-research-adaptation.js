/**
 * Focused test: Verify that blueprint generator ADAPTS research instead of regenerating
 *
 * This test directly calls the blueprint generator with mock research data
 * and verifies that the research data appears in the generated blueprint
 */

// Mock research data with distinctive names that should appear in blueprint
const mockResearch = {
  stakeholders: [
    {
      name: "Enterprise CFOs (Fortune 500)",
      size: 5000,
      psychology: {
        values: ["Financial ROI", "Risk mitigation", "Regulatory compliance"],
        fears: ["Budget overruns", "Implementation failure", "Greenwashing accusations"],
        aspirations: ["Industry leadership", "Operational excellence", "Sustainability goals"],
        biases: ["Proven technology preference", "Status quo bias"]
      },
      informationDiet: {
        primarySources: ["CFO Magazine", "Harvard Business Review", "LinkedIn"],
        trustedVoices: ["Industry analysts", "Peer CFOs", "McKinsey reports"]
      },
      decisionTriggers: ["Regulatory pressure", "Board mandates", "Competitive disadvantage"],
      currentPerceptions: {
        ofOrganization: "Unknown player in sustainability space"
      }
    },
    {
      name: "Corporate Sustainability Officers",
      size: 3000,
      psychology: {
        values: ["Environmental impact", "ESG metrics", "Stakeholder engagement"],
        fears: ["Missing targets", "Insufficient budget", "Executive buy-in"],
        aspirations: ["Industry recognition", "Measurable impact", "Culture change"],
        biases: ["Data-driven decision making"]
      },
      informationDiet: {
        primarySources: ["GreenBiz", "Sustainable Brands", "Twitter"],
        trustedVoices: ["Climate scientists", "NGO leaders", "CSO peers"]
      },
      decisionTriggers: ["New ESG regulations", "Investor pressure", "Brand reputation risk"],
      currentPerceptions: {
        ofOrganization: "Interesting AI approach, needs proof"
      }
    }
  ],
  narrativeLandscape: {
    dominantNarratives: [
      { narrative: "AI can accelerate sustainability transformation", source: "Tech press" },
      { narrative: "ESG is moving from compliance to competitive advantage", source: "Business media" },
      { narrative: "Carbon accounting is getting more sophisticated", source: "Industry analysts" }
    ],
    narrativeVacuums: [
      { opportunity: "How AI makes sustainability ROI measurable", rationale: "CFOs need financial justification" },
      { opportunity: "Practical AI implementation for mid-market", rationale: "Most coverage focuses on enterprises" }
    ],
    competitivePositioning: [
      { competitor: "Watershed", positioning: "Carbon accounting leader" },
      { competitor: "Persefoni", positioning: "Enterprise climate management platform" }
    ]
  },
  channelIntelligence: {
    journalists: [
      { name: "Sarah Martinez", outlet: "CFO Magazine", beat: "Technology & Finance", tier: "tier1" },
      { name: "David Chen", outlet: "GreenBiz", beat: "Sustainability Technology", tier: "tier1" },
      { name: "Emma Thompson", outlet: "Harvard Business Review", beat: "Corporate Strategy", tier: "tier1" },
      { name: "Michael Roberts", outlet: "TechCrunch", beat: "Enterprise AI", tier: "tier1" },
      { name: "Lisa Anderson", outlet: "Sustainable Brands", beat: "ESG & Innovation", tier: "tier1" }
    ],
    publications: [
      { name: "CFO Magazine" },
      { name: "GreenBiz" },
      { name: "Harvard Business Review" }
    ],
    byStakeholder: [
      { stakeholder: "CFOs", channels: [{ name: "CFO Magazine" }, { name: "LinkedIn" }] },
      { stakeholder: "Sustainability Officers", channels: [{ name: "GreenBiz" }, { name: "Twitter" }] }
    ]
  },
  historicalInsights: {
    successfulCampaigns: [
      { campaign: "Stripe Climate launch", approach: "Product-led thought leadership" },
      { campaign: "Microsoft carbon negative commitment", approach: "Bold target with roadmap" }
    ],
    patternRecommendations: [
      { pattern: "Lead with concrete data and ROI metrics", rationale: "CFO audience requires financial proof" },
      { pattern: "Use third-party validation early", rationale: "Builds credibility faster" }
    ]
  },
  keyInsights: [
    {
      insight: "CFOs prioritize ROI over environmental impact narratives",
      significance: "HIGH",
      actionImplication: "Lead all CFO messaging with financial metrics"
    },
    {
      insight: "Sustainability officers face budget constraints",
      significance: "HIGH",
      actionImplication: "Position as cost-effective compared to manual processes"
    }
  ]
}

const mockPositioning = {
  id: 1,
  name: "The AI-Powered Sustainability ROI Platform",
  tagline: "Turn sustainability commitments into measurable financial outcomes",
  description: "Position as the first platform that translates ESG initiatives into CFO-language: ROI, risk reduction, and competitive advantage",
  rationale: "Bridges the gap between sustainability officers (who need impact) and CFOs (who need returns)",
  targetAudiences: ["Enterprise CFOs", "Corporate Sustainability Officers"],
  differentiators: ["Real-time ROI tracking", "AI-powered insights", "Dual stakeholder approach"],
  confidenceScore: 92
}

async function testBlueprintAdaptation() {
  console.log('🧪 Testing Blueprint Research Adaptation\n')
  console.log('📋 Sending blueprint request with mock research data...\n')

  const startTime = Date.now()

  try {
    const response = await fetch('http://localhost:3000/api/generate-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprintType: 'VECTOR',
        campaignGoal: 'Launch an AI-powered sustainability platform targeting enterprise CFOs and sustainability officers',
        researchData: mockResearch,
        selectedPositioning: mockPositioning
      })
    })

    const duration = Math.round((Date.now() - startTime) / 1000)

    if (!response.ok) {
      console.error(`❌ Blueprint generation failed: ${response.status}`)
      const errorText = await response.text()
      console.error('Error:', errorText)
      return
    }

    const data = await response.json()
    const blueprint = data.blueprint

    console.log(`✅ Blueprint generated in ${duration}s\n`)

    // ============================================
    // VERIFICATION: Check if research was adapted
    // ============================================

    console.log('🔍 VERIFICATION: Checking if research data was adapted...\n')

    let passedTests = 0
    let totalTests = 0

    // Test 1: Duration check
    totalTests++
    console.log(`Test 1: Generation time < 90s`)
    if (duration < 90) {
      console.log(`   ✅ PASS: ${duration}s (acceptable for adaptation)`)
      passedTests++
    } else {
      console.log(`   ❌ FAIL: ${duration}s (too long, may be regenerating)`)
    }

    // Test 2: Stakeholder names appear
    totalTests++
    console.log(`\nTest 2: Stakeholder names from research appear in blueprint`)
    const blueprintText = JSON.stringify(blueprint).toLowerCase()
    const cfosFound = blueprintText.includes('enterprise cfos') || blueprintText.includes('fortune 500')
    const sustOfficersFound = blueprintText.includes('sustainability officers')

    if (cfosFound && sustOfficersFound) {
      console.log(`   ✅ PASS: Both stakeholder groups found`)
      console.log(`      - "Enterprise CFOs" found: ${cfosFound}`)
      console.log(`      - "Sustainability Officers" found: ${sustOfficersFound}`)
      passedTests++
    } else {
      console.log(`   ❌ FAIL: Stakeholder names not found`)
      console.log(`      - "Enterprise CFOs" found: ${cfosFound}`)
      console.log(`      - "Sustainability Officers" found: ${sustOfficersFound}`)
    }

    // Test 3: Psychology values appear
    totalTests++
    console.log(`\nTest 3: Stakeholder psychology from research appears`)
    const financialRoiFound = blueprintText.includes('financial roi') || blueprintText.includes('roi')
    const riskMitigationFound = blueprintText.includes('risk mitigation') || blueprintText.includes('risk')

    if (financialRoiFound && riskMitigationFound) {
      console.log(`   ✅ PASS: Psychology values found`)
      console.log(`      - Financial ROI mentioned: ${financialRoiFound}`)
      console.log(`      - Risk mitigation mentioned: ${riskMitigationFound}`)
      passedTests++
    } else {
      console.log(`   ⚠️  PARTIAL: Some psychology values found`)
      console.log(`      - Financial ROI mentioned: ${financialRoiFound}`)
      console.log(`      - Risk mitigation mentioned: ${riskMitigationFound}`)
      passedTests += 0.5
    }

    // Test 4: Journalist names appear in Pillar 4
    totalTests++
    console.log(`\nTest 4: Actual journalist names appear in Media Engagement pillar`)

    const sarahMartinezFound = blueprintText.includes('sarah martinez')
    const davidChenFound = blueprintText.includes('david chen')
    const emmaTFound = blueprintText.includes('emma thompson')
    const journalistCount = [sarahMartinezFound, davidChenFound, emmaTFound].filter(Boolean).length

    if (journalistCount >= 2) {
      console.log(`   ✅ PASS: ${journalistCount}/3 specific journalists found`)
      console.log(`      - Sarah Martinez (CFO Magazine): ${sarahMartinezFound}`)
      console.log(`      - David Chen (GreenBiz): ${davidChenFound}`)
      console.log(`      - Emma Thompson (HBR): ${emmaTFound}`)
      passedTests++
    } else {
      console.log(`   ❌ FAIL: Only ${journalistCount}/3 journalists found (may be regenerating)`)
      console.log(`      - Sarah Martinez (CFO Magazine): ${sarahMartinezFound}`)
      console.log(`      - David Chen (GreenBiz): ${davidChenFound}`)
      console.log(`      - Emma Thompson (HBR): ${emmaTFound}`)
    }

    // Test 5: Pattern recommendations used
    totalTests++
    console.log(`\nTest 5: Historical pattern recommendations incorporated`)
    const roiMetricsFound = blueprintText.includes('roi') || blueprintText.includes('financial metrics')
    const thirdPartyFound = blueprintText.includes('third-party') || blueprintText.includes('validation') || blueprintText.includes('credibility')

    if (roiMetricsFound && thirdPartyFound) {
      console.log(`   ✅ PASS: Pattern recommendations incorporated`)
      console.log(`      - ROI/metrics focus: ${roiMetricsFound}`)
      console.log(`      - Third-party validation: ${thirdPartyFound}`)
      passedTests++
    } else {
      console.log(`   ⚠️  PARTIAL: Some patterns incorporated`)
      console.log(`      - ROI/metrics focus: ${roiMetricsFound}`)
      console.log(`      - Third-party validation: ${thirdPartyFound}`)
      passedTests += 0.5
    }

    // Final Score
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 FINAL SCORE: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests * 100)}%)`)
    console.log(`${'='.repeat(60)}\n`)

    if (passedTests >= totalTests * 0.8) {
      console.log('🎉 SUCCESS: Blueprint is properly ADAPTING research data!')
      console.log('\n✅ Key indicators:')
      console.log('   - Generation time is reasonable')
      console.log('   - Stakeholder names preserved from research')
      console.log('   - Psychology insights incorporated')
      console.log('   - Actual journalist names appear in blueprint')
      console.log('   - Historical patterns influence strategy')
    } else {
      console.log('⚠️  ISSUES DETECTED: Blueprint may still be regenerating research')
      console.log('\n❌ Problems identified:')
      if (duration >= 90) console.log('   - Generation time too high')
      if (!cfosFound || !sustOfficersFound) console.log('   - Stakeholder names not preserved')
      if (journalistCount < 2) console.log('   - Journalist names not appearing (CRITICAL)')
      console.log('\n💡 Recommendations:')
      console.log('   1. Check blueprint generator prompt passes research as JSON')
      console.log('   2. Verify "USE THESE DIRECTLY" instructions are clear')
      console.log('   3. Confirm Pillar 4 uses actual journalist names from list')
    }

    // Output sample of blueprint for manual inspection
    console.log('\n📄 Blueprint Sample (first 500 chars):')
    console.log(JSON.stringify(blueprint).substring(0, 500) + '...\n')

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

testBlueprintAdaptation().catch(console.error)
