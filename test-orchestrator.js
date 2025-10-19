const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testOrchestrator() {
  console.log('Testing Intelligence Orchestrator V2...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization_id: "tesla",
        organization_name: "Tesla",
        industry: "Electric Vehicles"
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('  Content-Type:', response.headers.get('Content-Type'));
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Orchestrator succeeded!');
      console.log('  Events found:', result.enriched_data?.extracted_data?.events?.length || 0);
      console.log('  Entities found:', result.enriched_data?.extracted_data?.entities?.length || 0);
      console.log('  Synthesis created:', !!result.executive_synthesis);
      console.log('  Opportunities found:', result.opportunities?.length || 0);
    } else {
      console.log('\n❌ Orchestrator failed:');
      console.log('  Error:', result.error);
      console.log('  Details:', result.details);
      console.log('  Message:', result.message);
      
      if (result.partial_results) {
        console.log('\nPartial results:');
        console.log('  Enriched data:', !!result.partial_results.enriched_data);
        console.log('  Synthesis:', !!result.partial_results.executive_synthesis);
        console.log('  Opportunities:', result.partial_results.opportunities?.length || 0);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOrchestrator();