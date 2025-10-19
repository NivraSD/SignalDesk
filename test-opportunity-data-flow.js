// Lightweight test - just check data structure, no full pipeline run
const fetch = require('node-fetch');

async function testDataFlow() {
  console.log('📊 Testing Opportunity Data Flow (Lightweight)\n');
  
  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';
  
  // Mock enriched data structure that monitoring-stage-2-enrichment produces
  const mockEnrichedData = {
    extracted_data: {
      events: [
        { type: 'competitive', description: 'Competitor launches new product', validated: true },
        { type: 'crisis', description: 'Major data breach at rival company', validated: true }
      ],
      entities: [
        { name: 'CompetitorX', type: 'company', total_mentions: 5 },
        { name: 'RivalCorp', type: 'company', total_mentions: 3 }
      ],
      quotes: [],
      metrics: []
    },
    organized_intelligence: {
      events: [
        { type: 'competitive', description: 'Competitor launches new product', validated: true },
        { type: 'crisis', description: 'Major data breach at rival company', validated: true }
      ],
      entities: [
        { name: 'CompetitorX', type: 'company', total_mentions: 5 },
        { name: 'RivalCorp', type: 'company', total_mentions: 3 }
      ],
      topic_clusters: [
        { theme: 'Product Launch', article_count: 3 },
        { theme: 'Security Breach', article_count: 5 }
      ]
    },
    structured_data: {
      events_by_type: {
        competitive: 1,
        crisis: 1
      }
    }
  };

  try {
    // Test ONLY the opportunity detector with mock data
    console.log('🔍 Testing MCP-Opportunity-Detector with mock enriched data...\n');
    
    const detectorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organization_id: '1',
          organization_name: 'TestCorp',
          enriched_data: mockEnrichedData,
          profile: {
            strengths: ['Security', 'Innovation'],
            competition: {
              direct_competitors: ['CompetitorX', 'RivalCorp']
            }
          }
        })
      }
    );

    if (!detectorResponse.ok) {
      const error = await detectorResponse.text();
      console.error('❌ Detector failed:', error);
      return;
    }

    const result = await detectorResponse.json();
    console.log('✅ Detector Response:');
    console.log('   Total opportunities found:', result.opportunities?.length || 0);
    
    if (result.opportunities && result.opportunities.length > 0) {
      console.log('\n📋 Sample Opportunities:');
      result.opportunities.slice(0, 3).forEach((opp, i) => {
        console.log(`\n   ${i+1}. ${opp.title}`);
        console.log(`      Category: ${opp.category}`);
        console.log(`      Score: ${opp.score}`);
        console.log(`      Urgency: ${opp.urgency}`);
        console.log(`      Pattern: ${opp.pattern_matched}`);
      });
    }

    // Check the summary
    if (result.summary) {
      console.log('\n📊 Detection Summary:');
      console.log('   By category:', JSON.stringify(result.summary.by_category));
      console.log('   Average score:', result.summary.average_score);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDataFlow();
