const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function testMitsuiSelector() {
  console.log('=== TESTING MITSUI SELECTOR ===\n');

  // Get Mitsui org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, industry, company_profile')
    .eq('name', 'Mitsui & Co.')
    .single();

  console.log(`Organization: ${org.name}`);
  console.log(`Industry: ${org.industry}\n`);

  console.log('Calling article-selector-v3...\n');

  // Call the selector function
  const { data, error } = await supabase.functions.invoke('article-selector-v3', {
    body: {
      organization_id: org.id,
      organization_name: org.name
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
  console.log(`\nSources (${data.sources?.length}): ${data.sources?.join(', ')}`);

  console.log('\n=== ALL SELECTED ARTICLES ===\n');
  data.articles?.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   Source: ${article.source} | Score: ${article.pr_score}`);
    console.log(`   Published: ${article.published_at}`);
    console.log('');
  });
}

testMitsuiSelector();
