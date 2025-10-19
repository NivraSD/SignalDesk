const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRecentContent() {
  // Check all recent content in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('content_library')
    .select('id, content_type, title, created_at, folder')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Found ${data.length} items in last 24 hours:\n`);
    data.forEach((item, i) => {
      console.log(`${i + 1}. [${item.content_type}] ${item.title || 'Untitled'}`);
      console.log(`   Created: ${item.created_at}`);
      console.log(`   Folder: ${item.folder || 'none'}`);
      console.log('');
    });

    // Check if any are strategic frameworks
    const frameworks = data.filter(item => item.content_type === 'strategic-framework');
    if (frameworks.length > 0) {
      console.log(`\n✅ Found ${frameworks.length} strategic frameworks`);
    } else {
      console.log(`\n❌ No strategic frameworks found`);
    }
  } else {
    console.log('No content found in last 24 hours');
  }
}

checkRecentContent();
