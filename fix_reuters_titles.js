const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function fixReutersTitles() {
  console.log('Fetching Reuters sitemap...');

  // Fetch Reuters sitemap
  const res = await fetch('https://www.reuters.com/arc/outboundfeeds/news-sitemap/?outputType=xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const xml = await res.text();

  // Parse into URL -> title map
  const titleMap = {};
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const titleMatch = block.match(/<news:title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/news:title>/);
    if (locMatch && titleMatch) {
      titleMap[locMatch[1]] = titleMatch[1];
    }
  }

  console.log('Found', Object.keys(titleMap).length, 'titles in sitemap');

  // Get Reuters articles without titles (Untitled)
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, url, title')
    .eq('source_name', 'Reuters')
    .eq('title', 'Untitled');

  console.log('Found', articles?.length, 'Untitled Reuters articles');

  // Update titles
  let updated = 0;
  for (const article of articles || []) {
    const title = titleMap[article.url];
    if (title) {
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

  console.log('\nUpdated', updated, 'Reuters titles');
}

fixReutersTitles();
