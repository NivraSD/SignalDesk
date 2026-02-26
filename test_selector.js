async function testSelector() {
  console.log("🧪 Testing Article Selector V5 for KARV...\n");
  console.log("This uses the NEW strategic intelligence framing.\n");

  const response = await fetch('https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/article-selector-v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
    },
    body: JSON.stringify({
      organization_name: 'KARV'
    })
  });

  const data = await response.json();

  console.log('=== SELECTOR RESULTS ===\n');
  console.log('Selection method:', data.selection_method);
  console.log('Total articles selected:', data.total_articles);
  console.log('Candidates checked:', data.candidates_checked);
  console.log('Average score:', data.avg_score);
  console.log('\nSource distribution:', JSON.stringify(data.source_distribution, null, 2));

  console.log('\n=== SELECTED ARTICLES ===\n');

  if (data.articles && data.articles.length > 0) {
    data.articles.forEach((article, i) => {
      console.log(`${i + 1}. [Score: ${article.pr_score}] ${article.title?.substring(0, 65)}`);
      console.log(`   Source: ${article.source}`);
      if (article.ai_reasoning) {
        console.log(`   Reason: ${article.ai_reasoning}`);
      }
      console.log('');
    });
  } else {
    console.log('No articles selected!');
    console.log('Full response:', JSON.stringify(data, null, 2));
  }
}

testSelector().catch(console.error);
