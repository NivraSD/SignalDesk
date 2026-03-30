const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixTable() {
  console.log('Fixing content_library table...\n');

  // Execute raw SQL
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE content_library
      ALTER COLUMN organization_id TYPE VARCHAR(255)
      USING organization_id::VARCHAR(255);
    `
  }).catch(err => {
    // If RPC doesn't exist, try direct update
    return { error: err };
  });

  if (error) {
    console.log('Note: Direct SQL execution not available via SDK.');
    console.log('\n⚠️ Please run this SQL in Supabase SQL editor:');
    console.log(`
ALTER TABLE content_library
ALTER COLUMN organization_id TYPE VARCHAR(255)
USING organization_id::VARCHAR(255);
    `);
    console.log('\nGo to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new');
  } else {
    console.log('✅ Table fixed successfully!');
  }
}

fixTable();