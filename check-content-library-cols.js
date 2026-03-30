require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Try to get one row to see the schema
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Table exists');
    console.log('Sample row:', data[0] || 'No rows yet');
    if (data[0]) {
      console.log('Columns:', Object.keys(data[0]));
    }
  }

  // Try to insert a test record to see what's missing
  const testRecord = {
    id: 'test-' + Date.now(),
    organization_id: 'test',
    title: 'Test',
    type: 'test',
    content: 'test content',
    tags: ['test'],
    metadata: { test: true }
  };

  console.log('\nTrying to insert test record...');
  const { error: insertError } = await supabase
    .from('content_library')
    .insert(testRecord);

  if (insertError) {
    console.log('❌ Insert error:', insertError);
  } else {
    console.log('✅ Insert successful');
    // Clean up
    await supabase.from('content_library').delete().eq('id', testRecord.id);
  }
})();
