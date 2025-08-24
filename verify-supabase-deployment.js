#!/usr/bin/env node

/**
 * Supabase Deployment Verification Script
 * Checks that Supabase is properly integrated in the Vercel deployment
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const DEPLOYMENT_URL = process.env.VERCEL_URL || 'signaldesk-frontend.vercel.app';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
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
  section: (msg) => console.log(`\n${colors.cyan}▶ ${msg}${colors.reset}`)
};

// Check API endpoint
function checkEndpoint(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ 
            success: res.statusCode === 200, 
            status: res.statusCode,
            data: json 
          });
        } catch (e) {
          resolve({ 
            success: false, 
            status: res.statusCode,
            error: 'Invalid JSON response' 
          });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

// Check Supabase connection
async function checkSupabaseConnection() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    // Test database query
    const { data: dbData, error: dbError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    // Test Edge Functions
    const edgeFunctions = [
      'monitor-intelligence',
      'claude-chat',
      'niv-chat'
    ];
    
    const functionResults = await Promise.all(
      edgeFunctions.map(async (func) => {
        try {
          const { data, error } = await supabase.functions.invoke(func, {
            body: { test: true }
          });
          return { 
            function: func, 
            success: !error,
            error: error?.message 
          };
        } catch (e) {
          return { 
            function: func, 
            success: false, 
            error: e.message 
          };
        }
      })
    );
    
    return {
      auth: !authError,
      database: !dbError,
      edgeFunctions: functionResults
    };
  } catch (error) {
    return {
      auth: false,
      database: false,
      edgeFunctions: [],
      error: error.message
    };
  }
}

// Main verification
async function verify() {
  log.section('SignalDesk Supabase Deployment Verification');
  console.log(`Deployment URL: https://${DEPLOYMENT_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  let hasErrors = false;

  // 1. Check Vercel deployment health
  log.section('Checking Vercel Deployment');
  const healthCheck = await checkEndpoint(`https://${DEPLOYMENT_URL}/api/health`);
  if (healthCheck.success) {
    log.success('Vercel deployment is healthy');
    if (healthCheck.data.deployment) {
      log.info(`Environment: ${healthCheck.data.deployment.environment}`);
      log.info(`Deployment ID: ${healthCheck.data.deployment.id}`);
    }
  } else {
    log.error('Vercel deployment health check failed');
    hasErrors = true;
  }

  // 2. Check Supabase API route
  log.section('Checking Supabase Integration API');
  const supabaseApiCheck = await checkEndpoint(`https://${DEPLOYMENT_URL}/api/supabase-check`);
  if (supabaseApiCheck.success && supabaseApiCheck.data.supabase) {
    log.success('Supabase API route is operational');
    const supabaseStatus = supabaseApiCheck.data.supabase;
    
    if (supabaseStatus.connected) {
      log.success('Supabase client connected');
    } else {
      log.error('Supabase client not connected');
      hasErrors = true;
    }
    
    if (supabaseStatus.authStatus === 'operational') {
      log.success('Supabase Auth is operational');
    } else {
      log.warning(`Supabase Auth issue: ${supabaseStatus.authError || 'Unknown'}`);
    }
    
    if (supabaseStatus.dbStatus === 'operational') {
      log.success('Supabase Database is accessible');
    } else {
      log.warning(`Database issue: ${supabaseStatus.dbError || 'Unknown'}`);
    }
  } else {
    log.error('Supabase API route not found or errored');
    log.warning('Make sure /api/supabase-check.js is deployed');
    hasErrors = true;
  }

  // 3. Direct Supabase connection test
  log.section('Direct Supabase Connection Test');
  const directCheck = await checkSupabaseConnection();
  
  if (directCheck.auth) {
    log.success('Direct Auth connection successful');
  } else {
    log.warning('Direct Auth connection failed (may need authentication)');
  }
  
  if (directCheck.database) {
    log.success('Direct Database connection successful');
  } else {
    log.warning('Direct Database connection failed (may need proper RLS policies)');
  }
  
  // Check Edge Functions
  if (directCheck.edgeFunctions && directCheck.edgeFunctions.length > 0) {
    log.section('Edge Functions Status');
    directCheck.edgeFunctions.forEach(func => {
      if (func.success) {
        log.success(`Edge Function '${func.function}' is deployed`);
      } else {
        log.warning(`Edge Function '${func.function}' not deployed or errored: ${func.error}`);
      }
    });
  }

  // 4. Check frontend bundle
  log.section('Checking Frontend Bundle');
  const appCheck = await checkEndpoint(`https://${DEPLOYMENT_URL}/`);
  if (appCheck.success) {
    log.success('Frontend is accessible');
    
    // Check if Supabase is in the bundle
    const response = await new Promise((resolve) => {
      https.get(`https://${DEPLOYMENT_URL}/`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', () => resolve(''));
    });
    
    if (response.includes('supabase')) {
      log.success('Supabase SDK detected in frontend bundle');
    } else {
      log.warning('Supabase SDK not detected in frontend HTML (check JS bundles)');
    }
  } else {
    log.error('Frontend not accessible');
    hasErrors = true;
  }

  // Summary
  console.log('');
  log.section('Verification Summary');
  
  if (!hasErrors) {
    console.log(`${colors.green}✅ All checks passed! Supabase is properly integrated.${colors.reset}`);
    console.log('');
    log.info('Next steps:');
    console.log('  1. Deploy Edge Functions: cd frontend/supabase && ./deploy-functions.sh');
    console.log('  2. Test authentication flow');
    console.log('  3. Monitor error logs: vercel logs');
  } else {
    console.log(`${colors.red}❌ Some checks failed. Review the issues above.${colors.reset}`);
    console.log('');
    log.info('Troubleshooting steps:');
    console.log('  1. Run: ./setup-vercel-env.sh');
    console.log('  2. Ensure package.json has @supabase/supabase-js in dependencies');
    console.log('  3. Redeploy: vercel --prod --force');
    console.log('  4. Check logs: vercel logs --follow');
    process.exit(1);
  }
}

// Run verification
verify().catch(error => {
  log.error(`Verification failed: ${error.message}`);
  process.exit(1);
});