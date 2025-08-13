/**
 * Test script to verify the intelligence configuration to summary flow
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
const TEST_ORG_ID = 'org-test-123';

async function testIntelligenceFlow() {
  console.log('🧪 TESTING INTELLIGENCE FLOW');
  console.log('=====================================\n');
  
  try {
    // Step 1: Setup intelligence targets
    console.log('📝 Step 1: Setting up intelligence targets...');
    
    const configPayload = {
      organizationId: TEST_ORG_ID,
      organization: {
        name: 'Acme Corporation',
        industry: 'Technology'
      },
      competitors: [
        { name: 'Microsoft', priority: 'high' },
        { name: 'Google', priority: 'high' },
        { name: 'Amazon', priority: 'medium' }
      ],
      topics: [
        { name: 'Artificial Intelligence', priority: 'high' },
        { name: 'Cloud Computing', priority: 'high' },
        { name: 'Cybersecurity', priority: 'medium' }
      ]
    };
    
    // This would normally be done through the UI
    console.log('Configuration:', JSON.stringify(configPayload, null, 2));
    
    // Step 2: Call intelligence summary endpoint
    console.log('\n📊 Step 2: Fetching intelligence summary...');
    console.log(`Calling: GET ${BASE_URL}/monitoring/v2/intelligence-summary/${TEST_ORG_ID}`);
    
    const response = await axios.get(
      `${BASE_URL}/monitoring/v2/intelligence-summary/${TEST_ORG_ID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
          // 'Authorization': 'Bearer YOUR_TOKEN'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('\n✅ Response received!');
    console.log('=====================================\n');
    
    // Step 3: Analyze the response
    const data = response.data;
    
    if (data.success) {
      console.log('📈 INTELLIGENCE SUMMARY RESULTS:');
      console.log('--------------------------------');
      
      // Executive Summary
      if (data.executiveSummary) {
        console.log('\n📋 Executive Summary:');
        console.log('  Headline:', data.executiveSummary.headline);
        console.log('  Total Articles:', data.executiveSummary.totalArticles);
        console.log('  Key Points:', data.executiveSummary.keyPoints?.length || 0);
        
        if (data.executiveSummary.breakdown) {
          console.log('  Article Breakdown:');
          Object.entries(data.executiveSummary.breakdown).forEach(([key, value]) => {
            console.log(`    - ${key}: ${value}`);
          });
        }
      }
      
      // Organization Intelligence
      if (data.organizationIntelligence) {
        console.log('\n🏢 Organization Intelligence:');
        console.log('  Summary:', data.organizationIntelligence.summary);
        console.log('  Articles:', data.organizationIntelligence.articles?.length || 0);
        
        if (data.organizationIntelligence.articles?.length > 0) {
          console.log('  Sample Articles:');
          data.organizationIntelligence.articles.slice(0, 3).forEach(article => {
            console.log(`    - ${article.title} (${article.source})`);
          });
        }
      }
      
      // Competitive Intelligence
      if (data.competitiveIntelligence) {
        console.log('\n🎯 Competitive Intelligence:');
        console.log('  Summary:', data.competitiveIntelligence.summary);
        console.log('  Articles:', data.competitiveIntelligence.articles?.length || 0);
        
        if (data.competitiveIntelligence.articles?.length > 0) {
          console.log('  Sample Articles:');
          data.competitiveIntelligence.articles.slice(0, 3).forEach(article => {
            console.log(`    - ${article.title} (${article.source})`);
          });
        }
      }
      
      // Topic Intelligence
      if (data.topicIntelligence) {
        console.log('\n📚 Topic Intelligence:');
        console.log('  Summary:', data.topicIntelligence.summary);
        console.log('  Articles:', data.topicIntelligence.articles?.length || 0);
      }
      
      // Metadata
      if (data.metadata) {
        console.log('\n📊 Metadata:');
        console.log('  Generated:', new Date(data.metadata.generated).toLocaleString());
        console.log('  Total Articles:', data.metadata.totalArticles);
        console.log('  Sources:', JSON.stringify(data.metadata.sources));
      }
      
      // Success indicators
      console.log('\n🎯 SUCCESS INDICATORS:');
      const hasArticles = (data.metadata?.totalArticles || 0) > 0;
      const hasOrgData = (data.organizationIntelligence?.articles?.length || 0) > 0;
      const hasCompData = (data.competitiveIntelligence?.articles?.length || 0) > 0;
      const hasTopicData = (data.topicIntelligence?.articles?.length || 0) > 0;
      
      console.log(`  ✅ Has articles: ${hasArticles ? 'YES' : 'NO'} (${data.metadata?.totalArticles || 0} total)`);
      console.log(`  ✅ Has org data: ${hasOrgData ? 'YES' : 'NO'}`);
      console.log(`  ✅ Has competitor data: ${hasCompData ? 'YES' : 'NO'}`);
      console.log(`  ✅ Has topic data: ${hasTopicData ? 'YES' : 'NO'}`);
      
      // Overall assessment
      const overallSuccess = hasArticles && (hasOrgData || hasCompData || hasTopicData);
      console.log(`\n  🏆 OVERALL: ${overallSuccess ? '✅ SUCCESS - Intelligence flow is working!' : '⚠️ PARTIAL - Some data missing'}`);
      
    } else {
      console.log('❌ Intelligence summary failed');
      console.log('Error:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('=====================================\n');
    
    if (error.response) {
      // Server responded with error
      console.error('Server Error:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else if (error.request) {
      // No response received
      console.error('No response from server. Is the backend running on port 5001?');
      console.error('Try running: cd backend && npm run dev');
    } else {
      // Other error
      console.error('Error:', error.message);
    }
    
    console.error('\n💡 TROUBLESHOOTING TIPS:');
    console.error('1. Ensure backend is running: cd backend && npm run dev');
    console.error('2. Check database connection');
    console.error('3. Verify intelligence_targets table has data');
    console.error('4. Check console logs in backend for detailed errors');
  }
}

// Run the test
console.log('🚀 Starting Intelligence Flow Test...\n');
testIntelligenceFlow()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Test error:', err);
    process.exit(1);
  });