const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function clearAllOpportunities() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Clearing ALL opportunities...');

  const { data: deleted, error } = await supabase
    .from('opportunities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') 
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Deleted ' + (deleted ? deleted.length : 0) + ' opportunities');
  }
}

clearAllOpportunities().catch(console.error);
