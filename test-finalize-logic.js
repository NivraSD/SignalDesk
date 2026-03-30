const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFinalizeLogic() {
  const sessionId = '835eb70a-c712-441b-99ef-46675c7145fc';

  // Get orchestration from database (what finalizer does)
  const { data: sessionData } = await supabase
    .from('campaign_builder_sessions')
    .select('part3_stakeholderorchestration')
    .eq('id', sessionId)
    .single();

  console.log('📊 Session data fetched:');
  console.log('  Has part3_stakeholderorchestration:', !!sessionData?.part3_stakeholderorchestration);

  if (sessionData?.part3_stakeholderorchestration) {
    const orch = sessionData.part3_stakeholderorchestration;
    console.log('\n✅ Orchestration data structure:');
    console.log('  Top-level keys:', Object.keys(orch));
    console.log('  Has stakeholderOrchestrationPlans:', !!orch.stakeholderOrchestrationPlans);

    if (orch.stakeholderOrchestrationPlans) {
      console.log('  Plans count:', orch.stakeholderOrchestrationPlans.length);
      console.log('\n  📋 First plan sample:');
      const plan = orch.stakeholderOrchestrationPlans[0];
      console.log('    Stakeholder:', plan.stakeholder?.name || 'Unknown');
      console.log('    Levers count:', plan.influenceLevers?.length || 0);

      if (plan.influenceLevers && plan.influenceLevers.length > 0) {
        console.log('\n    🎯 First lever sample:');
        const lever = plan.influenceLevers[0];
        console.log('      Lever keys:', Object.keys(lever));
        console.log('      Has campaign:', !!lever.campaign);

        if (lever.campaign) {
          console.log('      Campaign keys:', Object.keys(lever.campaign));
          console.log('      Media pitches:', lever.campaign.mediaPitches?.length || 0);
          console.log('      Social posts:', lever.campaign.socialPosts?.length || 0);
          console.log('      Thought leadership:', lever.campaign.thoughtLeadership?.length || 0);
        }
      }
    }

    // This is what finalizer creates:
    const orchestrationStrategy = {
      part3_stakeholderOrchestration: orch,
      metadata: {
        totalStakeholders: orch.stakeholderOrchestrationPlans?.length || 0,
        totalLevers: orch.stakeholderOrchestrationPlans?.reduce((sum, p) =>
          sum + (p.influenceLevers?.length || 0), 0) || 0,
        totalTactics: orch.stakeholderOrchestrationPlans?.reduce((sum, plan) => {
          return sum + (plan.influenceLevers || []).reduce((leverSum, lever) => {
            const campaign = lever.campaign || {}
            return leverSum +
              (campaign.mediaPitches?.length || 0) +
              (campaign.socialPosts?.length || 0) +
              (campaign.thoughtLeadership?.length || 0) +
              (campaign.additionalTactics?.length || 0)
          }, 0)
        }, 0) || 0
      }
    };

    console.log('\n📦 Orchestration strategy metadata:');
    console.log('  Total stakeholders:', orchestrationStrategy.metadata.totalStakeholders);
    console.log('  Total levers:', orchestrationStrategy.metadata.totalLevers);
    console.log('  Total tactics:', orchestrationStrategy.metadata.totalTactics);
  } else {
    console.log('\n❌ No orchestration data found');
  }
}

testFinalizeLogic();
