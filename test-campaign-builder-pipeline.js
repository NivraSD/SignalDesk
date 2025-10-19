const SUPABASE_URL = "https://zskaxjtyuaqazydouifp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

async function testCampaignBuilderPipeline() {
  console.log('🧪 Testing Campaign Builder Research Pipeline\n');

  const testPayload = {
    orgId: 'test-org',
    message: 'Launch campaign for Tesla Cybertruck targeting tech enthusiasts and early adopters',
    organizationContext: {
      name: 'Tesla',
      industry: 'Automotive/Electric Vehicles'
    }
  };

  console.log('📤 Sending request to orchestrator...');
  console.log('Campaign Goal:', testPayload.message);
  console.log('Organization:', testPayload.organizationContext.name);
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/niv-campaign-builder-orchestrator`,
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
      console.error('❌ Orchestrator request failed:', response.status);
      console.error('Error:', errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ SUCCESS!');
    console.log('');
    console.log('📊 Pipeline Results:');
    console.log('-------------------');
    console.log('Service:', result.service || 'Unknown');
    console.log('Stage:', result.stage || 'Unknown');
    console.log('');

    if (result.researchPlan) {
      console.log('📋 Research Plan Created:');
      console.log('  - Stakeholder queries:', result.researchPlan.stakeholderResearch?.queries?.length || 0);
      console.log('  - Narrative queries:', result.researchPlan.narrativeResearch?.queries?.length || 0);
      console.log('  - Channel queries:', result.researchPlan.channelResearch?.queries?.length || 0);
      console.log('  - Historical queries:', result.researchPlan.historicalResearch?.queries?.length || 0);
      console.log('');
    }

    if (result.gatheredData) {
      console.log('🔍 Data Gathered:');
      console.log('  - Tool calls made:', result.toolCallsMade || 'Unknown');
      console.log('  - Stakeholder results:', result.gatheredData.stakeholder?.length || 0);
      console.log('  - Narrative results:', result.gatheredData.narrative?.length || 0);
      console.log('  - Channel results:', result.gatheredData.channel?.length || 0);
      console.log('  - Historical results:', result.gatheredData.historical?.length || 0);
      console.log('');
    }

    if (result.compiledResearch) {
      console.log('🔧 Data Compiled:');
      console.log('  - Total data points:', result.compiledResearch.metadata?.totalDataPoints || 0);
      console.log('');
    }

    if (result.campaignIntelligenceBrief) {
      console.log('🎯 Intelligence Brief Synthesized:');
      console.log('  - Stakeholder profiles:', result.campaignIntelligenceBrief.stakeholders?.length || 0);
      console.log('  - Dominant narratives:', result.campaignIntelligenceBrief.narrativeLandscape?.dominantNarratives?.length || 0);
      console.log('  - Narrative vacuums:', result.campaignIntelligenceBrief.narrativeLandscape?.narrativeVacuums?.length || 0);
      console.log('  - Journalists:', result.campaignIntelligenceBrief.channelIntelligence?.journalists?.length || 0);
      console.log('  - Key insights:', result.campaignIntelligenceBrief.keyInsights?.length || 0);
      console.log('  - Synthesis quality:');
      console.log('    - Completeness:', result.campaignIntelligenceBrief.synthesisQuality?.completeness || 'N/A');
      console.log('    - Confidence:', result.campaignIntelligenceBrief.synthesisQuality?.confidence || 'N/A');
      console.log('');
    }

    console.log('⏱️  Total Pipeline Time:', elapsedTime, 'ms');
    console.log('');

    // Save full result to file for inspection
    const fs = require('fs');
    fs.writeFileSync(
      './campaign-builder-test-result.json',
      JSON.stringify(result, null, 2)
    );
    console.log('💾 Full result saved to campaign-builder-test-result.json');

  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    console.error('❌ Error testing pipeline:', error.message);
    console.error('Time before error:', elapsedTime, 'ms');
  }
}

testCampaignBuilderPipeline();
