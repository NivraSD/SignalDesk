const fetch = require('node-fetch');

async function testOpportunityPipeline() {
  console.log('🔄 Testing Opportunity Pipeline...\n');
  
  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';
  
  // Test data with events that should trigger opportunities
  const testData = {
    organization_id: '1',
    organization_name: 'TestCorp',
    enriched_data: {
      organized_intelligence: {
        events: [
          {
            type: 'competitor_crisis',
            description: 'Major competitor Rival Inc faces data breach affecting 1M users',
            entity: 'Rival Inc',
            date: new Date().toISOString()
          },
          {
            type: 'product',
            description: 'Competitor launches new AI product competing directly with us',
            entity: 'CompetitorX',
            date: new Date().toISOString()
          },
          {
            type: 'workforce',
            description: 'Industry leader announces layoffs of 500 engineers',
            entity: 'TechGiant',
            date: new Date().toISOString()
          }
        ],
        entities: [
          { name: 'Rival Inc', type: 'company', total_mentions: 5 },
          { name: 'CompetitorX', type: 'company', total_mentions: 3 },
          { name: 'TechGiant', type: 'company', total_mentions: 4 }
        ],
        topic_clusters: [
          { theme: 'AI regulation', article_count: 8 },
          { theme: 'Data privacy concerns', article_count: 5 }
        ]
      },
      extracted_data: {
        events: [
          {
            type: 'competitor_crisis',
            description: 'Major competitor Rival Inc faces data breach',
            entity: 'Rival Inc'
          }
        ]
      }
    },
    executive_synthesis: {
      competitive_dynamics: {
        urgent_pr_actions: [
          'Position as secure alternative to Rival Inc data breach'
        ]
      },
      immediate_opportunities: [
        {
          trigger: 'Rival Inc data breach',
          action: 'Launch trust & security campaign',
          window: '24-48 hours'
        }
      ]
    }
  };

  try {
    // 1. Test MCP Opportunity Detector
    console.log('1️⃣ Testing MCP Opportunity Detector...');
    const detectorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(testData)
      }
    );

    if (!detectorResponse.ok) {
      const error = await detectorResponse.text();
      console.error('❌ Detector failed:', error);
    } else {
      const detectorResult = await detectorResponse.json();
      console.log('✅ Detector found', detectorResult.opportunities?.length || 0, 'opportunities');
      if (detectorResult.opportunities?.length > 0) {
        console.log('   Sample:', detectorResult.opportunities[0].title);
      }
    }

    // 2. Test Opportunity Orchestrator
    console.log('\n2️⃣ Testing Opportunity Orchestrator...');
    const orchestratorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/opportunity-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(testData)
      }
    );

    if (!orchestratorResponse.ok) {
      const error = await orchestratorResponse.text();
      console.error('❌ Orchestrator failed:', error);
    } else {
      const orchestratorResult = await orchestratorResponse.json();
      console.log('✅ Orchestrator created', orchestratorResult.opportunities?.length || 0, 'opportunities');
      if (orchestratorResult.opportunities?.length > 0) {
        const opp = orchestratorResult.opportunities[0];
        console.log('   Sample:', opp.title);
        console.log('   Urgency:', opp.urgency);
        console.log('   Score:', opp.score);
      }
    }

    // 3. Check database
    console.log('\n3️⃣ Checking database...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data: dbOpps, error } = await supabase
      .from('opportunities')
      .select('id, title, score, urgency, created_at')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database error:', error);
    } else {
      console.log('✅ Found', dbOpps?.length || 0, 'opportunities in database from last minute');
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testOpportunityPipeline();
