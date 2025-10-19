require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key like the frontend
);

(async () => {
  console.log('🧪 Testing crisis event creation with anon key...\n');

  const newCrisis = {
    organization_id: 'OpenAI',
    crisis_type: 'test_scenario',
    severity: 'medium',
    status: 'active',
    title: 'Test Crisis Event',
    description: 'Testing crisis activation',
    started_at: new Date().toISOString(),
    trigger_source: 'manual',
    timeline: [],
    decisions: [],
    communications: [],
    ai_interactions: [],
    team_status: {},
    tasks: [],
    social_signals: [],
    media_coverage: [],
    stakeholder_sentiment: {},
    metadata: {}
  };

  console.log('Attempting to insert:', JSON.stringify(newCrisis, null, 2));

  const { data, error } = await supabase
    .from('crisis_events')
    .insert(newCrisis)
    .select()
    .single();

  console.log('\n📊 Result:');
  console.log('Error:', error);
  console.log('Data:', data);

  if (error) {
    console.log('\n❌ Error details:');
    console.log('Message:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
    console.log('Code:', error.code);
  } else {
    console.log('\n✅ Success! Crisis event created:', data.id);

    // Clean up
    await supabase.from('crisis_events').delete().eq('id', data.id);
    console.log('✅ Test event cleaned up');
  }
})();
