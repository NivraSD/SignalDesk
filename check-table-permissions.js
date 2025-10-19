require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking table permissions and RLS status...\n');

  // Check if RLS is enabled and what policies exist
  const { data: rlsCheck, error: rlsError } = await supabaseService
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'crisis_events');

  console.log('Table check:', rlsCheck, rlsError);

  // Check policies
  const { data: policies, error: policiesError } = await supabaseService.rpc('exec_sql', {
    sql: `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE tablename IN ('crisis_events', 'crisis_communications')
      ORDER BY tablename, cmd;
    `
  });

  if (policiesError) {
    console.log('❌ Could not check policies via RPC:', policiesError.message);
    console.log('\nTrying direct query...');

    // Try using service role to query pg_catalog
    const { data: tableInfo, error: tableError } = await supabaseService
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'crisis_events');

    console.log('Table info:', tableInfo);
  } else {
    console.log('Policies found:', policies);
  }

  // Try insert with service role (should bypass RLS)
  console.log('\n🧪 Testing insert with SERVICE ROLE...\n');

  const testCrisis = {
    organization_id: 'OpenAI',
    crisis_type: 'test',
    severity: 'low',
    status: 'monitoring',
    title: 'Service Role Test',
    started_at: new Date().toISOString()
  };

  const { data: serviceData, error: serviceError } = await supabaseService
    .from('crisis_events')
    .insert(testCrisis)
    .select()
    .single();

  if (serviceError) {
    console.log('❌ Service role insert failed:', serviceError);
  } else {
    console.log('✅ Service role insert succeeded:', serviceData.id);

    // Clean up
    await supabaseService.from('crisis_events').delete().eq('id', serviceData.id);
    console.log('✅ Cleaned up test record');
  }
})();
