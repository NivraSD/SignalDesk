const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkOrchestrationData() {
  // Get the latest session
  const { data: sessions, error } = await supabase
    .from('campaign_builder_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.log('❌ Error fetching session:', error.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('❌ No sessions found');
    return;
  }

  const session = sessions[0];
  console.log('\n✅ Latest session found:', session.id);
  console.log('\n📋 All column names in session:');
  console.log(Object.keys(session).sort());

  // Check for orchestration columns (any case variation)
  const orchestrationKeys = Object.keys(session).filter(k =>
    k.toLowerCase().includes('orchestration')
  );
  console.log('\n🎯 Orchestration-related columns found:', orchestrationKeys);

  // Check each orchestration key
  orchestrationKeys.forEach(key => {
    console.log(`\n📊 ${key}:`, session[key] ? 'HAS DATA' : 'null/empty');
    if (session[key]) {
      console.log('   Type:', typeof session[key]);
      if (typeof session[key] === 'object') {
        console.log('   Keys:', Object.keys(session[key]));
      }
    }
  });

  // Specifically check for our target column
  console.log('\n🔍 Checking part3_stakeholderorchestration specifically:');
  console.log('   Exists:', 'part3_stakeholderorchestration' in session);
  console.log('   Value:', session.part3_stakeholderorchestration);

  if (session.part3_stakeholderorchestration) {
    console.log('   Has stakeholderOrchestrationPlans:',
      !!session.part3_stakeholderorchestration.stakeholderOrchestrationPlans);

    if (session.part3_stakeholderorchestration.stakeholderOrchestrationPlans) {
      console.log('   Plans count:',
        session.part3_stakeholderorchestration.stakeholderOrchestrationPlans.length);
    }
  }
}

checkOrchestrationData();
