// Test to see what dates enrichment is returning
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing enrichment date output...\n');

  // Get a small sample
  const testArticles = [
    {
      title: "Test Article",
      url: "https://example.com/test",
      source: "Test Source",
      published_at: new Date().toISOString(),
      description: "Test description",
      relevance_score: 90
    }
  ];

  console.log('Input article published_at:', testArticles[0].published_at);

  const response = await supabase.functions.invoke('monitoring-stage-2-enrichment', {
    body: {
      articles: testArticles,
      profile: { organization_name: 'OpenAI' },
      organization_name: 'OpenAI',
      articles_limit: 1
    }
  });

  if (response.error) {
    console.error('Error:', response.error);
    return;
  }

  const enrichedArticle = response.data?.enriched_articles?.[0];
  console.log('\nEnriched article date fields:');
  console.log('  published_at:', enrichedArticle?.published_at);
  console.log('  publishedAt:', enrichedArticle?.publishedAt);
  console.log('  published:', enrichedArticle?.published);
  console.log('\nAll enriched article keys:', enrichedArticle ? Object.keys(enrichedArticle) : 'none');
}

test().catch(console.error);
