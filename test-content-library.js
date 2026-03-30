const { createClient } = require('@supabase/supabase-js');

// Use environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContentLibrary() {
  console.log('\n📚 Testing content_library table...\n');

  // 1. Test INSERT
  console.log('1️⃣ Testing INSERT...');
  const testContent = {
    id: `test-${Date.now()}`,
    title: 'Test Happy Birthday Post',
    type: 'social-post',
    content: '🎉 Happy Birthday to our amazing CEO! Your leadership and vision continue to inspire us all. Here\'s to another year of success! 🎂',
    status: 'draft',
    priority: 'high',
    metadata: {
      created_by: 'test-script',
      timestamp: new Date().toISOString()
    }
  };

  const { data: insertData, error: insertError } = await supabase
    .from('content_library')
    .insert(testContent)
    .select();

  if (insertError) {
    console.error('❌ INSERT failed:', insertError);
    return;
  }
  console.log('✅ INSERT successful:', insertData?.[0]?.id);

  // 2. Test SELECT
  console.log('\n2️⃣ Testing SELECT...');
  const { data: selectData, error: selectError } = await supabase
    .from('content_library')
    .select('*')
    .eq('id', testContent.id);

  if (selectError) {
    console.error('❌ SELECT failed:', selectError);
  } else {
    console.log('✅ SELECT successful. Found:', selectData?.length, 'items');
  }

  // 3. Test UPDATE
  console.log('\n3️⃣ Testing UPDATE...');
  const { error: updateError } = await supabase
    .from('content_library')
    .update({ status: 'published' })
    .eq('id', testContent.id);

  if (updateError) {
    console.error('❌ UPDATE failed:', updateError);
  } else {
    console.log('✅ UPDATE successful');
  }

  // 4. List all content
  console.log('\n4️⃣ Listing all content...');
  const { data: allContent, error: listError } = await supabase
    .from('content_library')
    .select('id, title, type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (listError) {
    console.error('❌ LIST failed:', listError);
  } else {
    console.log('✅ Found', allContent?.length, 'content items:');
    allContent?.forEach(item => {
      console.log(`   • ${item.type}: "${item.title}" (${item.status})`);
    });
  }

  // 5. Clean up test data
  console.log('\n5️⃣ Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('content_library')
    .delete()
    .eq('id', testContent.id);

  if (deleteError) {
    console.error('❌ DELETE failed:', deleteError);
  } else {
    console.log('✅ Test data cleaned up');
  }

  console.log('\n🎉 All tests completed!');
  console.log('\n📝 Summary:');
  console.log('   • Table exists: ✅');
  console.log('   • Can INSERT: ' + (!insertError ? '✅' : '❌'));
  console.log('   • Can SELECT: ' + (!selectError ? '✅' : '❌'));
  console.log('   • Can UPDATE: ' + (!updateError ? '✅' : '❌'));
  console.log('   • Can DELETE: ' + (!deleteError ? '✅' : '❌'));

  // Check localStorage fallback
  console.log('\n💾 Checking localStorage fallback...');
  if (typeof window === 'undefined') {
    console.log('   (localStorage not available in Node.js)');
  }
}

testContentLibrary().catch(console.error);