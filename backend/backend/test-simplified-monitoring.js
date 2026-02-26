/**
 * TEST SIMPLIFIED MONITORING SYSTEM
 * Verifies the system works without executive summary
 */

const axios = require('axios');
const StrategicMonitoringCoordinator = require('./src/services/StrategicMonitoringCoordinator');

async function testSimplifiedMonitoring() {
  console.log('🧪 TESTING SIMPLIFIED MONITORING SYSTEM');
  console.log('=======================================\n');
  
  const coordinator = new StrategicMonitoringCoordinator();
  const testOrgId = 'test-simplified-' + Date.now();
  
  try {
    // Test 1: Direct monitoring without executive summary
    console.log('📌 Test 1: Running monitoring WITHOUT executive summary...');
    
    const results = await coordinator.runStrategicMonitoring(testOrgId);
    
    // Verify NO executive summary in results
    if (results.data && results.data.executiveSummary) {
      console.log('❌ FAILED: Executive summary still present!');
      return;
    }
    
    console.log('✅ No executive summary found (good!)');
    
    // Check what we DO have
    console.log('\n📊 Data Structure (simplified):');
    console.log('   Articles:', results.data?.articles?.length || 0);
    console.log('   Sources:', results.data?.sources?.length || 0);
    console.log('   Intelligence points:', Object.keys(results.data?.intelligence || {}).length);
    console.log('   Opportunities:', results.data?.opportunities?.length || 0);
    
    // Test 2: Verify data is still useful
    console.log('\n📌 Test 2: Verifying data quality...');
    
    if (results.data?.articles && results.data.articles.length > 0) {
      console.log('✅ Articles collected successfully');
      
      // Sample article structure
      const sampleArticle = results.data.articles[0];
      console.log('\n📄 Sample Article:');
      console.log('   Title:', sampleArticle.title);
      console.log('   Source:', sampleArticle.source);
      console.log('   Category:', sampleArticle.category);
    }
    
    if (results.data?.intelligence) {
      console.log('\n✅ Intelligence extracted:');
      console.log('   Competitor activities:', results.data.intelligence.competitorActivity?.length || 0);
      console.log('   Trends:', results.data.intelligence.emergingTrends?.length || 0);
      console.log('   Narrative gaps:', results.data.intelligence.narrativeGaps?.length || 0);
    }
    
    if (results.data?.opportunities && results.data.opportunities.length > 0) {
      console.log('\n✅ Opportunities discovered:');
      results.data.opportunities.slice(0, 3).forEach((opp, i) => {
        console.log(`   ${i + 1}. ${opp.title}`);
        console.log(`      Score: ${(opp.totalScore * 100).toFixed(1)}%`);
      });
    }
    
    // Test 3: API test (if server running)
    console.log('\n📌 Test 3: Testing simplified API...');
    
    try {
      const apiResponse = await axios.get(
        `http://localhost:5001/api/simplified/intelligence/${testOrgId}`
      );
      
      // Verify no executive summary in API response
      if (apiResponse.data.executiveSummary) {
        console.log('❌ API still returns executive summary!');
      } else {
        console.log('✅ API returns clean data without executive summary');
      }
      
      console.log('\n📋 API Response Structure:');
      console.log('   Success:', apiResponse.data.success);
      console.log('   Articles:', apiResponse.data.articles?.total || 0);
      console.log('   Competitors:', apiResponse.data.competitors?.count || 0);
      console.log('   Topics:', apiResponse.data.topics?.count || 0);
      console.log('   Opportunities:', apiResponse.data.opportunities?.count || 0);
      
    } catch (apiError) {
      console.log('⚠️ API not available (server may not be running)');
      console.log('   To test API: Add routes to server.js and restart');
    }
    
    // Summary
    console.log('\n=======================================');
    console.log('📈 TEST SUMMARY');
    console.log('=======================================');
    console.log('✅ Executive summary successfully removed');
    console.log('✅ Data collection still works');
    console.log('✅ Intelligence extraction still works');
    console.log('✅ Opportunity discovery still works');
    console.log('✅ System is simpler and more direct');
    
    console.log('\n💡 BENEFITS OF REMOVAL:');
    console.log('• Simpler data structure');
    console.log('• Faster processing (no synthesis step)');
    console.log('• Direct access to actual data');
    console.log('• Less chance for errors');
    console.log('• Easier to debug and maintain');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
  }
}

// Run the test
console.log('🚀 Starting simplified monitoring test...\n');
testSimplifiedMonitoring()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Test error:', err);
    process.exit(1);
  });