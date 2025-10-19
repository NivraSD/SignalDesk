// Monitor Railway deployment and test Claude features
const axios = require('axios');

const API_BASE = 'https://signaldesk-api-production.up.railway.app/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDeployment() {
  log('🚀 Checking Railway deployment status...', 'blue');
  
  try {
    // Check if diagnostics endpoint is available
    const response = await axios.get(`${API_BASE}/claude-diagnostics/config`, {
      timeout: 5000
    });
    
    if (response.data) {
      log('✅ Diagnostics endpoint is live!', 'green');
      console.log('Configuration:', response.data);
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      log('⏳ Deployment still in progress...', 'yellow');
    } else if (error.response?.status === 404) {
      log('⚠️  Endpoint not found - deployment may be in progress', 'yellow');
    } else {
      log(`❌ Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testAllFeatures() {
  log('\n📊 Testing all Claude features...', 'blue');
  
  try {
    const response = await axios.get(`${API_BASE}/claude-diagnostics/test-all`);
    const results = response.data;
    
    log('\n=== Test Results ===', 'blue');
    
    if (results.features) {
      Object.entries(results.features).forEach(([feature, result]) => {
        const status = result.status === 'working' ? '✅' : '❌';
        const color = result.status === 'working' ? 'green' : 'red';
        log(`${status} ${feature}: ${result.status}`, color);
        if (result.response) {
          console.log(`   Response preview: ${result.response.substring(0, 50)}...`);
        }
      });
    }
    
    if (results.summary) {
      log('\n📈 Summary:', 'blue');
      log(`   Working: ${results.summary.workingFeatures}/${results.summary.totalFeatures}`, 
          results.summary.percentWorking === 100 ? 'green' : 'yellow');
      log(`   Success Rate: ${results.summary.percentWorking}%`, 
          results.summary.percentWorking === 100 ? 'green' : 'yellow');
    }
    
    return results.summary?.percentWorking === 100;
  } catch (error) {
    log(`❌ Failed to test features: ${error.message}`, 'red');
    return false;
  }
}

async function monitorAndTest() {
  log('🔄 Starting deployment monitor...', 'blue');
  log('This usually takes 2-3 minutes for Railway to deploy\n', 'yellow');
  
  let attempts = 0;
  const maxAttempts = 20; // 20 attempts * 10 seconds = ~3.3 minutes max
  
  // Wait for deployment
  while (attempts < maxAttempts) {
    attempts++;
    log(`Attempt ${attempts}/${maxAttempts}...`, 'blue');
    
    const isDeployed = await checkDeployment();
    
    if (isDeployed) {
      log('\n🎉 Deployment successful!', 'green');
      
      // Wait a bit more for all services to be ready
      log('Waiting 10 seconds for all services to initialize...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Test all features
      const allWorking = await testAllFeatures();
      
      if (allWorking) {
        log('\n✅ All Claude features are working perfectly!', 'green');
      } else {
        log('\n⚠️  Some features need attention', 'yellow');
        log('Check the backend logs for details', 'yellow');
      }
      
      break;
    }
    
    if (attempts < maxAttempts) {
      log('Waiting 10 seconds before next check...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  if (attempts >= maxAttempts) {
    log('\n⏱️  Deployment is taking longer than expected', 'yellow');
    log('You can check Railway dashboard for deployment status', 'yellow');
    log('Or run this script again in a few minutes', 'yellow');
  }
}

// Run the monitor
monitorAndTest().catch(error => {
  log(`\n❌ Monitor failed: ${error.message}`, 'red');
  process.exit(1);
});