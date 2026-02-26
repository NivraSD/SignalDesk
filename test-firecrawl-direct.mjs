// Direct test of Firecrawl with site: operator
import { config } from 'dotenv';
config({ path: '.env.local' });

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0';
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2';

// Test domains (top news sources)
const testDomains = [
  'wsj.com',
  'reuters.com',
  'bloomberg.com',
  'ft.com',
  'nytimes.com'
];

// Create site-restricted query
const siteRestrictions = testDomains.map(d => `site:${d}`).join(' OR ');
const query = `(${siteRestrictions}) Mitsui trading`;

console.log('🔍 Testing Firecrawl with domain-restricted query...\n');
console.log(`Query: ${query}\n`);

try {
  const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      sources: ['web', 'news'],
      limit: 15,
      tbs: 'qdr:d', // Last 24 hours
      timeout: 40000,
      ignoreInvalidURLs: true,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        maxAge: 0
      }
    })
  });

  if (!response.ok) {
    console.error('❌ Firecrawl request failed:', response.status);
    const errorText = await response.text();
    console.error('Error:', errorText);
    process.exit(1);
  }

  const data = await response.json();

  console.log('✅ Firecrawl response received\n');
  console.log('📊 Response structure:');
  console.log(`   Success: ${data.success}`);
  console.log(`   Web results: ${data.data?.web?.length || 0}`);
  console.log(`   News results: ${data.data?.news?.length || 0}`);

  const allResults = [...(data.data?.web || []), ...(data.data?.news || [])];
  console.log(`   Total results: ${allResults.length}\n`);

  if (allResults.length > 0) {
    console.log('📰 Sample results:');
    allResults.slice(0, 5).forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Source: ${result.source || 'N/A'}`);
      console.log(`   Score: ${result.score || 'N/A'}`);
    });

    console.log('\n✅ SUCCESS: Firecrawl found results with site: operator');
  } else {
    console.log('⚠️ WARNING: Firecrawl returned 0 results');
    console.log('\nFull response:');
    console.log(JSON.stringify(data, null, 2));
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
