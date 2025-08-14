#!/usr/bin/env node

/**
 * SignalDesk Deployment Verification Script
 * Verifies that all critical components are in place for successful Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SignalDesk Deployment Verification Starting...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('./package.json'),
    fix: 'Ensure package.json is in root directory'
  },
  {
    name: 'Server.js exists',
    check: () => fs.existsSync('./server.js'),
    fix: 'Ensure server.js is in root directory'
  },
  {
    name: 'Index.js exists',
    check: () => fs.existsSync('./index.js'),
    fix: 'Ensure index.js is in root directory'
  },
  {
    name: 'Dockerfile exists',
    check: () => fs.existsSync('./Dockerfile'),
    fix: 'Ensure Dockerfile is in root directory'
  },
  {
    name: 'Railway.json configured for Dockerfile',
    check: () => {
      try {
        const config = JSON.parse(fs.readFileSync('./railway.json', 'utf8'));
        return config.build && config.build.builder === 'DOCKERFILE';
      } catch {
        return false;
      }
    },
    fix: 'Update railway.json to use DOCKERFILE builder'
  },
  {
    name: 'Niv routes file exists',
    check: () => fs.existsSync('./backend/src/routes/nivRoutes.js'),
    fix: 'Ensure Niv routes file is present'
  },
  {
    name: 'Niv agent file exists',
    check: () => fs.existsSync('./backend/src/agents/NivPRStrategist.js'),
    fix: 'Ensure Niv agent file is present'
  },
  {
    name: 'Index.js includes Niv routes',
    check: () => {
      try {
        const indexContent = fs.readFileSync('./index.js', 'utf8');
        return indexContent.includes('nivRoutes') && indexContent.includes('/api/niv');
      } catch {
        return false;
      }
    },
    fix: 'Add Niv routes to index.js'
  },
  {
    name: 'Dockerignore allows necessary files',
    check: () => {
      try {
        const dockerignore = fs.readFileSync('./.dockerignore', 'utf8');
        // Should NOT contain wildcard exclusion that would block everything
        return !dockerignore.includes('*\n!package.json');
      } catch {
        return true; // If no dockerignore, that's fine
      }
    },
    fix: 'Update .dockerignore to allow necessary files'
  },
  {
    name: 'Package.json has clean version',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        return pkg.version && !pkg.version.includes('force-rebuild');
      } catch {
        return false;
      }
    },
    fix: 'Clean up package.json version number'
  }
];

let allPassed = true;
let passedCount = 0;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  const number = (index + 1).toString().padStart(2, ' ');
  
  console.log(`${status} ${number}. ${check.name}`);
  
  if (!passed) {
    console.log(`    💡 Fix: ${check.fix}`);
    allPassed = false;
  } else {
    passedCount++;
  }
});

console.log(`\n📊 Results: ${passedCount}/${checks.length} checks passed`);

if (allPassed) {
  console.log('\n🎉 All deployment checks passed!');
  console.log('🚀 Your SignalDesk deployment should work correctly on Railway.');
  console.log('\n📋 To deploy:');
  console.log('   1. Commit all changes to git');
  console.log('   2. Push to your Railway-connected repository');
  console.log('   3. Railway will use Dockerfile for build');
  console.log('   4. Niv routes will be included and accessible at /api/niv/*');
} else {
  console.log('\n⚠️  Some deployment checks failed.');
  console.log('   Please fix the issues above before deploying.');
}

console.log('\n🔗 Key endpoints that will be available:');
console.log('   - GET  /api/health (health check)');
console.log('   - POST /api/niv/chat (Niv AI chat)');
console.log('   - GET  /api/niv/capabilities (Niv capabilities)');
console.log('   - GET  /api/niv/health (Niv health check)');
console.log('   - GET  /api/niv/history/:id (conversation history)');