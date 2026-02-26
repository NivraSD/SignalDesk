const fetch = require('node-fetch')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function checkContent() {
  console.log('📝 Calling content generation with REAL strategic context...\n')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({
      message: 'Generate coordinated awareness phase campaign',
      organizationContext: {
        organizationId: 'OpenAI',
        organizationName: 'OpenAI',
        industry: 'Technology'
      },
      stage: 'campaign_generation',
      campaignContext: {
        blueprintId: 'test-blueprint-123',
        campaignType: 'VECTOR_CAMPAIGN',
        campaignFolder: 'campaigns/test-sora2-launch',
        phase: 'awareness',
        phaseNumber: 1,
        objective: 'Build credibility among technical decision-makers as the leader in video AI',
        narrative: 'Sora 2 represents a fundamental breakthrough in AI video generation, delivering production-quality results that were previously impossible. This positions OpenAI as the clear technical leader in multimodal AI.',
        targetStakeholders: ['Tech Media', 'AI Researchers', 'Enterprise CTOs'],
        positioning: 'Technical Pioneer & Industry Leader',
        keyMessages: [
          'Revolutionary video quality that surpasses all competitors',
          'Unprecedented control over video generation parameters',
          'Built on cutting-edge diffusion architecture',
          'Production-ready for enterprise applications',
          'Democratizing access to professional video creation'
        ],
        researchInsights: [
          'Enterprise demand for AI video tools grew 300% in 2024',
          'Technical audiences value architectural transparency',
          'Competitors like Runway and Pika lag 6-12 months behind',
          'Media coverage focuses heavily on "magic" vs technical depth'
        ],
        timeline: 'Week 1-3',
        currentDate: '2025-10-16',
        contentRequirements: {
          owned: [
            {
              type: 'blog-post',
              stakeholder: 'Tech Media',
              purpose: 'Establish OpenAI as the definitive technical leader in AI video generation with deep architectural insights',
              keyPoints: [
                'Advanced diffusion model architecture',
                'Temporal coherence breakthrough',
                'Production-grade output quality',
                'API integration for developers'
              ]
            }
          ],
          media: [
            {
              type: 'media-pitch',
              journalists: ['Kyle Wiggers (TechCrunch)', 'Will Knight (Wired)'],
              story: 'OpenAI announces Sora 2 - the first production-ready AI video generator',
              positioning: 'Technical breakthrough story with exclusive architectural details'
            }
          ]
        }
      }
    })
  })

  const data = await response.json()

  if (data.success && data.generatedContent) {
    console.log('✅ Generated', data.generatedContent.length, 'pieces\n')

    data.generatedContent.forEach((piece, idx) => {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`PIECE ${idx + 1}: ${piece.type} for ${piece.stakeholder || piece.journalists?.join(', ')}`)
      console.log(`${'='.repeat(80)}\n`)
      console.log(piece.content)
      console.log(`\n${'-'.repeat(80)}\n`)

      // Check for strategic elements
      const hasNarrative = piece.content.includes('fundamental breakthrough') || piece.content.includes('clear technical leader')
      const hasKeyMessages = piece.content.includes('revolutionary') || piece.content.includes('unprecedented control')
      const hasResearch = piece.content.includes('300%') || piece.content.includes('enterprise')
      const hasPositioning = piece.content.includes('technical leader') || piece.content.includes('pioneer')

      console.log('📊 STRATEGIC ALIGNMENT CHECK:')
      console.log(`  ✓ Narrative integrated: ${hasNarrative ? '✅ YES' : '❌ NO'}`)
      console.log(`  ✓ Key messages: ${hasKeyMessages ? '✅ YES' : '❌ NO'}`)
      console.log(`  ✓ Research insights: ${hasResearch ? '✅ YES' : '❌ NO'}`)
      console.log(`  ✓ Positioning: ${hasPositioning ? '✅ YES' : '❌ NO'}`)
    })
  } else {
    console.error('❌ Generation failed:', data)
  }
}

checkContent()
