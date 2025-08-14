#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Checks all required environment variables and configurations
 */

const fs = require('fs');
const path = require('path');

// Required environment variables for different environments
const ENV_REQUIREMENTS = {
  production: {
    frontend: [
      'REACT_APP_SUPABASE_URL',
      'REACT_APP_SUPABASE_ANON_KEY',
      'REACT_APP_API_URL'
    ],
    vercel: [
      'VERCEL_ENV',
      'VERCEL_URL',
      'VERCEL_DEPLOYMENT_ID'
    ]
  },
  development: {
    frontend: [
      'REACT_APP_SUPABASE_URL',
      'REACT_APP_SUPABASE_ANON_KEY'
    ]
  }
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}▶ ${msg}${colors.reset}`)
};

// Check if environment variable exists
function checkEnvVar(varName, required = true) {
  const value = process.env[varName];
  
  if (value) {
    // Mask sensitive values
    const displayValue = varName.includes('KEY') || varName.includes('SECRET') 
      ? value.substring(0, 10) + '...' 
      : value;
    log.success(`${varName}: ${displayValue}`);
    return true;
  } else if (required) {
    log.error(`${varName}: NOT SET (required)`);
    return false;
  } else {
    log.warning(`${varName}: NOT SET (optional)`);
    return true;
  }
}

// Check .env files
function checkEnvFiles() {
  log.section('Checking Environment Files');
  
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.production.local'
  ];
  
  let foundAny = false;
  
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      log.success(`${file} found (${stats.size} bytes)`);
      foundAny = true;
      
      // Parse and validate content
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const vars = {};
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key] = trimmed.split('=');
          if (key) vars[key.trim()] = true;
        }
      });
      
      log.info(`  Contains ${Object.keys(vars).length} variables`);
    } else {
      log.info(`${file} not found`);
    }
  }
  
  if (!foundAny) {
    log.warning('No .env files found - using system environment variables');
  }
  
  return true;
}

// Check Vercel configuration
function checkVercelConfig() {
  log.section('Checking Vercel Configuration');
  
  // Check vercel.json
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    const config = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    log.success('vercel.json found');
    
    // Check important settings
    if (config.buildCommand) {
      log.info(`  Build command: ${config.buildCommand}`);
    }
    if (config.outputDirectory) {
      log.info(`  Output directory: ${config.outputDirectory}`);
    }
    if (config.framework) {
      log.info(`  Framework: ${config.framework}`);
    }
    if (config.regions) {
      log.info(`  Regions: ${config.regions.join(', ')}`);
    }
  } else {
    log.error('vercel.json not found');
    return false;
  }
  
  // Check .vercel directory
  const vercelDir = path.join(process.cwd(), '.vercel');
  if (fs.existsSync(vercelDir)) {
    log.success('.vercel directory found (project linked)');
    
    const projectJsonPath = path.join(vercelDir, 'project.json');
    if (fs.existsSync(projectJsonPath)) {
      const project = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
      log.info(`  Project ID: ${project.projectId}`);
      log.info(`  Project Name: ${project.projectName || 'N/A'}`);
    }
  } else {
    log.warning('.vercel directory not found (project not linked)');
    log.info('  Run: vercel link');
  }
  
  return true;
}

// Check build configuration
function checkBuildConfig() {
  log.section('Checking Build Configuration');
  
  // Check package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error('package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  log.success(`Package: ${packageJson.name}@${packageJson.version}`);
  
  // Check build scripts
  const requiredScripts = ['build', 'build:vercel'];
  const scripts = packageJson.scripts || {};
  
  for (const script of requiredScripts) {
    if (scripts[script]) {
      log.success(`Script '${script}' defined`);
    } else {
      log.warning(`Script '${script}' not defined`);
    }
  }
  
  // Check React version
  const deps = packageJson.dependencies || {};
  if (deps.react) {
    log.info(`  React version: ${deps.react}`);
  }
  if (deps['react-scripts']) {
    log.info(`  React Scripts: ${deps['react-scripts']}`);
  }
  
  return true;
}

// Check API configuration
function checkApiConfig() {
  log.section('Checking API Configuration');
  
  const apiUrl = process.env.REACT_APP_API_URL;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  let hasIssues = false;
  
  if (!supabaseUrl) {
    log.error('REACT_APP_SUPABASE_URL not set');
    hasIssues = true;
  } else {
    log.success(`Supabase URL: ${supabaseUrl}`);
  }
  
  if (!supabaseKey) {
    log.error('REACT_APP_SUPABASE_ANON_KEY not set');
    hasIssues = true;
  } else {
    log.success(`Supabase Key: ${supabaseKey.substring(0, 20)}...`);
  }
  
  if (apiUrl) {
    log.success(`API URL: ${apiUrl}`);
  } else {
    log.warning('REACT_APP_API_URL not set (using Supabase functions)');
  }
  
  return !hasIssues;
}

// Generate environment template
function generateEnvTemplate() {
  log.section('Generating Environment Template');
  
  const template = `# SignalDesk Frontend Environment Variables
# Copy this file to .env.local and fill in your values

# Supabase Configuration (Required)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (Optional - defaults to Supabase functions)
REACT_APP_API_URL=https://your-api-url.com

# Build Configuration (Set automatically during build)
REACT_APP_BUILD_VERSION=
REACT_APP_BUILD_TIME=

# Feature Flags (Optional)
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=false
`;

  const envExamplePath = path.join(process.cwd(), '.env.example');
  fs.writeFileSync(envExamplePath, template);
  log.success(`Environment template saved to: .env.example`);
}

// Main validation
async function main() {
  console.log(`${colors.bright}${colors.blue}
═══════════════════════════════════════════════════════
     Environment Configuration Validator
     Environment: ${process.env.NODE_ENV || 'development'}
═══════════════════════════════════════════════════════
${colors.reset}`);

  const results = {
    envFiles: checkEnvFiles(),
    vercelConfig: checkVercelConfig(),
    buildConfig: checkBuildConfig(),
    apiConfig: checkApiConfig()
  };
  
  // Check required environment variables
  log.section('Checking Required Environment Variables');
  
  const env = process.env.VERCEL_ENV || 'development';
  const requirements = ENV_REQUIREMENTS[env] || ENV_REQUIREMENTS.development;
  
  let allVarsSet = true;
  for (const varName of requirements.frontend) {
    if (!checkEnvVar(varName)) {
      allVarsSet = false;
    }
  }
  
  // Generate template if needed
  if (!allVarsSet) {
    generateEnvTemplate();
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  
  const allPassed = Object.values(results).every(r => r) && allVarsSet;
  
  if (allPassed) {
    log.success('Environment configuration is valid');
    
    console.log(`\n${colors.cyan}Ready to deploy with:${colors.reset}`);
    console.log('  npm run deploy:preview  - Deploy to preview');
    console.log('  npm run deploy:prod     - Deploy to production');
    console.log('  npm run verify:prod     - Verify production deployment');
    
    process.exit(0);
  } else {
    log.error('Environment configuration has issues');
    
    console.log(`\n${colors.yellow}To fix:${colors.reset}`);
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in your Supabase credentials');
    console.log('3. Run: vercel link (if not linked)');
    console.log('4. Set environment variables in Vercel dashboard');
    
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  main().catch(error => {
    log.error(`Validation failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { checkEnvVar, checkEnvFiles, checkVercelConfig };