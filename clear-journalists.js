const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearJournalists() {
  console.log('🗑️  Clearing all existing journalists from database...\n');

  try {
    const { error } = await supabase
      .from('journalist_registry')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('❌ Error clearing table:', error.message);
    } else {
      console.log('✅ All journalists cleared from database!');
      console.log('📝 Ready to run: node import-journalists.js');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

clearJournalists();
