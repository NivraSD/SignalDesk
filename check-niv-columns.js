const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('Checking niv_strategies table columns...\n');

  // Try to get one row with all columns
  const { data, error } = await supabase
    .from('niv_strategies')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Available columns:', Object.keys(data[0]));
    console.log('\nSample data structure:');
    Object.entries(data[0]).forEach(([key, value]) => {
      const valuePreview = typeof value === 'object' ?
        JSON.stringify(value).substring(0, 100) + '...' :
        String(value).substring(0, 100);
      console.log(`  ${key}: ${valuePreview}`);
    });
  } else {
    console.log('No data found in table');
  }
}

checkColumns().catch(console.error);