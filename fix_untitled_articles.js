const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function fix() {
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, url, title')
    .eq('title', 'Untitled');

  console.log('Found', articles?.length, 'Untitled articles');

  let updated = 0;
  for (const article of articles || []) {
    // Extract slug from URL
    const urlParts = article.url.split('/').filter(p => p.length > 0);
    const slug = urlParts[urlParts.length - 1] || '';
    // Remove date suffix and convert hyphens to spaces
    const title = slug.replace(/-/g, ' ').replace(/\s*[0-9]{4}\s*[0-9]{2}\s*[0-9]{2}\s*$/, '').trim();

    if (title && title.length > 3) {
      const { error } = await supabase
        .from('raw_articles')
        .update({ title })
        .eq('id', article.id);

      if (!error) {
        console.log('Updated:', title.substring(0, 60));
        updated++;
      }
    }
  }

  console.log('\nUpdated', updated, 'articles');
}

fix();
