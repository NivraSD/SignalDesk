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
    // First check if column exists
    const { data: columns, error: checkError } = await supabase
      .rpc('get_table_columns', {
        table_name: 'niv_strategies',
        schema_name: 'public'
      });

    if (checkError) {
      console.log('Could not check columns, trying to add anyway...');
    } else if (columns) {
      const hasColumn = columns.some(col => col.column_name === 'framework_data');
      if (hasColumn) {
        console.log('✅ framework_data column already exists');
        return;
      }
    }

    // Try to add the column
    const { error } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE niv_strategies ADD COLUMN IF NOT EXISTS framework_data JSONB DEFAULT '{}'::jsonb;"
    });

    if (error) {
      console.error('Error adding column:', error);
      // Try a direct approach
      console.log('Trying direct SQL approach...');

      // This will fail gracefully if column exists
      const { error: error2 } = await supabase
        .from('niv_strategies')
        .select('framework_data')
        .limit(1);

      if (!error2) {
        console.log('✅ framework_data column exists or was created');
      } else {
        console.log('⚠️ Could not verify framework_data column');
      }
    } else {
      console.log('✅ framework_data column added successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addFrameworkDataColumn();