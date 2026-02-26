const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('Checking content_library table structure...\n');

  // Try a simple select to see what happens
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error);
    console.log('\nTrying different column names...');

    // Try with different column names
    const attempts = [
      { columns: 'id, title, type, status', label: 'Basic columns' },
      { columns: 'id, title', label: 'Just ID and title' },
      { columns: '*', label: 'All columns' }
    ];

    for (const attempt of attempts) {
      console.log(`\nTrying: ${attempt.label} (${attempt.columns})`);
      const { data: attemptData, error: attemptError } = await supabase
        .from('content_library')
        .select(attempt.columns)
        .limit(1);

      if (!attemptError) {
        console.log('✅ Success! Columns found:', Object.keys(attemptData?.[0] || {}));
        console.log('Data:', attemptData);
        break;
      } else {
        console.log('❌ Failed:', attemptError.message);
      }
    }
  } else {
    console.log('✅ Table exists with columns:', Object.keys(data?.[0] || {}));
    console.log('Sample data:', data);
  }

  // Try inserting with minimal fields
  console.log('\n\nTesting minimal insert...');
  const minimalData = {
    id: `minimal-${Date.now()}`,
    title: 'Test',
    type: 'social-post',
    status: 'draft'
  };

  const { data: insertData, error: insertError } = await supabase
    .from('content_library')
    .insert(minimalData)
    .select();

  if (insertError) {
    console.log('❌ Minimal insert failed:', insertError);

    // Try even more minimal
    console.log('\nTrying super minimal insert (just id)...');
    const superMinimal = {
      id: `super-minimal-${Date.now()}`
    };

    const { error: superError } = await supabase
      .from('content_library')
      .insert(superMinimal);

    if (superError) {
      console.log('❌ Super minimal also failed:', superError);
    } else {
      console.log('✅ Super minimal insert worked!');
    }
  } else {
    console.log('✅ Minimal insert successful:', insertData);

    // Clean up
    await supabase
      .from('content_library')
      .delete()
      .eq('id', minimalData.id);
  }
}

checkTableStructure().catch(console.error);