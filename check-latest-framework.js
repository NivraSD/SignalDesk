const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLatestFramework() {
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('content_type', 'strategic-framework')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const framework = data[0];
    console.log('Latest Framework:');
    console.log('Title:', framework.title);
    console.log('Created:', framework.created_at);
    console.log('Content type:', typeof framework.content);
    console.log('Content length:', JSON.stringify(framework.content).length);
    console.log('Has contentStrategy:', framework.content && framework.content.contentStrategy ? 'YES' : 'NO');
    console.log('Has executionPlan:', framework.content && framework.content.executionPlan ? 'YES' : 'NO');
    console.log('\nContent keys:', framework.content ? Object.keys(framework.content) : 'null');

    if (framework.content) {
      console.log('\n=== CONTENT STRUCTURE ===');
      console.log(JSON.stringify(framework.content, null, 2).substring(0, 2000));
    }
  } else {
    console.log('No frameworks found');
  }
}

checkLatestFramework();
