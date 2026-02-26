/**
 * Script to verify which API URL is being used by the deployed frontend
 * Run this in the browser console on the deployed site
 */

console.log("=== VERIFYING API URL CONFIGURATION ===");
console.log("");

// Check various possible sources
console.log("1. Checking window.SIGNALDESK_API_URL:", window.SIGNALDESK_API_URL);
console.log("2. Checking window.API_BASE_URL:", window.API_BASE_URL);
console.log("3. Checking process.env.REACT_APP_API_URL:", 
  typeof process !== 'undefined' ? process.env?.REACT_APP_API_URL : 'process not available');

// Try to import and check the config
try {
  // This won't work in browser console but shows what to check
  console.log("");
  console.log("To check the actual config being used:");
  console.log("1. Open Developer Tools");
  console.log("2. Go to Sources tab");
  console.log("3. Find src/config/api.js");
  console.log("4. Check what URL is being exported");
} catch (e) {
  // Expected in browser
}

// Check if apiService is available globally (it might not be)
if (typeof apiService !== 'undefined') {
  console.log("");
  console.log("4. ApiService URL:", apiService.apiUrl);
}

// Make a test request to see what URL is actually used
console.log("");
console.log("=== MAKING TEST REQUEST ===");
console.log("Check the Network tab to see which URL is being called");

// Try to make a test fetch
const testUrl = window.SIGNALDESK_API_URL || 'https://signaldesk-production.up.railway.app/api';
fetch(`${testUrl}/health`)
  .then(res => {
    console.log(`✅ Test request to ${testUrl}/health:`, res.status);
    return res.text();
  })
  .then(text => {
    console.log("Response:", text);
  })
  .catch(err => {
    console.error(`❌ Test request failed:`, err);
  });

console.log("");
console.log("=== CHECKING FOR WRONG URL ===");

// Search for wrong URL in page
const pageContent = document.documentElement.innerHTML;
if (pageContent.includes('signaldesk-api-production')) {
  console.error("❌ WRONG URL FOUND IN PAGE!");
  console.error("The page contains references to signaldesk-api-production");
  console.error("This needs to be fixed in Vercel environment variables");
} else {
  console.log("✅ No wrong URLs found in page content");
}

console.log("");
console.log("=== INSTRUCTIONS TO FIX ===");
console.log("If you see the wrong URL (signaldesk-api-production):");
console.log("1. Go to Vercel Dashboard: https://vercel.com");
console.log("2. Select your project");
console.log("3. Settings > Environment Variables");
console.log("4. Update REACT_APP_API_URL to: https://signaldesk-production.up.railway.app/api");
console.log("5. Redeploy without cache");