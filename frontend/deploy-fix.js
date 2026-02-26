#!/usr/bin/env node
/**
 * Emergency Deployment Fix Script
 * Addresses immediate caching and build issues
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment fix...');

// 1. Generate build timestamp for cache busting
const buildTimestamp = Date.now();
const buildId = `build_${buildTimestamp}`;

// 2. Update package.json with build metadata
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (!packageJson.scripts.prebuild) {
  packageJson.scripts.prebuild = `echo 'Starting build with timestamp: ${buildTimestamp}'`;
}

// Add build metadata
packageJson.buildMeta = {
  timestamp: buildTimestamp,
  buildId: buildId,
  nodeVersion: process.version
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

// 3. Create cache-busting headers config
const vercelConfig = {
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "headers": [
    {
      "source": "/static/js/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Build-Id", 
          "value": buildId
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_BUILD_ID": buildId,
    "REACT_APP_BUILD_TIME": buildTimestamp.toString()
  }
};

fs.writeFileSync(path.join(__dirname, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));

console.log(`✅ Build configuration updated with ID: ${buildId}`);
console.log('✅ Cache-busting headers configured');
console.log('✅ Ready for deployment');

// 4. Create utils directory if it doesn't exist
const utilsPath = path.join(__dirname, 'src', 'utils');
if (!fs.existsSync(utilsPath)) {
  fs.mkdirSync(utilsPath, { recursive: true });
}

// 5. Create deployment verification script
const verifyScript = `export const BUILD_INFO = {
  buildId: '${buildId}',
  buildTime: ${buildTimestamp},
  version: '${packageJson.version}'
};

export const verifyDeployment = () => {
  console.log('🔍 Deployment Verification:', BUILD_INFO);
  return BUILD_INFO;
};
`;

fs.writeFileSync(path.join(utilsPath, 'deploymentInfo.js'), verifyScript);

console.log('🎯 Next steps:');
console.log('1. Run: git add . && git commit -m "Fix deployment caching and build consistency"');
console.log('2. Run: git push origin main');
console.log('3. Check Vercel deployment dashboard');
console.log('4. Verify build ID in browser console');