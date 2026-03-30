#!/usr/bin/env node

/**
 * Vercel Deployment API URL Verification Script
 * This script verifies that the API URL is correctly configured
 * Run this after deployment to verify the configuration
 */

const EXPECTED_API_URL = 'https://signaldesk-production.up.railway.app/api';
const VERCEL_URL = 'https://signaldesk-two.vercel.app';

console.log('========================================');
console.log('VERCEL DEPLOYMENT VERIFICATION');
console.log('========================================');
console.log('Checking:', VERCEL_URL);
console.log('Expected API:', EXPECTED_API_URL);
console.log('');

async function verifyDeployment() {
  try {
    // Step 1: Fetch the deployed app
    console.log('1. Fetching deployed app...');
    const response = await fetch(VERCEL_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch app: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Step 2: Check if the hardcoded API URL is in the bundled JS
    console.log('2. Checking bundled JavaScript...');
    
    // Extract main JS bundle URL
    const jsMatch = html.match(/src="(\/static\/js\/main\.[a-f0-9]+\.js)"/);
    if (!jsMatch) {
      console.warn('Could not find main.js bundle in HTML');
    } else {
      const jsUrl = `${VERCEL_URL}${jsMatch[1]}`;
      console.log('   Found bundle:', jsMatch[1]);
      
      // Fetch the JS bundle
      const jsResponse = await fetch(jsUrl);
      const jsContent = await jsResponse.text();
      
      // Check for the correct API URL
      if (jsContent.includes(EXPECTED_API_URL)) {
        console.log('   ✅ Correct API URL found in bundle!');
      } else if (jsContent.includes('signaldesk-production.up.railway.app')) {
        console.warn('   ⚠️ Railway URL found but might be incomplete');
      } else {
        console.error('   ❌ API URL not found in bundle!');
      }
    }
    
    // Step 3: Test the actual API endpoint
    console.log('3. Testing API endpoint...');
    try {
      const apiResponse = await fetch(`${EXPECTED_API_URL}/health`);
      if (apiResponse.ok) {
        console.log('   ✅ API is accessible and responding');
      } else {
        console.log(`   ⚠️ API responded with status: ${apiResponse.status}`);
      }
    } catch (error) {
      console.error('   ❌ Could not reach API:', error.message);
    }
    
    // Step 4: Test login endpoint
    console.log('4. Testing login endpoint...');
    try {
      const loginResponse = await fetch(`${EXPECTED_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'demo@signaldesk.com',
          password: 'demo123'
        })
      });
      
      if (loginResponse.ok) {
        console.log('   ✅ Login endpoint is working');
        const data = await loginResponse.json();
        if (data.token) {
          console.log('   ✅ Authentication successful!');
        }
      } else {
        console.log(`   ⚠️ Login responded with status: ${loginResponse.status}`);
      }
    } catch (error) {
      console.error('   ❌ Could not test login:', error.message);
    }
    
    console.log('');
    console.log('========================================');
    console.log('VERIFICATION COMPLETE');
    console.log('========================================');
    
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyDeployment();
}

module.exports = { verifyDeployment };