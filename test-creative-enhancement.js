const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testCreativeEnhancement() {
  console.log('Testing creative enhancement flow...\n');
  
  // Call opportunity detector directly with minimal data
  const detectorResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_id: 'TestCreative',
        organization_name: 'TestCreative',
        enriched_data: {
          extracted_data: {
            events: [
              {
                type: 'product_launch',
                entity: 'TestCreative',
                description: 'Major AI product launch announcement',
                relevance: 'HIGH'
              },
              {
                type: 'competitive',
                entity: 'Competitor',
                description: 'Competitor facing security issues',
                relevance: 'HIGH'
              }
            ]
          }
        }
      })
    }
  );
  
  const detectorResult = await detectorResponse.json();
  console.log('Detector response:', {
    success: detectorResult.success,
    opportunities: detectorResult.opportunities?.length || 0
  });
  
  if (detectorResult.opportunities && detectorResult.opportunities.length > 0) {
    // Now call orchestrator-v2 to enhance them
    console.log('\nCalling orchestrator-v2 for creative enhancement...');
    
    const orchestratorResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/opportunity-orchestrator-v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
          organization_id: 'TestCreative',
          organization_name: 'TestCreative',
          detected_opportunities: detectorResult.opportunities
        })
      }
    );
    
    const orchestratorResult = await orchestratorResponse.json();
    console.log('\nOrchestrator-v2 response:', {
      success: orchestratorResult.success,
      enhanced: orchestratorResult.opportunities?.length || 0
    });
    
    if (orchestratorResult.opportunities && orchestratorResult.opportunities.length > 0) {
      console.log('\nFirst enhanced opportunity:');
      const opp = orchestratorResult.opportunities[0];
      console.log('  Title:', opp.title);
      console.log('  Campaign name:', opp.campaign_name || 'NOT FOUND');
      console.log('  Creative approach:', opp.creative_approach ? opp.creative_approach.substring(0, 100) : 'NOT FOUND');
      console.log('  Has playbook.campaign_name:', !!opp.playbook?.campaign_name);
      console.log('  Has playbook.creative_approach:', !!opp.playbook?.creative_approach);
    }
  }
}

testCreativeEnhancement().catch(console.error);
