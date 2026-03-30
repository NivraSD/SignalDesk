const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLatestBlueprint() {
  // Get the latest session with a blueprint
  const { data: sessions, error } = await supabase
    .from('campaign_builder_sessions')
    .select('id, blueprint, part3_stakeholderorchestration, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('❌ No sessions found');
    return;
  }

  const session = sessions[0];
  console.log('📋 Latest session:', session.id);
  console.log('⏰ Created:', session.created_at);

  if (!session.blueprint) {
    console.log('❌ No blueprint in session');
    return;
  }

  const blueprint = session.blueprint;
  console.log('\n✅ Blueprint exists!');
  console.log('📊 Blueprint top-level keys:', Object.keys(blueprint));

  // Check overview
  if (blueprint.overview) {
    console.log('\n📖 Overview:', {
      hasCampaignName: !!blueprint.overview.campaignName,
      hasPattern: !!blueprint.overview.pattern,
      keys: Object.keys(blueprint.overview)
    });
  } else {
    console.log('\n❌ No overview');
  }

  // Check part1
  if (blueprint.part1_goalFramework) {
    console.log('\n🎯 Part 1 Goal Framework:', {
      keys: Object.keys(blueprint.part1_goalFramework),
      hasObjective: !!blueprint.part1_goalFramework.primaryObjective
    });
  } else {
    console.log('\n❌ No part1_goalFramework');
  }

  // Check part2
  if (blueprint.part2_stakeholderMapping) {
    console.log('\n👥 Part 2 Stakeholder Mapping:', {
      keys: Object.keys(blueprint.part2_stakeholderMapping),
      stakeholdersCount: blueprint.part2_stakeholderMapping.prioritizedStakeholders?.length || 0
    });
  } else {
    console.log('\n❌ No part2_stakeholderMapping');
  }

  // Check part3 - orchestration
  if (blueprint.part3_stakeholderOrchestration) {
    console.log('\n🎼 Part 3 Stakeholder Orchestration:', {
      keys: Object.keys(blueprint.part3_stakeholderOrchestration),
      plansCount: blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans?.length || 0
    });

    if (blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans) {
      const plans = blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans;
      console.log('\n   📌 Orchestration plans:');
      plans.forEach((plan, i) => {
        console.log(`   ${i + 1}. ${plan.stakeholder?.name || 'Unknown'}: ${plan.influenceLevers?.length || 0} levers`);
      });
    }
  } else {
    console.log('\n❌ No part3_stakeholderOrchestration');
  }

  // Check part5 - execution
  if (blueprint.part5_executionRequirements) {
    console.log('\n⚙️ Part 5 Execution Requirements:', {
      keys: Object.keys(blueprint.part5_executionRequirements)
    });
  } else {
    console.log('\n❌ No part5_executionRequirements');
  }

  // Check metadata
  if (blueprint.metadata) {
    console.log('\n📊 Metadata:', {
      version: blueprint.metadata.version,
      generatedAt: blueprint.metadata.generatedAt,
      generatorsUsed: blueprint.metadata.generatorsUsed
    });
  }

  // Save full blueprint to file for inspection
  const fs = require('fs');
  fs.writeFileSync(
    '/Users/jonathanliebowitz/Desktop/signaldesk-v3/latest-blueprint.json',
    JSON.stringify(blueprint, null, 2)
  );
  console.log('\n💾 Full blueprint saved to latest-blueprint.json');
}

checkLatestBlueprint();
