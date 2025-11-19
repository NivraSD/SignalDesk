// Test monitoring to verify it reads sources and finds articles
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ORG_ID = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad';

console.log('🔍 Testing monitoring with fixed sources...\n');

// Trigger monitoring
console.log('📡 Triggering monitoring for Mitsui & Co...');
const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor-v2`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  },
  body: JSON.stringify({
    organization_id: ORG_ID,
    recency_window: '24hours',
    max_results: 20
  })
});

if (!response.ok) {
  console.error('❌ Monitoring failed:', response.status, await response.text());
  process.exit(1);
}

const result = await response.json();
console.log('✅ Monitoring completed\n');

// Analyze results
console.log('📊 Monitoring results:');
console.log(`   Articles found: ${result.articles?.length || 0}`);
console.log(`   Queries executed: ${result.queries_executed || 'unknown'}`);
console.log(`   Sources used: ${result.sources_used || 'unknown'}`);

if (result.articles && result.articles.length > 0) {
  console.log('\n📰 Sample articles:');
  result.articles.slice(0, 3).forEach((article, i) => {
    console.log(`   ${i + 1}. ${article.title || article.headline || 'Untitled'}`);
    console.log(`      Source: ${article.source || 'Unknown'}`);
    console.log(`      URL: ${article.url || 'No URL'}`);
  });
}

if (result.articles && result.articles.length > 0) {
  console.log('\n✅ SUCCESS: Monitoring found articles using domain-restricted sources!');
} else {
  console.log('\n⚠️ WARNING: Monitoring completed but found 0 articles');
  console.log('   This could be normal if there are no recent articles in the time window');
}

console.log('\n📋 Full monitoring response structure:');
console.log(JSON.stringify(result, null, 2));
