const fetch = require('node-fetch');

async function test() {
  console.log('Testing Article Selector V4...\n');

  const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/article-selector-v4', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ organization_name: 'Mitsui & Co.' })
  });

  const result = await response.json();

  console.log('=== RESULTS ===\n');
  console.log('Success:', result.success);
  console.log('Articles scanned:', result.articles_scanned);
  console.log('Intelligence vectors:', result.intelligence_vectors);
  console.log('Hunter selected:', result.hunter_selected);
  console.log('After QC:', result.total_articles);
  console.log('Duration:', result.duration_seconds, 'seconds');
  console.log('\nVector matches:', result.vector_matches);
  console.log('\nSource distribution:', result.source_distribution);

  console.log('\n=== HUNTER SELECTIONS (before QC) ===\n');
  result.hunter_selections?.slice(0, 40).forEach((a, i) => {
    console.log(`${i + 1}. [${a.vector_match}] ${a.title}`);
    console.log(`   Source: ${a.source} | ${a.relevance}`);
    console.log();
  });

  console.log('\n=== FINAL ARTICLES (after QC) ===\n');
  result.articles?.slice(0, 20).forEach((a, i) => {
    console.log(`${i + 1}. [${a.vector_match}] ${a.title}`);
    console.log(`   Source: ${a.source} | ${a.relevance}`);
    console.log();
  });
}

test().catch(console.error);
