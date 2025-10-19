const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkSchema() {
  // Query information_schema to get the check constraint
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conname = 'campaign_blueprints_status_check'
    `
  });

  if (error) {
    console.error('Error querying constraint:', error);

    // Try getting column info instead
    const { data: columnData, error: colError } = await supabase
      .from('campaign_blueprints')
      .select('*')
      .limit(1);

    console.log('\nSample row:', columnData);
    console.log('Column error:', colError);
  } else {
    console.log('Constraint definition:', data);
  }
}

checkSchema();
