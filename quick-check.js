const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
);

supabase.from('content_library').select('content').eq('content_type', 'strategy').order('created_at', { ascending: false }).limit(1).then(({ data }) => {
  if (data && data[0]) {
    const content = data[0].content;
    console.log('Has contentStrategy:', !!content.contentStrategy);
    console.log('Has executionPlan:', !!content.executionPlan);
    console.log('Content keys:', Object.keys(content));

    if (!content.contentStrategy && !content.executionPlan) {
      console.log('\n❌ NEW FIELDS NOT FOUND - Framework deployed without new fields');
      console.log('This is the OLD framework structure');
    } else {
      console.log('\n✅ NEW FIELDS FOUND');
      if (content.contentStrategy) {
        console.log('contentStrategy.subject:', content.contentStrategy.subject);
      }
      if (content.executionPlan) {
        console.log('executionPlan has:', Object.keys(content.executionPlan));
      }
    }
  }
}).catch(err => console.error(err));
