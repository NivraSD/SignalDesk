const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStrategyContent() {
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .eq('content_type', 'strategy')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const strategy = data[0];
    console.log('Latest Strategy Item:');
    console.log('Title:', strategy.title);
    console.log('Content Type:', strategy.content_type);
    console.log('Created:', strategy.created_at);
    console.log('\nContent Structure:');
    console.log('Type:', typeof strategy.content);

    if (strategy.content) {
      const content = strategy.content;
      console.log('\nTop-level keys:', Object.keys(content));

      // Check for our new fields
      console.log('\n=== NEW FIELDS CHECK ===');
      console.log('Has contentStrategy:', !!content.contentStrategy);
      console.log('Has executionPlan:', !!content.executionPlan);

      if (content.contentStrategy) {
        console.log('\ncontentStrategy keys:', Object.keys(content.contentStrategy));
        console.log('Subject:', content.contentStrategy.subject);
      }

      if (content.executionPlan) {
        console.log('\nexecutionPlan keys:', Object.keys(content.executionPlan));
        if (content.executionPlan.autoExecutableContent) {
          console.log('Auto-executable content types:', content.executionPlan.autoExecutableContent.contentTypes);
        }
        if (content.executionPlan.strategicRecommendations) {
          console.log('Strategic campaigns count:', content.executionPlan.strategicRecommendations.campaigns?.length || 0);
        }
      }

      // Show full content (truncated)
      console.log('\n=== FULL CONTENT (first 3000 chars) ===');
      console.log(JSON.stringify(content, null, 2).substring(0, 3000));
    }
  } else {
    console.log('No strategy items found');
  }
}

checkStrategyContent();
