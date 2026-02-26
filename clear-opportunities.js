const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllOpportunities() {
  console.log('🗑️ Clearing ALL opportunities from database...\n');
  
  // Get count before deletion
  const { count: beforeCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Found ${beforeCount || 0} opportunities to delete`);
  
  // Delete ALL opportunities
  const { error, count } = await supabase
    .from('opportunities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all (dummy condition)
    
  if (error) {
    console.error('❌ Error deleting opportunities:', error);
    return;
  }
  
  console.log(`✅ Deleted ${count || 0} opportunities`);
  
  // Verify deletion
  const { count: afterCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });
    
  if (afterCount === 0) {
    console.log('✅ Database is now empty - all opportunities cleared!');
  } else {
    console.log(`⚠️ Still ${afterCount} opportunities remaining`);
  }
}

clearAllOpportunities().catch(console.error);