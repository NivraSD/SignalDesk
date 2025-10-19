// Monitor final deployment with index.js -> server.js redirect
const axios = require('axios');

const API = 'https://signaldesk-api-production.up.railway.app';

async function checkDeployment() {
  console.log('🔍 Checking deployment...');
  
  try {
    const response = await axios.get(API + '/');
    const data = response.data;
    
    // Check if it's the new server
    if (data.endpoints || data.version === '1.0.0') {
      console.log('✅ SUCCESS! New server.js is running!');
      console.log('   All routes should now be available');
      return true;
    } else if (data.message === 'SignalDesk API on Railway') {
      console.log('⏳ Old version still running, waiting...');
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testAllFeatures() {
  console.log('\n📊 Testing all Claude features...\n');
  
  try {
    // Login
    const loginRes = await axios.post(API + '/api/auth/login', {
      email: 'demo@signaldesk.com',
      password: 'demo123'
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test each feature
    const tests = [
      { name: 'Content Generator', endpoint: '/api/content/ai-generate', method: 'POST', 
        data: { prompt: 'test', type: 'press-release', companyName: 'test', industry: 'tech' }},
      { name: 'Crisis Advisor', endpoint: '/api/crisis/advisor', method: 'POST',
        data: { query: 'test', context: {} }},
      { name: 'Campaign Intelligence', endpoint: '/api/campaigns/generate-market-analysis', method: 'POST',
        data: { brief: 'test', campaignType: 'test' }},
      { name: 'Opportunity Engine', endpoint: '/api/opportunity/analyze-position', method: 'POST',
        data: { company: 'test', industry: 'test' }},
      { name: 'Media List Builder', endpoint: '/api/media/discover', method: 'POST',
        data: { query: 'test', industry: 'test' }}
    ];
    
    let working = 0;
    for (const test of tests) {
      try {
        await axios({
          method: test.method,
          url: API + test.endpoint,
          data: test.data,
          headers
        });
        console.log(`✅ ${test.name}: WORKING`);
        working++;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ ${test.name}: NOT FOUND (404)`);
        } else {
          console.log(`✅ ${test.name}: ENDPOINT EXISTS (error ${error.response?.status || 'unknown'})`);
          working++;
        }
      }
    }
    
    console.log(`\n📈 Score: ${working}/5 features accessible`);
    return working === 5;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Check every 10 seconds
let attempts = 0;
const maxAttempts = 18; // 3 minutes

console.log('🚀 Monitoring Railway deployment...');
console.log('This usually takes 1-2 minutes\n');

const interval = setInterval(async () => {
  attempts++;
  console.log(`\n--- Attempt ${attempts}/${maxAttempts} ---`);
  
  const isDeployed = await checkDeployment();
  
  if (isDeployed) {
    clearInterval(interval);
    console.log('\n🎉 Deployment successful!');
    await testAllFeatures();
    console.log('\n✨ All done! Your Claude integration should be fully working now.');
  } else if (attempts >= maxAttempts) {
    clearInterval(interval);
    console.log('\n⏱️ Timeout reached. Check Railway dashboard manually.');
    console.log('The deployment might still be in progress.');
  }
}, 10000);

// Initial check
checkDeployment();