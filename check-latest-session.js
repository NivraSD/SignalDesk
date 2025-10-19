const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLatestSession() {
  const { data: sessions, error } = await supabase
    .from('campaign_builder_sessions')
    .select('id, campaign_goal, part3_stakeholderorchestration, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('📋 Latest 3 sessions:\n');
  sessions.forEach((s, i) => {
    console.log(`${i + 1}. ID: ${s.id}`);
    console.log(`   Goal: ${s.campaign_goal}`);
    console.log(`   Created: ${s.created_at}`);
    console.log(`   Has orchestration: ${!!s.part3_stakeholderorchestration}`);
    if (s.part3_stakeholderorchestration) {
      console.log(`   Plans: ${s.part3_stakeholderorchestration.stakeholderOrchestrationPlans?.length || 0}`);
    }
    console.log('');
  });
}

checkLatestSession();
