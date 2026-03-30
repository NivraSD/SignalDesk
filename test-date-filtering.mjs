// Test date filtering and check for Total Energies news
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORG_ID = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad';

console.log('🔍 Testing monitoring date filtering and news coverage...\n');

// Trigger monitoring
const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity-monitor-v2`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
  },
  body: JSON.stringify({
    organization_id: ORG_ID,
    recency_window: '24hours',
    max_results: 50
  })
});

if (!response.ok) {
  console.error('❌ Monitoring failed:', response.status);
  process.exit(1);
}

const data = await response.json();
const articles = data.articles || [];

console.log(`📊 Found ${articles.length} articles\n`);

// Check article dates
const now = Date.now();
const hoursOld = articles.map(a => {
  const pubDate = new Date(a.publishDate || a.published_at);
  const age = (now - pubDate.getTime()) / (1000 * 60 * 60);
  return {
    title: a.title,
    age: Math.floor(age),
    publishDate: a.publishDate || a.published_at,
    source: a.source
  };
});

// Sort by age
hoursOld.sort((a, b) => b.age - a.age);

console.log('📅 Article age distribution:');
console.log(`   Newest: ${hoursOld[hoursOld.length - 1]?.age}h old`);
console.log(`   Oldest: ${hoursOld[0]?.age}h old`);
console.log(`   Median: ${hoursOld[Math.floor(hoursOld.length / 2)]?.age}h old\n`);

// Show oldest articles
console.log('⏰ Top 5 oldest articles:');
hoursOld.slice(0, 5).forEach((a, i) => {
  console.log(`   ${i + 1}. [${a.age}h ago] ${a.title.substring(0, 80)}...`);
  console.log(`      Source: ${a.source}, Date: ${a.publishDate}`);
});

// Check for articles > 24h
const oldArticles = hoursOld.filter(a => a.age > 24);
if (oldArticles.length > 0) {
  console.log(`\n❌ WARNING: ${oldArticles.length} articles older than 24 hours!`);
  oldArticles.forEach(a => {
    console.log(`   - [${a.age}h] ${a.title.substring(0, 100)}`);
  });
} else {
  console.log('\n✅ All articles within 24 hour window');
}

// Check for Total Energies or similar big news
console.log('\n🔍 Checking for major energy/trading news:');
const bigNews = articles.filter(a => {
  const text = (a.title + ' ' + a.description).toLowerCase();
  return text.includes('total energies') ||
         text.includes('lawsuit') ||
         text.includes('war crimes') ||
         text.includes('energy') && text.includes('investigation') ||
         text.includes('trading') && text.includes('scandal');
});

if (bigNews.length > 0) {
  console.log(`   ✅ Found ${bigNews.length} major news stories:`);
  bigNews.forEach(a => {
    console.log(`   - ${a.title}`);
    console.log(`     ${a.url}`);
  });
} else {
  console.log('   ❌ No major energy/legal news found');
  console.log('   This suggests queries might be too narrow');
}

console.log('\n📋 Sample article sources:');
const sourceCounts = {};
articles.forEach(a => {
  sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1;
});
Object.entries(sourceCounts).slice(0, 10).forEach(([source, count]) => {
  console.log(`   ${source}: ${count} articles`);
});
