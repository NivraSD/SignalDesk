const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkSchema() {
  // Get sample row to see columns
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('✅ content_library table exists');
    console.log('\nColumns:', Object.keys(data[0]));
    console.log('\nHas folder column:', 'folder' in data[0] ? 'YES' : 'NO');

    if ('folder' in data[0]) {
      console.log('Sample folder value:', data[0].folder);
    }
  } else {
    console.log('Table exists but is empty');
  }
}

checkSchema();
