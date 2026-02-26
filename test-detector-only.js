const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testDetectorOnly() {
  console.log('Testing detector response format...\n');
  
  // Call detector with minimal data
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_id: 'TestOrg',
        organization_name: 'TestOrg',
        enriched_data: {
          extracted_data: {
            events: [
              {
                type: 'product_launch',
                entity: 'TestOrg',
                description: 'TestOrg launches new AI product',
                relevance: 'HIGH'
              }
            ]
          }
        }
      })
    }
  );
  
  if (!response.ok) {
    console.error('❌ Failed:', response.status);
    return;
  }
  
  const result = await response.json();
  console.log('✅ Detector response structure:');
  console.log('  Top-level keys:', Object.keys(result));
  console.log('  success:', result.success);
  console.log('  has opportunities:', !!result.opportunities);
  console.log('  opportunities count:', result.opportunities?.length || 0);
  
  if (result.opportunities && result.opportunities.length > 0) {
    console.log('\n  First opportunity keys:', Object.keys(result.opportunities[0]));
  }
  
  // This is what orchestrator-v2 checks:
  console.log('\n🔍 What orchestrator checks:');
  console.log('  detectorResponse.opportunities exists:', !!result.opportunities);
  console.log('  detectorResponse.opportunities.length > 0:', (result.opportunities?.length || 0) > 0);
}

testDetectorOnly().catch(console.error);
