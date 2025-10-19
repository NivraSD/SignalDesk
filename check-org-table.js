const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrganizationsTable() {
  console.log('\n=== Checking Organizations Table ===\n');

  // Check if table exists
  const { data: tables, error: tableError } = await supabase
    .from('organizations')
    .select('*')
    .limit(5);

  if (tableError) {
    console.log('❌ Organizations table error:', tableError.message);

    // Try to create the table
    console.log('\n📦 Creating organizations table...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (createError) {
      console.log('Could not create table via RPC:', createError.message);
    }
  } else {
    console.log('✅ Organizations table exists');
    console.log('📊 Current organizations:', tables?.length || 0);
    tables?.forEach(org => {
      console.log(`  - ${org.name} (${org.id})`);
    });
  }

  // Try to insert default org
  console.log('\n📝 Creating default organizations...');

  // Default org
  const { data: defaultOrg, error: defaultError } = await supabase
    .from('organizations')
    .upsert({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Default Organization'
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (defaultError) {
    console.log('Default org error:', defaultError.message);
  } else {
    console.log('✅ Default org ready:', defaultOrg.id);
  }

  // OpenAI org
  const { data: openaiOrg, error: openaiError } = await supabase
    .from('organizations')
    .upsert({
      name: 'OpenAI'
    }, {
      onConflict: 'name'
    })
    .select()
    .single();

  if (openaiError) {
    console.log('OpenAI org error:', openaiError.message);
  } else {
    console.log('✅ OpenAI org ready:', openaiOrg.id);
  }
}

checkOrganizationsTable().catch(console.error);