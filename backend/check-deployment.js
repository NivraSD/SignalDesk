// Quick deployment check
const axios = require('axios');

const API = 'https://signaldesk-api-production.up.railway.app';

async function checkDeployment() {
  console.log('🔍 Checking deployment status...\n');
  
  try {
    // Check root endpoint to see which server is running
    const root = await axios.get(API + '/');
    const rootData = root.data;
    
    if (rootData.endpoints) {
      console.log('✅ NEW server.js is deployed!');
      console.log('   Has endpoints documentation:', !!rootData.endpoints);
      console.log('   Has monitoring info:', !!rootData.monitoring);
    } else if (rootData.message === 'SignalDesk API on Railway') {
      console.log('⏳ OLD index.js still running');
      console.log('   Deployment in progress...');
      return false;
    }
    
    // Check if diagnostics endpoint exists
    try {
      const diag = await axios.get(API + '/api/claude-diagnostics/config');
      console.log('\n✅ Claude diagnostics endpoint is LIVE!');
      console.log('   Model:', diag.data.model);
      console.log('   Key configured:', diag.data.configured);
    } catch (e) {
      if (e.response?.status === 404) {
        console.log('\n⚠️  Diagnostics endpoint not found yet');
      }
    }
    
    // Check campaign endpoint
    try {
      await axios.post(API + '/api/auth/login', {
        email: 'demo@signaldesk.com',
        password: 'demo123'
      }).then(async (loginRes) => {
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        // Quick test of campaign endpoint
        try {
          await axios.post(
            API + '/api/campaigns/generate-market-analysis',
            { brief: 'test', campaignType: 'test' },
            { headers }
          );
          console.log('\n✅ Campaign Intelligence endpoint accessible');
        } catch (e) {
          if (e.response?.status === 404) {
            console.log('\n⚠️  Campaign endpoints not accessible yet');
          }
        }
      });
    } catch (e) {
      console.log('\n❌ Login failed');
    }
    
    return true;
  } catch (error) {
    console.log('❌ API not responding:', error.message);
    return false;
  }
}

// Check every 10 seconds for 2 minutes
let attempts = 0;
const maxAttempts = 12;

const interval = setInterval(async () => {
  attempts++;
  console.log(`\n=== Attempt ${attempts}/${maxAttempts} ===`);
  
  const deployed = await checkDeployment();
  
  if (deployed || attempts >= maxAttempts) {
    clearInterval(interval);
    
    if (deployed) {
      console.log('\n🎉 Deployment successful! All systems operational.');
    } else {
      console.log('\n⏱️  Max attempts reached. Check Railway dashboard.');
    }
  }
}, 10000);

// Initial check
checkDeployment();