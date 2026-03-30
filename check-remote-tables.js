const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log('🔍 Checking remote Supabase tables...\n');

  // Check for predictions-related tables
  console.log('📊 Checking prediction tables:');
  try {
    const { data, error } = await supabase
      .from('stakeholder_predictions')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ stakeholder_predictions:', error.message);
    } else {
      console.log('✅ stakeholder_predictions exists');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log('❌ stakeholder_predictions error:', e.message);
  }

  // Check crisis_events
  console.log('\n🚨 Checking crisis tables:');
  try {
    const { data, error } = await supabase
      .from('crisis_events')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ crisis_events:', error.message);
    } else {
      console.log('✅ crisis_events exists');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log('❌ crisis_events error:', e.message);
  }

  // Check opportunities
  console.log('\n🎯 Checking opportunity tables:');
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ opportunities:', error.message);
    } else {
      console.log('✅ opportunities exists');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log('❌ opportunities error:', e.message);
  }

  // Count recent records for org
  const orgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff';
  console.log(`\n📈 Recent records for org ${orgId}:`);

  try {
    const { count: oppCount } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    console.log(`   Opportunities: ${oppCount || 0}`);
  } catch (e) {
    console.log('   Opportunities: error');
  }

  try {
    const { count: crisisCount } = await supabase
      .from('crisis_events')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    console.log(`   Crisis events: ${crisisCount || 0}`);
  } catch (e) {
    console.log('   Crisis events: error');
  }

  try {
    const { count: predCount } = await supabase
      .from('stakeholder_predictions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    console.log(`   Predictions: ${predCount || 0}`);
  } catch (e) {
    console.log('   Predictions: error');
  }

  console.log('\n✅ Check complete');
}

checkTables();
