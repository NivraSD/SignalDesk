const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testGetSession() {
  // Get the latest session ID
  const { data: sessions } = await supabase
    .from('campaign_builder_sessions')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!sessions || sessions.length === 0) {
    console.log('❌ No sessions found');
    return;
  }

  const sessionId = sessions[0].id;
  console.log('Testing session:', sessionId);

  // Test what getSession returns
  const result = await supabase
    .from('campaign_builder_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  console.log('\n📊 Full result object:');
  console.log('  Has data property:', 'data' in result);
  console.log('  Has error property:', 'error' in result);
  console.log('  result.data type:', typeof result.data);

  // Test destructuring (what wizard does)
  const { data: destructuredData } = result;
  console.log('\n🔍 Destructured { data }:');
  console.log('  Type:', typeof destructuredData);
  console.log('  Has part3_stakeholderorchestration:', !!destructuredData?.part3_stakeholderorchestration);

  // Test direct return (what getSession returns)
  const directData = result.data;
  console.log('\n🎯 Direct result.data:');
  console.log('  Type:', typeof directData);
  console.log('  Has part3_stakeholderorchestration:', !!directData?.part3_stakeholderorchestration);

  // The ACTUAL issue - wizard does: const { data } = await getSession()
  // But getSession() returns data OR null, not { data, error }
  const getSessionReturn = result.data; // This is what getSession returns
  const { data: wrongDestructure } = getSessionReturn || {}; // This is what wizard tries to do
  console.log('\n❌ Wrong destructure (what wizard is doing):');
  console.log('  Type:', typeof wrongDestructure);
  console.log('  Value:', wrongDestructure);
}

testGetSession();
