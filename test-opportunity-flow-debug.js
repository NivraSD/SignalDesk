#!/usr/bin/env node
// Debug why opportunities aren't being generated

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

async function testOpportunityFlow() {
  console.log('🔍 Testing Opportunity Detection Flow\n')

  // Step 1: Check if orchestrator is calling opportunity detector
  console.log('Step 1: Simulating intelligence orchestrator call...')

  const mockEnrichedData = {
    organized_intelligence: {
      events: [
        {
          type: 'competitive',
          entity: 'Anthropic',
          description: 'Anthropic releases Claude 3.5 with improved capabilities',
          impact: 'high'
        },
        {
          type: 'milestone',
          entity: 'OpenAI',
          description: 'OpenAI announces GPT-5 delayed to 2026',
          impact: 'medium'
        }
      ],
      entities: [
        { name: 'Anthropic', type: 'competitor', mentions: 5 },
        { name: 'OpenAI', type: 'organization', mentions: 10 }
      ],
      quotes: [
        { text: 'We are committed to AI safety', source: 'OpenAI CEO' }
      ]
    },
    extracted_data: {
      events: [],
      entities: []
    },
    statistics: {
      total_events: 2,
      total_companies: 2
    }
  }

  console.log('📊 Mock enriched data:', {
    events: mockEnrichedData.organized_intelligence.events.length,
    entities: mockEnrichedData.organized_intelligence.entities.length
  })

  // Step 2: Call opportunity detector directly
  console.log('\nStep 2: Calling mcp-opportunity-detector...')

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization_id: 'OpenAI',
        organization_name: 'OpenAI',
        enriched_data: mockEnrichedData,
        profile: {
          organization_name: 'OpenAI',
          industry: 'AI/Technology',
          strengths: ['AI research', 'Product development'],
          competition: {
            direct_competitors: ['Anthropic', 'Google', 'Meta']
          }
        }
      })
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Detector failed:', error)
      return
    }

    const data = await response.json()
    console.log('\n✅ Detector response:', {
      success: data.success,
      opportunities_detected: data.opportunities?.length || 0,
      metadata: data.metadata
    })

    if (data.opportunities && data.opportunities.length > 0) {
      console.log('\n💡 Sample opportunity:', {
        title: data.opportunities[0].title,
        category: data.opportunities[0].category,
        score: data.opportunities[0].score,
        urgency: data.opportunities[0].urgency
      })
    }

    // Step 3: Check if opportunities were saved to database
    console.log('\n\nStep 3: Checking database for opportunities...')

    const dbResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/opportunities?organization_id=eq.OpenAI&order=created_at.desc&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    )

    const opportunities = await dbResponse.json()
    console.log(`Found ${opportunities.length} opportunities in database`)

    if (opportunities.length > 0) {
      console.log('\n📊 Recent opportunities:')
      opportunities.forEach(opp => {
        console.log(`  - ${opp.title}`)
        console.log(`    Created: ${opp.created_at}`)
        console.log(`    Org ID: ${opp.organization_id}`)
      })
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testOpportunityFlow()
