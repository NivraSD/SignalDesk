const fetch = require('node-fetch');

async function testFinalizeAPI() {
  const sessionId = '835eb70a-c712-441b-99ef-46675c7145fc';

  // Mock blueprint base (would come from orchestrator)
  const blueprintBase = {
    overview: {
      campaignName: "Test Campaign",
      pattern: "CASCADE"
    },
    part1_goalFramework: {
      primaryObjective: "Test objective"
    },
    part2_stakeholderMapping: {
      prioritizedStakeholders: []
    },
    messageArchitecture: {}
  };

  console.log('🚀 Calling finalize API...');

  const response = await fetch('http://localhost:3000/api/finalize-blueprint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      blueprintBase,
      organizationContext: {
        name: 'CodeX',
        industry: 'Technology'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Error:', response.status, errorText);
    return;
  }

  const result = await response.json();
  console.log('\n✅ Finalize API response:');
  console.log('Top-level keys:', Object.keys(result));

  // Check each part
  console.log('\n📊 Blueprint structure:');
  console.log('  Has overview:', !!result.overview);
  console.log('  Has part1_goalFramework:', !!result.part1_goalFramework);
  console.log('  Has part2_stakeholderMapping:', !!result.part2_stakeholderMapping);
  console.log('  Has messageArchitecture:', !!result.messageArchitecture);
  console.log('  Has part3_stakeholderOrchestration:', !!result.part3_stakeholderOrchestration);
  console.log('  Has part4_counterNarrativeStrategy:', !!result.part4_counterNarrativeStrategy);
  console.log('  Has part5_executionRequirements:', !!result.part5_executionRequirements);
  console.log('  Has part6_patternGuidance:', !!result.part6_patternGuidance);
  console.log('  Has metadata:', !!result.metadata);

  if (result.part3_stakeholderOrchestration) {
    console.log('\n🎼 Part 3 Orchestration:');
    console.log('  Keys:', Object.keys(result.part3_stakeholderOrchestration));
    console.log('  Plans:', result.part3_stakeholderOrchestration.stakeholderOrchestrationPlans?.length || 0);
  }

  if (result.part5_executionRequirements) {
    console.log('\n⚙️ Part 5 Execution:');
    console.log('  Keys:', Object.keys(result.part5_executionRequirements));
  }

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    '/Users/jonathanliebowitz/Desktop/signaldesk-v3/finalize-api-result.json',
    JSON.stringify(result, null, 2)
  );
  console.log('\n💾 Full result saved to finalize-api-result.json');
}

testFinalizeAPI().catch(console.error);
