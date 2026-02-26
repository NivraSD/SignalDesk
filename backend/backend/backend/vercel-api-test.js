#!/usr/bin/env node

/**
 * Vercel Deployment API Test
 * Tests the actual deployed files on Vercel
 */

const https = require('https');
const fs = require('fs');

const DEPLOYMENT_URL = 'signaldesk-frontend-23tc8mlwq-nivra-sd.vercel.app';

console.log('🔍 Vercel Deployment Checker\n');
console.log('========================================\n');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DEPLOYMENT_URL,
      port: 443,
      path: path + '?cachebust=' + Date.now(),
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'SignalDesk-Deployment-Checker/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function checkDeployment() {
  try {
    // 1. Check main page
    console.log('1. Checking main page...');
    const mainPage = await makeRequest('/');
    
    const hasMediaIntelligence = mainPage.body.includes('MediaIntelligence');
    const hasOldBuilder = mainPage.body.includes('MediaListBuilder');
    
    if (hasMediaIntelligence && !hasOldBuilder) {
      console.log('✅ MediaIntelligence component detected!');
    } else if (hasOldBuilder) {
      console.log('❌ WARNING: Old MediaListBuilder still present!');
    } else {
      console.log('⚠️  Could not detect component in main bundle');
    }
    
    // 2. Check cache headers
    console.log('\n2. Cache Headers:');
    console.log('   Cache-Control:', mainPage.headers['cache-control'] || 'Not set');
    console.log('   ETag:', mainPage.headers['etag'] || 'Not set');
    console.log('   Last-Modified:', mainPage.headers['last-modified'] || 'Not set');
    
    // 3. Check version file
    console.log('\n3. Checking version file...');
    try {
      const versionFile = await makeRequest('/version.json');
      if (versionFile.statusCode === 200) {
        const version = JSON.parse(versionFile.body);
        console.log('✅ Version file found:');
        console.log('   Version:', version.version);
        console.log('   Component:', version.component);
        console.log('   Build:', version.build);
      } else {
        console.log('⚠️  Version file not found (404)');
      }
    } catch (e) {
      console.log('❌ Error checking version file:', e.message);
    }
    
    // 4. Check asset manifest
    console.log('\n4. Checking asset manifest...');
    try {
      const manifest = await makeRequest('/asset-manifest.json');
      if (manifest.statusCode === 200) {
        const assets = JSON.parse(manifest.body);
        console.log('✅ Asset manifest found');
        const mainJs = assets.files && assets.files['main.js'];
        if (mainJs) {
          console.log('   Main JS:', mainJs);
          
          // Check the actual JS file
          const jsFile = await makeRequest(mainJs);
          if (jsFile.body.includes('MediaIntelligence')) {
            console.log('   ✅ MediaIntelligence found in built JS!');
          }
          if (jsFile.body.includes('MediaListBuilder')) {
            console.log('   ❌ MediaListBuilder still in built JS!');
          }
        }
      } else {
        console.log('⚠️  Asset manifest not found');
      }
    } catch (e) {
      console.log('❌ Error checking asset manifest:', e.message);
    }
    
    // 5. Deployment info
    console.log('\n5. Deployment Info:');
    console.log('   Server:', mainPage.headers['server'] || 'Unknown');
    console.log('   X-Vercel-Cache:', mainPage.headers['x-vercel-cache'] || 'Not set');
    console.log('   X-Vercel-Id:', mainPage.headers['x-vercel-id'] || 'Not set');
    
    // 6. Recommendations
    console.log('\n========================================');
    console.log('📋 RECOMMENDATIONS:\n');
    
    if (hasOldBuilder) {
      console.log('1. The old component is still being served. Try:');
      console.log('   - Run: vercel --prod --force --no-cache');
      console.log('   - Delete the project in Vercel and re-import');
      console.log('   - Add VERCEL_FORCE_NO_BUILD_CACHE=1 to environment variables');
      console.log('');
      console.log('2. Clear Vercel Edge Cache:');
      console.log('   - Go to Vercel Dashboard > Project Settings');
      console.log('   - Functions Tab > Purge Cache > "Purge Everything"');
      console.log('');
      console.log('3. Force new deployment:');
      console.log('   - Make a small change to package.json (bump version)');
      console.log('   - Commit and push');
      console.log('   - This forces Vercel to rebuild everything');
    } else if (hasMediaIntelligence) {
      console.log('✅ Deployment looks good! MediaIntelligence is active.');
      console.log('   If users still see old version, they need to:');
      console.log('   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('   - Clear browser cache');
      console.log('   - Try incognito/private mode');
    } else {
      console.log('⚠️  Cannot determine deployment status.');
      console.log('   Try accessing: https://' + DEPLOYMENT_URL + '/projects/test/media-list');
      console.log('   Check browser DevTools Network tab for actual files being loaded.');
    }
    
    console.log('\n========================================\n');
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
  }
}

// Run the check
checkDeployment();

// Save results to file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = `vercel-check-${timestamp}.log`;

console.log(`\n📄 Saving results to ${logFile}...`);

// Redirect console to file as well
const originalLog = console.log;
let logContent = '';

console.log = function(...args) {
  logContent += args.join(' ') + '\n';
  originalLog.apply(console, args);
};

// Re-run with logging
setTimeout(() => {
  fs.writeFileSync(logFile, logContent);
  console.log = originalLog;
  console.log(`✅ Results saved to ${logFile}`);
}, 1000);