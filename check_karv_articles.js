const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkKARVArticles() {
  // Get KARV organization ID
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'KARV')
    .single();

  if (!org) {
    console.log('KARV organization not found');
    return;
  }

  // Get recent articles
  const { data: articles, error } = await supabase
    .from('raw_articles')
    .select('title, source_id, published_at, matched_keywords, url')
    .eq('organization_id', org.id)
    .order('published_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== RECENT KARV ARTICLES ===\n');
  articles.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   Source ID: ${article.source_id}`);
    console.log(`   Published: ${article.published_at}`);
    console.log(`   Matched keywords: ${JSON.stringify(article.matched_keywords)}`);
    console.log(`   URL: ${article.url}`);
    console.log('');
  });
}

checkKARVArticles();
