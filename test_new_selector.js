const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function testSelector() {
  console.log('=== TESTING NEW AI-POWERED SELECTOR ===\n');

  // Get KARV org ID
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'KARV')
    .single();

  console.log('Calling article-selector-v3 for KARV...\n');

  // Call the selector function
  const { data, error } = await supabase.functions.invoke('article-selector-v3', {
    body: {
      organization_id: org.id,
      organization_name: 'KARV'
    }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== RESULTS ===\n');
  console.log(`Total articles selected: ${data.total_articles}`);
  console.log(`Candidates evaluated: ${data.candidates_checked}`);
  console.log(`Average score: ${data.avg_score}`);
  console.log(`Selection method: ${data.selection_method}`);
  console.log(`\nSources: ${data.sources?.join(', ')}`);

  console.log('\n=== SELECTED ARTICLES ===\n');
  data.articles?.slice(0, 10).forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   Source: ${article.source} | Score: ${article.pr_score}`);
    console.log(`   Published: ${article.published_at}`);
    console.log('');
  });
}

testSelector();
