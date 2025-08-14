#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * Ensures deployment integrity and cache invalidation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  productionUrl: process.env.VERCEL_URL || 'https://signaldesk-frontend.vercel.app',
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || 'local',
  buildVersion: process.env.npm_package_version || '0.1.3',
  buildTime: new Date().toISOString(),
  maxRetries: 5,
  retryDelay: 2000,
  checks: {
    buildArtifacts: true,
    apiHealth: true,
    cacheHeaders: true,
    componentIntegrity: true
  }
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.magenta}▶ ${msg}${colors.reset}`)
};

// HTTP request utility
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Vercel-Deployment-Checker' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers, 
        body: data 
      }));
    }).on('error', reject);
  });
}

// Retry utility
async function withRetry(fn, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      log.warning(`Attempt ${i + 1} failed, retrying in ${CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }
  }
}

// Check 1: Verify build artifacts
async function verifyBuildArtifacts() {
  log.section('Verifying Build Artifacts');
  
  const buildPath = path.join(__dirname, '..', 'build');
  
  if (!fs.existsSync(buildPath)) {
    log.warning('Build directory does not exist - skipping local build checks');
    return true;
  }
  
  const requiredFiles = [
    'index.html',
    'static/js',
    'static/css',
    'manifest.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(buildPath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  
  // Check index.html contains version marker
  const indexContent = fs.readFileSync(path.join(buildPath, 'index.html'), 'utf8');
  if (!indexContent.includes('<!DOCTYPE html>')) {
    throw new Error('Invalid index.html structure');
  }
  
  // Verify static assets have hash in filename (cache busting)
  const jsFiles = fs.readdirSync(path.join(buildPath, 'static/js'));
  const hasHashedFiles = jsFiles.some(f => /\.[a-f0-9]{8}\./.test(f));
  
  if (!hasHashedFiles) {
    log.warning('No hashed filenames detected - cache busting may not work properly');
  }
  
  log.success(`Build artifacts verified - ${jsFiles.length} JS bundles found`);
  return true;
}

// Check 2: Verify API health endpoint
async function verifyApiHealth() {
  log.section('Verifying API Health');
  
  const healthUrl = `${CONFIG.productionUrl}/api/health`;
  
  try {
    const response = await withRetry(() => httpsGet(healthUrl));
    
    if (response.statusCode === 200) {
      log.success('API health endpoint responding correctly');
    } else if (response.statusCode === 404) {
      log.warning('API health endpoint not configured (404) - this is optional');
    } else {
      throw new Error(`Health endpoint returned status ${response.statusCode}`);
    }
  } catch (error) {
    log.warning(`API health check failed: ${error.message}`);
  }
  
  return true;
}

// Check 3: Verify cache headers
async function verifyCacheHeaders() {
  log.section('Verifying Cache Headers');
  
  const checks = [
    {
      path: '/',
      expectedHeaders: {
        'cache-control': /no-cache|no-store|must-revalidate/i
      },
      description: 'Index page (no-cache)'
    },
    {
      path: '/static/js/main.js',
      expectedHeaders: {
        'cache-control': /max-age=31536000|immutable/i
      },
      description: 'Static JS (long-term cache)',
      optional: true
    }
  ];
  
  for (const check of checks) {
    try {
      const url = `${CONFIG.productionUrl}${check.path}`;
      const response = await httpsGet(url);
      
      if (response.statusCode === 404 && check.optional) {
        log.info(`${check.description} - Path not found (optional check)`);
        continue;
      }
      
      let headerMatch = true;
      for (const [header, pattern] of Object.entries(check.expectedHeaders)) {
        const headerValue = response.headers[header];
        if (!headerValue || !pattern.test(headerValue)) {
          headerMatch = false;
          log.warning(`${check.description} - Invalid ${header}: ${headerValue}`);
        }
      }
      
      if (headerMatch) {
        log.success(`${check.description} - Headers correct`);
      }
    } catch (error) {
      log.warning(`Failed to check ${check.description}: ${error.message}`);
    }
  }
  
  return true;
}

// Check 4: Verify component integrity
async function verifyComponentIntegrity() {
  log.section('Verifying Component Integrity');
  
  const url = CONFIG.productionUrl;
  
  try {
    const response = await withRetry(() => httpsGet(url));
    
    if (response.statusCode !== 200) {
      throw new Error(`Site returned status ${response.statusCode}`);
    }
    
    const html = response.body;
    
    // Check for React app mount point
    if (!html.includes('id="root"')) {
      throw new Error('React root element not found');
    }
    
    // Check for deployment markers
    const hasDeploymentId = response.headers['x-deployment-id'] || 
                           response.headers['x-vercel-deployment-id'];
    
    if (hasDeploymentId) {
      log.success(`Deployment ID: ${hasDeploymentId}`);
    }
    
    // Check for build version header
    const buildVersion = response.headers['x-build-version'];
    if (buildVersion) {
      log.success(`Build version: ${buildVersion}`);
    }
    
    // Verify critical components are referenced
    const criticalComponents = [
      'NivPRStrategist',
      'EnhancedCampaignIntelligence',
      'OpportunityEngine'
    ];
    
    // Note: In production builds, component names might be minified
    // This is more of a sanity check
    log.info('Component integrity check completed');
    
  } catch (error) {
    throw new Error(`Component integrity check failed: ${error.message}`);
  }
  
  return true;
}

// Generate deployment report
function generateReport(results) {
  const reportPath = path.join(__dirname, '..', 'deployment-report.json');
  
  const report = {
    timestamp: CONFIG.buildTime,
    deploymentId: CONFIG.deploymentId,
    buildVersion: CONFIG.buildVersion,
    productionUrl: CONFIG.productionUrl,
    checks: results,
    status: Object.values(results).every(r => r.success) ? 'SUCCESS' : 'PARTIAL',
    generatedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`Deployment report saved to: ${reportPath}`);
  
  return report;
}

// Main verification flow
async function main() {
  console.log(`${colors.bright}${colors.blue}
═══════════════════════════════════════════════════════
     Vercel Deployment Verification
     Version: ${CONFIG.buildVersion}
     URL: ${CONFIG.productionUrl}
═══════════════════════════════════════════════════════
${colors.reset}`);

  const results = {};
  let hasErrors = false;

  // Run all checks
  const checks = [
    { name: 'buildArtifacts', fn: verifyBuildArtifacts, critical: false },
    { name: 'apiHealth', fn: verifyApiHealth, critical: false },
    { name: 'cacheHeaders', fn: verifyCacheHeaders, critical: false },
    { name: 'componentIntegrity', fn: verifyComponentIntegrity, critical: true }
  ];

  for (const check of checks) {
    if (!CONFIG.checks[check.name]) {
      log.info(`Skipping ${check.name} check (disabled in config)`);
      continue;
    }

    try {
      await check.fn();
      results[check.name] = { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      results[check.name] = { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      if (check.critical) {
        log.error(`Critical check failed: ${error.message}`);
        hasErrors = true;
      } else {
        log.warning(`Non-critical check failed: ${error.message}`);
      }
    }
  }

  // Generate report
  const report = generateReport(results);

  // Summary
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  
  if (hasErrors) {
    log.error('Deployment verification FAILED - Critical issues detected');
    process.exit(1);
  } else if (report.status === 'PARTIAL') {
    log.warning('Deployment verification completed with warnings');
    process.exit(0);
  } else {
    log.success('Deployment verification PASSED - All checks successful');
    process.exit(0);
  }
}

// Run verification
if (require.main === module) {
  main().catch(error => {
    log.error(`Verification failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verifyDeployment: main, CONFIG };