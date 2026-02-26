const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function checkURLs() {
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, title, url, source_name')
    .eq('scrape_status', 'completed')
    .limit(10);

  console.log('=== SAMPLE ARTICLE URLS ===\n');
  articles.forEach((article, i) => {
    console.log(`${i + 1}. ${article.title}`);
    console.log(`   Source: ${article.source_name}`);
    console.log(`   URL: ${article.url}`);
    console.log('');
  });
}

checkURLs();
