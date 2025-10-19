// Test Enhanced Relevance Scoring

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testEnhancedRelevance() {
  console.log('🚀 Testing Enhanced Relevance Scoring\n');
  console.log('=' + '='.repeat(70));
  
  try {
    // Step 1: Get profile from discovery
    console.log('\n📋 STEP 1: Getting profile from discovery...');
    const discoveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'create_organization_profile',
          arguments: {
            organization_name: 'Tesla'
          }
        }
      })
    });
    
    const discoveryData = await discoveryResponse.json();
    if (!discoveryData.content || !discoveryData.content[0]) {
      console.error('Discovery response:', JSON.stringify(discoveryData, null, 2));
      throw new Error('Invalid discovery response');
    }
    const profile = JSON.parse(discoveryData.content[0].text);
    
    console.log('✅ Profile loaded with:');
    console.log(`   - Competitors: ${profile.competition?.direct_competitors?.slice(0, 5).join(', ') || 'none'}`);
    console.log(`   - Stakeholders: ${profile.stakeholders?.regulators?.slice(0, 3).join(', ') || 'none'}`);
    console.log(`   - Keywords: ${profile.monitoring_config?.keywords?.slice(0, 5).join(', ') || 'none'}`);
    
    // Step 2: Get articles from Stage 1
    console.log('\n📰 STEP 2: Getting articles from Stage 1...');
    const stage1Response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile: profile,
        organization_name: 'Tesla'
      })
    });
    
    const stage1Data = await stage1Response.json();
    console.log(`✅ Got ${stage1Data.articles?.length || 0} articles from Stage 1`);
    
    // Step 3: Test relevance scoring
    console.log('\n🎯 STEP 3: Testing relevance scoring...');
    const relevanceResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        articles: stage1Data.articles || [],
        profile: profile,
        organization_name: 'Tesla',
        top_k: 25
      })
    });
    
    const relevanceData = await relevanceResponse.json();
    const selectedArticles = relevanceData.findings || [];
    
    console.log(`\n📊 RELEVANCE RESULTS:`);
    console.log(`✅ Selected ${selectedArticles.length} articles for Firecrawl`);
    
    // Analyze what was prioritized
    const intelligenceTypes = {};
    const categories = {};
    const entitiesFound = new Set();
    const actionableCount = selectedArticles.filter(a => a.pr_extraction?.has_actionable_intel).length;
    
    selectedArticles.forEach(article => {
      const type = article.pr_extraction?.intelligence_type || 'none';
      intelligenceTypes[type] = (intelligenceTypes[type] || 0) + 1;
      
      const cat = article.pr_category || 'general';
      categories[cat] = (categories[cat] || 0) + 1;
      
      (article.pr_extraction?.mentioned_entities || []).forEach(e => entitiesFound.add(e));
    });
    
    console.log(`\n🎯 Intelligence Type Breakdown:`);
    Object.entries(intelligenceTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} articles`);
    });
    
    console.log(`\n📁 Category Breakdown:`);
    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} articles`);
    });
    
    console.log(`\n✨ Actionable Intelligence: ${actionableCount}/${selectedArticles.length} articles`);
    console.log(`🏢 Unique Entities Found: ${entitiesFound.size}`);
    
    // Show top 5 articles and why they were chosen
    console.log(`\n🔝 TOP 5 PRIORITIZED ARTICLES:`);
    console.log('=' + '='.repeat(70));
    
    selectedArticles.slice(0, 5).forEach((article, idx) => {
      console.log(`\n${idx + 1}. Score: ${article.pr_relevance_score}`);
      console.log(`   Title: ${article.title?.substring(0, 80)}...`);
      console.log(`   Type: ${article.pr_extraction?.intelligence_type || 'none'}`);
      console.log(`   Category: ${article.pr_category}`);
      console.log(`   Factors: ${(article.pr_factors || []).slice(0, 3).join(', ')}`);
      
      const signals = article.pr_extraction?.actionable_signals || {};
      const activeSignals = Object.entries(signals).filter(([k, v]) => v).map(([k]) => k);
      if (activeSignals.length > 0) {
        console.log(`   Signals: ${activeSignals.join(', ')}`);
      }
      
      const entities = article.pr_extraction?.mentioned_entities || [];
      if (entities.length > 0) {
        console.log(`   Entities: ${entities.join(', ')}`);
      }
    });
    
    // Show coverage analysis
    console.log(`\n📈 COVERAGE ANALYSIS:`);
    console.log('=' + '='.repeat(70));
    
    const competitorsCovered = new Set();
    const stakeholdersCovered = new Set();
    
    selectedArticles.forEach(article => {
      const entities = article.pr_extraction?.mentioned_entities || [];
      entities.forEach(entity => {
        if (profile.competition?.direct_competitors?.includes(entity)) {
          competitorsCovered.add(entity);
        }
        if (profile.stakeholders?.regulators?.includes(entity)) {
          stakeholdersCovered.add(entity);
        }
      });
    });
    
    console.log(`\nCompetitors Coverage:`);
    console.log(`   Covered: ${Array.from(competitorsCovered).join(', ') || 'none'}`);
    console.log(`   Missing: ${profile.competition?.direct_competitors?.filter(c => !competitorsCovered.has(c)).join(', ') || 'none'}`);
    
    console.log(`\nRegulators Coverage:`);
    console.log(`   Covered: ${Array.from(stakeholdersCovered).join(', ') || 'none'}`);
    console.log(`   Missing: ${profile.stakeholders?.regulators?.filter(s => !stakeholdersCovered.has(s)).join(', ') || 'none'}`);
    
    // Test if these are good targets for Firecrawl
    console.log(`\n🎯 FIRECRAWL READINESS CHECK:`);
    console.log('=' + '='.repeat(70));
    
    const goodTargets = selectedArticles.filter(a => 
      a.pr_extraction?.has_actionable_intel && 
      a.pr_relevance_score >= 50
    );
    
    console.log(`✅ High-value targets for scraping: ${goodTargets.length}/${selectedArticles.length}`);
    console.log(`📊 Average relevance score: ${Math.round(selectedArticles.reduce((sum, a) => sum + a.pr_relevance_score, 0) / selectedArticles.length)}`);
    
    const withCompetitors = selectedArticles.filter(a => a.pr_extraction?.competitor_count > 0);
    console.log(`🏢 Articles mentioning competitors: ${withCompetitors.length}`);
    
    const withMultipleSignals = selectedArticles.filter(a => {
      const signals = a.pr_extraction?.actionable_signals || {};
      return Object.values(signals).filter(v => v).length >= 2;
    });
    console.log(`⚡ Articles with multiple signals: ${withMultipleSignals.length}`);
    
    console.log(`\n✅ RELEVANCE SCORING IS ${goodTargets.length > 10 ? 'WORKING WELL' : 'NEEDS IMPROVEMENT'}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testEnhancedRelevance();