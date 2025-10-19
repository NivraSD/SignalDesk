const SUPABASE_URL = "https://zskaxjtyuaqazydouifp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

async function testGathererOnly() {
  console.log('🧪 Testing Research Gatherer Only\n');

  // Simple research plan with just ONE query per category
  const testPayload = {
    researchPlan: {
      stakeholderResearch: {
        focus: 'Tech enthusiasts and early adopters',
        queries: ['Tesla stakeholders'],
        toolsNeeded: ['mcp_discovery']
      },
      narrativeResearch: {
        focus: 'EV market trends',
        queries: ['electric vehicle trends 2025'],
        toolsNeeded: ['niv_fireplexity']
      },
      channelResearch: {
        focus: 'Automotive tech journalists',
        queries: ['automotive'],
        toolsNeeded: ['journalist_registry']
      },
      historicalResearch: {
        focus: 'Successful EV campaigns',
        queries: ['electric vehicle marketing success'],
        toolsNeeded: ['knowledge_library_registry']
      },
      researchRationale: 'Minimal test plan'
    },
    campaignGoal: 'Launch Tesla Cybertruck campaign',
    organizationContext: {
      name: 'Tesla',
      industry: 'Automotive/Electric Vehicles'
    }
  };

  console.log('📤 Sending request to gatherer...');
  console.log('Research queries:', JSON.stringify(testPayload.researchPlan, null, 2));
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-campaign-research-gatherer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify(testPayload)
      }
    );

    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️  Response received in ${elapsedTime}ms`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gatherer request failed:', response.status);
      console.error('Error:', errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ SUCCESS!');
    console.log('');
    console.log('📊 Gathering Results:');
    console.log('-------------------');
    console.log('Tool calls made:', result.toolCallsMade);
    console.log('Gathering time:', result.gatheringTime, 'ms');
    console.log('');
    console.log('Stakeholder results:', result.gatheredData?.stakeholder?.length || 0);
    console.log('Narrative results:', result.gatheredData?.narrative?.length || 0);
    console.log('Channel results:', result.gatheredData?.channel?.length || 0);
    console.log('Historical results:', result.gatheredData?.historical?.length || 0);
    console.log('');
    console.log('Total results:', result.totalResults);

    // Save full result for inspection
    const fs = require('fs');
    fs.writeFileSync(
      './gatherer-test-result.json',
      JSON.stringify(result, null, 2)
    );
    console.log('💾 Full result saved to gatherer-test-result.json');

  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error('❌ Error testing gatherer:', error.message);
    console.error('Time before error:', elapsedTime, 'ms');
  }
}

testGathererOnly();
