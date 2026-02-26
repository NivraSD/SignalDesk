const fetch = require('node-fetch');

async function testDetectorStorage() {
  const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';
  
  // Simple test data
  const testData = {
    organization_id: '1',
    organization_name: 'TestCorp',
    enriched_data: {
      organized_intelligence: {
        events: [
          { type: 'competitive', description: 'Competitor launches new product', validated: true }
        ],
        entities: [
          { name: 'CompetitorX', type: 'company', total_mentions: 5 }
        ],
        topic_clusters: []
      }
    }
  };

  console.log('Testing detector directly...');
  
  const response = await fetch(
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

  const result = await response.json();
  console.log('Detector response:', {
    success: result.success,
    opportunities: result.opportunities?.length,
    firstOpp: result.opportunities?.[0]?.title
  });

  // Now check if they were stored
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('\nOpportunities in database:');
  console.log('Count:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('Latest:', data[0].title);
  }
  
  if (error) {
    console.error('Database error:', error);
  }
}

testDetectorStorage().catch(console.error);
