// Test Monitor Stage 1 with Claude Assessment
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testMonitorStage1() {
  console.log('🚀 Testing Monitor Stage 1 with Claude Assessment...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        organization_name: 'Tesla',
        search_queries: ['Tesla', 'EV market', 'autonomous driving']
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('📊 Results:');
    console.log(`   Total articles: ${data.articles?.length || 0}`);
    console.log(`   Claude assessed: ${data.metadata?.claude_assessed || 0}`);
    
    // Check for Claude assessment
    const claudeAssessed = data.articles?.filter(a => a.claude_assessed) || [];
    console.log(`\n🤖 Claude Assessment Status:`);
    console.log(`   Articles with Claude assessment: ${claudeAssessed.length}`);
    
    if (claudeAssessed.length > 0) {
      console.log('\n✅ Top 5 Claude-assessed articles:');
      claudeAssessed.slice(0, 5).forEach((article, i) => {
        console.log(`\n   ${i + 1}. [Score: ${article.relevance_score}] ${article.title?.substring(0, 60)}...`);
        console.log(`      Priority: ${article.priority}`);
        console.log(`      Category: ${article.pr_category}`);
        console.log(`      Insights: ${article.key_insights || 'N/A'}`);
        if (article.target_matches && Object.keys(article.target_matches).length > 0) {
          console.log(`      Matches: ${JSON.stringify(article.target_matches)}`);
        }
      });
    } else {
      console.log('\n⚠️ No articles were assessed by Claude');
      console.log('   Check the function logs for error details');
    }
    
    // Show priority breakdown
    if (data.metadata?.priority_breakdown) {
      console.log('\n📈 Priority Distribution:');
      console.log(`   Critical: ${data.metadata.priority_breakdown.critical || 0}`);
      console.log(`   High: ${data.metadata.priority_breakdown.high || 0}`);
      console.log(`   Medium: ${data.metadata.priority_breakdown.medium || 0}`);
      console.log(`   Low: ${data.metadata.priority_breakdown.low || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMonitorStage1();