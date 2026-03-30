const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addFrameworkDataColumn() {
  try {
    console.log('Adding framework_data column to niv_strategies table...');

    // First, let's check the current columns
    const { data: currentData, error: checkError } = await supabase
      .from('niv_strategies')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('Check error:', checkError);
    }

    // Try to select the framework_data column specifically
    const { data, error } = await supabase
      .from('niv_strategies')
      .select('id, framework_data')
      .limit(1);

    if (error && error.message.includes('framework_data')) {
      console.log('Column framework_data does not exist. Need to add it via SQL Editor in Supabase Dashboard.');
      console.log('\n=== MANUAL STEPS REQUIRED ===');
      console.log('1. Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql');
      console.log('2. Run this SQL command:');
      console.log(`
ALTER TABLE niv_strategies
ADD COLUMN IF NOT EXISTS framework_data JSONB DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN niv_strategies.framework_data IS 'Complete NIV framework including proof_points, content_needs, media_targets, timeline_execution';
      `);
      console.log('\n3. After running the SQL, redeploy the edge functions');
    } else if (!error) {
      console.log('✅ Column framework_data already exists or was added successfully');
    } else {
      console.log('Unexpected error:', error);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addFrameworkDataColumn();