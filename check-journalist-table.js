const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  console.log('🔍 Checking if journalist_registry table exists...\n');

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('journalist_registry')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Table does NOT exist or has permission issues:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      console.error('\n📝 Next steps:');
      console.error('   1. Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new');
      console.error('   2. Run: node setup-journalist-table.js');
      console.error('   3. Copy the SQL output');
      console.error('   4. Paste and run it in the SQL Editor');
    } else {
      console.log('✅ Table exists!');
      console.log('   Current row count:', data?.length || 0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkTable();
