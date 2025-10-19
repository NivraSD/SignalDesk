const fetch = require('node-fetch');

async function testDetector() {
  const response = await fetch(
    'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-opportunity-detector',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
      },
      body: JSON.stringify({
        organization_id: '1',
        organization_name: 'TestCorp',
        enriched_data: {
          organized_intelligence: {
            events: [{ type: 'competitive', description: 'test', validated: true }]
          }
        }
      })
    }
  );
  
  const text = await response.text();
  console.log('Response status:', response.status);
  console.log('Response body:', text);
}

testDetector();
