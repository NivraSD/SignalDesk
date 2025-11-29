const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function fixBloombergDates() {
  // Fetch Bloomberg sitemap
  const res = await fetch('https://www.bloomberg.com/sitemaps/news/latest.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const xml = await res.text();

  // Parse into URL -> date map
  const dateMap = {};
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const dateMatch = block.match(/<news:publication_date>(.*?)<\/news:publication_date>/);
    if (locMatch && dateMatch) {
      dateMap[locMatch[1]] = dateMatch[1];
    }
  }

  console.log('Found', Object.keys(dateMap).length, 'dates in sitemap');

  // Get Bloomberg articles without published_at
  const { data: articles } = await supabase
    .from('raw_articles')
    .select('id, url, published_at')
    .eq('source_name', 'Bloomberg')
    .is('published_at', null);

  console.log('Found', articles?.length, 'Bloomberg articles without published_at');

  // Update dates
  let updated = 0;
  for (const article of articles || []) {
    const pubDate = dateMap[article.url];
    if (pubDate) {
      const { error } = await supabase
        .from('raw_articles')
        .update({ published_at: pubDate })
        .eq('id', article.id);

      if (!error) {
        updated++;
      }
    }
  }

  console.log('Updated', updated, 'Bloomberg dates');
}
fixBloombergDates();
