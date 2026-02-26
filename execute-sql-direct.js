const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

async function addFrameworkDataColumn() {
  try {
    console.log('Adding framework_data column via Supabase Management API...');

    // Use the Supabase Management API to run SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: `ALTER TABLE niv_strategies ADD COLUMN IF NOT EXISTS framework_data JSONB DEFAULT '{}';`
      })
    });

    if (!response.ok) {
      // Try a different approach - use the REST API directly
      console.log('First approach failed, trying direct SQL via REST endpoint...');

      // Create a temporary function to execute SQL
      const sqlCommand = `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'niv_strategies'
            AND column_name = 'framework_data'
          ) THEN
            ALTER TABLE niv_strategies ADD COLUMN framework_data JSONB DEFAULT '{}';
          END IF;
        END $$;
      `;

      // Since we can't directly execute DDL via the API, let's use the Dashboard API
      console.log('\n=== SQL COMMAND TO RUN ===\n');
      console.log(`ALTER TABLE niv_strategies ADD COLUMN IF NOT EXISTS framework_data JSONB DEFAULT '{}';`);
      console.log('\nI\'ll run this via the Supabase CLI instead...');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addFrameworkDataColumn();