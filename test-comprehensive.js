const fetch = require('node-fetch');

async function testComprehensive() {
  const testData = {
    organization_id: '1',
    organization_name: 'TestCorp',
    enriched_data: {
      organized_intelligence: {
        events: [
          { 
            type: 'competitive', 
            description: 'Competitor ABC Corp announces major product launch', 
            validated: true,
            entity: 'ABC Corp'
          },
          {
            type: 'crisis',
            description: 'Rival company XYZ faces data breach affecting 1M users',
            validated: true,
            entity: 'XYZ'
          },
          {
            type: 'workforce',
            description: 'TechGiant announces layoffs of 500 engineers',
            validated: true,
            entity: 'TechGiant'
          }
        ],
        entities: [
          { name: 'ABC Corp', type: 'company', total_mentions: 10 },
          { name: 'XYZ', type: 'company', total_mentions: 8 },
          { name: 'TechGiant', type: 'company', total_mentions: 5 }
        ],
        topic_clusters: [
          { theme: 'AI regulation', article_count: 5 },
          { theme: 'Data privacy', article_count: 7 }
        ]
      },
      extracted_data: {
        events: [
          { type: 'competitive', description: 'Competitor launch', validated: true }
        ]
      }
    },
    profile: {
      strengths: ['Innovation', 'Security', 'Customer service'],
      competition: {
        direct_competitors: ['ABC Corp', 'XYZ', 'TechGiant']
      }
    }
  };

  console.log('Testing with comprehensive data...');
  
  const response = await fetch(
    'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-opportunity-detector',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
      },
      body: JSON.stringify(testData)
    }
  );

  const result = await response.json();
  console.log('Response:', {
    success: result.success,
    opportunities: result.opportunities?.length,
    error: result.error
  });

  if (result.opportunities && result.opportunities.length > 0) {
    console.log('\nOpportunities found:');
    result.opportunities.forEach(opp => {
      console.log(`- ${opp.title} (Score: ${opp.score}, Category: ${opp.category})`);
    });
  }

  // Check database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://zskaxjtyuaqazydouifp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
  );
  
  const { data } = await supabase
    .from('opportunities')
    .select('id, title, score')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\nIn database:', data?.length || 0, 'opportunities');
  if (data && data.length > 0) {
    console.log('Latest:', data[0].title);
  }
}

testComprehensive().catch(console.error);
