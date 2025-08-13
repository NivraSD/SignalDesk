#!/usr/bin/env node

const https = require('https');

const urls = [
  'https://signaldesk-api-production.up.railway.app/health',
  'https://signaldesk-api-production.up.railway.app/api/health',
  'https://signaldesk-production.up.railway.app/health',
  'https://signaldesk-production.up.railway.app/api/health'
];

console.log('🚀 Waiting for Railway deployment to come online...');
console.log('Testing multiple possible endpoints...\n');

let attempts = 0;
const maxAttempts = 60; // 10 minutes max

function checkDeployment() {
  attempts++;
  console.log(`--- Attempt ${attempts}/${maxAttempts} ---`);
  
  const checks = urls.map(url => {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ SUCCESS: ${url} is responding!`);
            console.log(`Response: ${data.substring(0, 200)}`);
            resolve(true);
          } else {
            console.log(`❌ ${url}: Status ${res.statusCode}`);
            resolve(false);
          }
        });
      }).on('error', (err) => {
        console.log(`❌ ${url}: ${err.message}`);
        resolve(false);
      });
    });
  });
  
  Promise.all(checks).then(results => {
    if (results.some(r => r === true)) {
      console.log('\n🎉 Deployment is LIVE!');
      process.exit(0);
    } else if (attempts >= maxAttempts) {
      console.log('\n⏱️ Timeout: Deployment did not come online in 10 minutes');
      console.log('Please check Railway dashboard for build logs');
      process.exit(1);
    } else {
      console.log('Waiting 10 seconds before next check...\n');
      setTimeout(checkDeployment, 10000);
    }
  });
}

checkDeployment();