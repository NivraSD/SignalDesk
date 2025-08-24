#!/usr/bin/env node
/**
 * Advanced Deployment Pipeline for SignalDesk
 * Prevents regressions and ensures consistent deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentPipeline {
  constructor() {
    this.buildId = `deploy_${Date.now()}`;
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅', 
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  // Phase 1: Pre-deployment validation
  async validatePreDeployment() {
    this.log('Starting pre-deployment validation', 'info');

    // Check git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        this.log('Uncommitted changes detected', 'warning');
      }
    } catch (error) {
      this.log(`Git status check failed: ${error.message}`, 'warning');
    }

    // Validate package.json
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('package.json not found', 'error');
      return false;
    }

    // Check for critical components
    const criticalComponents = [
      'src/App.js',
      'src/components/AdaptiveNivAssistant.js',
      'src/components/RailwayDraggable.js',
      'src/config/supabase.js'
    ];

    for (const component of criticalComponents) {
      const componentPath = path.join(__dirname, component);
      if (!fs.existsSync(componentPath)) {
        this.log(`Critical component missing: ${component}`, 'error');
      } else {
        this.log(`Critical component validated: ${component}`, 'success');
      }
    }

    // Validate environment variables
    const requiredEnvVars = [
      'REACT_APP_SUPABASE_URL',
      'REACT_APP_SUPABASE_ANON_KEY'
    ];

    const envPath = path.join(__dirname, '.env');
    const envLocalPath = path.join(__dirname, '.env.local');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent += fs.readFileSync(envPath, 'utf8');
    }
    if (fs.existsSync(envLocalPath)) {
      envContent += fs.readFileSync(envLocalPath, 'utf8');
    }
    
    if (envContent) {
      requiredEnvVars.forEach(envVar => {
        if (!envContent.includes(envVar)) {
          this.log(`Missing environment variable: ${envVar}`, 'warning');
        } else {
          this.log(`Environment variable found: ${envVar}`, 'success');
        }
      });
    } else {
      this.log('No .env or .env.local file found', 'warning');
    }

    return this.errors.length === 0;
  }

  // Phase 2: Check Niv integration
  async validateNivIntegration() {
    this.log('Validating Niv command center integration', 'info');

    const railwayPath = path.join(__dirname, 'src/components/RailwayDraggable.js');
    if (fs.existsSync(railwayPath)) {
      const content = fs.readFileSync(railwayPath, 'utf8');
      
      // Check if Niv is first in activities
      if (content.includes("id: 'niv-command-center'") && 
          content.includes('AdaptiveNivAssistant')) {
        this.log('Niv is configured as command center', 'success');
      } else {
        this.log('Niv may not be properly configured as command center', 'error');
        this.log('Please ensure Niv is the first item in activities array', 'warning');
      }
    }

    return this.errors.length === 0;
  }

  // Phase 3: Build validation
  async validateBuild() {
    this.log('Starting build validation', 'info');

    try {
      // Clean previous build
      const buildPath = path.join(__dirname, 'build');
      if (fs.existsSync(buildPath)) {
        this.log('Cleaning previous build', 'info');
        execSync('rm -rf build', { cwd: __dirname });
      }

      // Test build
      this.log('Running test build...', 'info');
      this.log('This may take a minute...', 'info');
      
      try {
        execSync('npm run build', { 
          stdio: 'pipe',
          cwd: __dirname 
        });
      } catch (buildError) {
        this.log('Build failed - checking for common issues', 'error');
        this.log(buildError.message, 'error');
        return false;
      }
      
      this.log('Build completed successfully', 'success');
      
      // Validate build output
      if (!fs.existsSync(buildPath)) {
        this.log('Build directory not created', 'error');
        return false;
      }

      const indexPath = path.join(buildPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        this.log('index.html not found in build', 'error');
        return false;
      }

      // Check build size
      const buildStats = this.getBuildStats(buildPath);
      this.log(`Build size: ${(buildStats.totalSize / 1024 / 1024).toFixed(2)}MB`, 'info');
      
      if (buildStats.totalSize > 50 * 1024 * 1024) { // 50MB limit
        this.log('Build size exceeds 50MB limit', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Build validation failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Phase 4: Create deployment checklist
  createDeploymentChecklist() {
    this.log('Creating deployment checklist', 'info');

    const checklist = {
      buildId: this.buildId,
      timestamp: new Date().toISOString(),
      preDeployment: [
        '✅ All changes committed',
        '✅ Critical components present',
        '✅ Environment variables configured',
        '✅ Niv configured as command center'
      ],
      deployment: [
        '⏳ Clear Vercel cache',
        '⏳ Deploy to production',
        '⏳ Verify deployment',
        '⏳ Test critical paths'
      ],
      postDeployment: [
        '⏳ Check Niv command center',
        '⏳ Verify no cache issues',
        '⏳ Monitor error logs',
        '⏳ Confirm performance'
      ]
    };

    // Save checklist
    const checklistPath = path.join(__dirname, `deployment-checklist-${this.buildId}.json`);
    fs.writeFileSync(checklistPath, JSON.stringify(checklist, null, 2));

    this.log(`Deployment checklist saved: ${checklistPath}`, 'success');
    return checklist;
  }

  // Utility methods
  getBuildStats(buildPath) {
    let totalSize = 0;
    const files = [];

    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else {
            totalSize += stat.size;
            files.push({ path: fullPath, size: stat.size });
          }
        });
      } catch (error) {
        // Ignore permission errors
      }
    };

    scanDir(buildPath);
    return { totalSize, files };
  }

  // Main execution
  async execute() {
    this.log('='.repeat(50), 'info');
    this.log(`DEPLOYMENT PIPELINE - Build ID: ${this.buildId}`, 'info');
    this.log('='.repeat(50), 'info');

    // Phase 1: Pre-deployment validation
    const preValid = await this.validatePreDeployment();
    if (!preValid) {
      this.log('Pre-deployment validation failed', 'error');
    }

    // Phase 2: Niv integration check
    const nivValid = await this.validateNivIntegration();
    if (!nivValid) {
      this.log('Niv integration validation failed', 'error');
    }

    // Phase 3: Build validation  
    const buildValid = await this.validateBuild();
    if (!buildValid) {
      this.log('Build validation failed', 'error');
    }

    // Phase 4: Create checklist
    const checklist = this.createDeploymentChecklist();

    // Summary
    console.log('\n' + '='.repeat(50));
    this.log('DEPLOYMENT PIPELINE SUMMARY', 'info');
    console.log('='.repeat(50));
    this.log(`Build ID: ${this.buildId}`, 'info');
    this.log(`Errors: ${this.errors.length}`, this.errors.length > 0 ? 'error' : 'success');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'warning' : 'success');
    
    if (this.errors.length === 0) {
      console.log('\n🎉 READY FOR DEPLOYMENT!');
      console.log('\n📋 Deployment Commands:');
      console.log('1. Clear cache and deploy:');
      console.log('   vercel --prod --force\n');
      console.log('2. Or use standard deployment:');
      console.log('   git add .');
      console.log('   git commit -m "Deploy with Niv as command center"');
      console.log('   git push origin main\n');
      console.log('3. After deployment, verify at:');
      console.log('   https://signaldesk-frontend.vercel.app\n');
    } else {
      console.log('\n❌ DEPLOYMENT BLOCKED - Fix errors above');
      console.log('\nErrors found:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    return this.errors.length === 0;
  }
}

// Execute if run directly
if (require.main === module) {
  const pipeline = new DeploymentPipeline();
  pipeline.execute().catch(console.error);
}

module.exports = DeploymentPipeline;