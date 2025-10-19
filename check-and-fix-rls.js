require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking crisis tables...\n');

  // Check if we can access crisis_events
  const { data: events, error: eventsError } = await supabase
    .from('crisis_events')
    .select('*')
    .limit(1);

  console.log('crisis_events table:');
  if (eventsError) {
    console.log('❌ Error:', eventsError.message);
    if (eventsError.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist yet. Run migration first.');
    }
  } else {
    console.log('✅ Table accessible');
    console.log('Rows:', events.length);
  }

  // Check crisis_communications
  const { data: comms, error: commsError } = await supabase
    .from('crisis_communications')
    .select('*')
    .limit(1);

  console.log('\ncrisis_communications table:');
  if (commsError) {
    console.log('❌ Error:', commsError.message);
    if (commsError.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist yet. Run migration first.');
    }
  } else {
    console.log('✅ Table accessible');
    console.log('Rows:', comms.length);
  }

  // Try to insert a test crisis event
  console.log('\n🧪 Testing crisis event creation...\n');
  const testEvent = {
    organization_id: 'test-org',
    crisis_type: 'test',
    severity: 'low',
    status: 'monitoring',
    title: 'Test Crisis Event',
    description: 'Test event to check permissions',
    started_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('crisis_events')
    .insert(testEvent)
    .select();

  if (insertError) {
    console.log('❌ Insert failed:', insertError.message);
    if (insertError.message.includes('permission denied')) {
      console.log('\n⚠️  RLS policies are not working correctly!');
      console.log('\n📋 You need to run this SQL in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql\n');
      console.log('Copy and paste the contents of add-crisis-rls.sql');
    }
  } else {
    console.log('✅ Insert successful!');
    console.log('Created event:', insertData[0]?.id);

    // Clean up test event
    if (insertData[0]?.id) {
      await supabase
        .from('crisis_events')
        .delete()
        .eq('id', insertData[0].id);
      console.log('✅ Test event cleaned up');
    }
  }
})();
