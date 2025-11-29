const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
);

async function debugSelector() {
  console.log('=== DEBUGGING ARTICLE SELECTOR ===\n');

  // Get KARV organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, industry, company_profile')
    .eq('name', 'KARV')
    .single();

  console.log('Organization:', org.name);
  console.log('Industry:', org.industry);
  console.log('\n');

  // Check raw_articles in last 48 hours
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Articles with published_at
  const { data: articlesWithPublished, error: error1 } = await supabase
    .from('raw_articles')
    .select('id, title, source_name, published_at, scraped_at, description')
    .eq('scrape_status', 'completed')
    .not('published_at', 'is', null)
    .gte('published_at', fortyEightHoursAgo)
    .order('published_at', { ascending: false })
    .limit(100);

  console.log(`Articles with published_at in last 48h: ${articlesWithPublished?.length || 0}`);
  if (error1) console.error('Error1:', error1);

  // Articles without published_at (using scraped_at)
  const { data: articlesWithoutPublished, error: error2 } = await supabase
    .from('raw_articles')
    .select('id, title, source_name, published_at, scraped_at, description')
    .eq('scrape_status', 'completed')
    .is('published_at', null)
    .gte('scraped_at', fortyEightHoursAgo)
    .order('scraped_at', { ascending: false })
    .limit(50);

  console.log(`Articles without published_at (using scraped_at) in last 48h: ${articlesWithoutPublished?.length || 0}`);
  if (error2) console.error('Error2:', error2);

  const allArticles = [...(articlesWithPublished || []), ...(articlesWithoutPublished || [])];
  console.log(`\nTotal articles available: ${allArticles.length}\n`);

  // Show first 10 articles
  console.log('=== FIRST 10 ARTICLES ===');
  allArticles.slice(0, 10).forEach((article, i) => {
    console.log(`\n${i + 1}. ${article.title}`);
    console.log(`   Source: ${article.source_name}`);
    console.log(`   Published: ${article.published_at || 'null'}`);
    console.log(`   Scraped: ${article.scraped_at}`);
    console.log(`   Description: ${(article.description || '').substring(0, 100)}...`);
  });

  // Get keywords from KARV profile
  console.log('\n\n=== KARV KEYWORDS ===');
  const keywords = new Set();
  const profile = org.company_profile || {};

  if (org.name) keywords.add(org.name.toLowerCase());
  if (profile.monitoring_config?.keywords) {
    profile.monitoring_config.keywords.forEach(k => keywords.add(k.toLowerCase()));
  }

  // Get intelligence targets
  const { data: targets } = await supabase
    .from('intelligence_targets')
    .select('name, type')
    .eq('organization_id', org.id)
    .eq('active', true);

  if (targets) {
    targets.forEach(t => keywords.add(t.name.toLowerCase()));
  }

  console.log(`Total keywords: ${keywords.size}`);
  console.log('Keywords:', Array.from(keywords).slice(0, 20));

  // Test keyword matching on first 10 articles
  console.log('\n\n=== KEYWORD MATCHING TEST ===');
  const keywordArray = Array.from(keywords);
  allArticles.slice(0, 20).forEach((article, i) => {
    const searchText = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    const matches = keywordArray.filter(keyword => searchText.includes(keyword));

    if (matches.length > 0) {
      console.log(`\n✓ Article ${i + 1}: "${article.title}"`);
      console.log(`  Matched keywords: ${matches.join(', ')}`);
    } else {
      console.log(`\n✗ Article ${i + 1}: "${article.title}" - NO MATCHES`);
    }
  });
}

debugSelector();
