#!/usr/bin/env node

/**
 * Comprehensive Supabase Connection Tester
 * Tests all aspects of your Supabase setup including:
 * - Database connection
 * - Authentication
 * - Edge Functions
 * - Real-time subscriptions
 * - Table access and RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Configuration
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

// Test email and password (you'll need to provide these)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.magenta}━━━ ${msg} ━━━${colors.reset}\n`),
};

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Test results collector
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
};

// Test functions
async function testBasicConnection() {
  log.section('Testing Basic Connection');
  
  try {
    // Test if we can reach Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    if (response.ok) {
      log.success('Basic connection to Supabase successful');
      testResults.passed.push('Basic Connection');
      return true;
    } else {
      log.error(`Connection failed with status: ${response.status}`);
      testResults.failed.push('Basic Connection');
      return false;
    }
  } catch (error) {
    log.error(`Connection error: ${error.message}`);
    testResults.failed.push('Basic Connection');
    return false;
  }
}

async function testDatabaseTables() {
  log.section('Testing Database Tables');
  
  const tables = [
    'users',
    'organizations',
    'projects',
    'content',
    'intelligence_targets',
    'intelligence_findings',
    'monitoring_runs',
    'opportunity_queue',
    'memoryvault_items',
    'campaign_intelligence',
    'adaptive_learning',
  ];
  
  for (const table of tables) {
    try {
      log.test(`Checking table: ${table}`);
      
      // Try to query the table (limited to 1 row to be fast)
      const { data, error, status } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          log.error(`Table '${table}' does not exist`);
          testResults.failed.push(`Table: ${table}`);
        } else if (error.message.includes('permission denied') || error.message.includes('Row Level Security')) {
          log.warning(`Table '${table}' exists but RLS is blocking access (this might be expected)`);
          testResults.warnings.push(`Table: ${table} (RLS)`);
        } else {
          log.error(`Table '${table}' error: ${error.message}`);
          testResults.failed.push(`Table: ${table}`);
        }
      } else {
        log.success(`Table '${table}' is accessible`);
        testResults.passed.push(`Table: ${table}`);
        
        // If we got data, show the columns
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          log.info(`  Columns: ${columns.join(', ')}`);
        }
      }
    } catch (error) {
      log.error(`Unexpected error testing table '${table}': ${error.message}`);
      testResults.failed.push(`Table: ${table}`);
    }
  }
}

async function testAuthentication() {
  log.section('Testing Authentication');
  
  try {
    // First, check if we can access auth endpoints
    log.test('Checking auth endpoint availability');
    const authHealthCheck = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    if (authHealthCheck.ok) {
      log.success('Auth endpoint is healthy');
      testResults.passed.push('Auth Endpoint');
    } else {
      log.error('Auth endpoint is not responding correctly');
      testResults.failed.push('Auth Endpoint');
      return;
    }
    
    // Try to sign up a test user (this might fail if user exists)
    log.test('Testing user signup/signin');
    
    // First try to sign in (in case user exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (signInData && signInData.user) {
      log.success(`User signed in successfully: ${signInData.user.email}`);
      testResults.passed.push('Authentication');
      
      // Test sign out
      const { error: signOutError } = await supabase.auth.signOut();
      if (!signOutError) {
        log.success('Sign out successful');
        testResults.passed.push('Sign Out');
      } else {
        log.error(`Sign out error: ${signOutError.message}`);
        testResults.failed.push('Sign Out');
      }
    } else if (signInError) {
      log.warning(`Sign in failed: ${signInError.message}`);
      
      // Try to sign up if sign in failed
      log.test('Attempting to create new test user');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            username: 'testuser',
          },
        },
      });
      
      if (signUpData && signUpData.user) {
        log.success(`Test user created: ${signUpData.user.email}`);
        log.warning('User needs email confirmation to sign in');
        testResults.warnings.push('Authentication (needs email confirmation)');
      } else if (signUpError) {
        log.error(`Sign up error: ${signUpError.message}`);
        testResults.failed.push('Authentication');
      }
    }
  } catch (error) {
    log.error(`Authentication test error: ${error.message}`);
    testResults.failed.push('Authentication');
  }
}

async function testEdgeFunctions() {
  log.section('Testing Edge Functions');
  
  const edgeFunctions = [
    { name: 'claude-integration', payload: { prompt: 'test' } },
    { name: 'monitor-intelligence', payload: { organizationId: 'test-org' } },
  ];
  
  for (const func of edgeFunctions) {
    try {
      log.test(`Testing edge function: ${func.name}`);
      
      // First check if the function exists
      const functionUrl = `${SUPABASE_URL}/functions/v1/${func.name}`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(func.payload),
      });
      
      if (response.status === 404) {
        log.error(`Edge function '${func.name}' not found - needs deployment`);
        testResults.failed.push(`Edge Function: ${func.name}`);
      } else if (response.status === 401) {
        log.error(`Edge function '${func.name}' - authentication required`);
        testResults.failed.push(`Edge Function: ${func.name}`);
      } else if (response.status === 500) {
        const errorText = await response.text();
        log.error(`Edge function '${func.name}' - internal error: ${errorText}`);
        testResults.failed.push(`Edge Function: ${func.name}`);
      } else if (response.ok) {
        log.success(`Edge function '${func.name}' is accessible`);
        testResults.passed.push(`Edge Function: ${func.name}`);
        
        const data = await response.json();
        log.info(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        log.warning(`Edge function '${func.name}' returned status: ${response.status}`);
        testResults.warnings.push(`Edge Function: ${func.name}`);
      }
    } catch (error) {
      log.error(`Edge function '${func.name}' test error: ${error.message}`);
      testResults.failed.push(`Edge Function: ${func.name}`);
    }
  }
}

async function testRealtime() {
  log.section('Testing Realtime Subscriptions');
  
  try {
    log.test('Creating realtime channel');
    
    const channel = supabase
      .channel('test-channel')
      .on('presence', { event: 'sync' }, () => {
        log.info('Presence sync received');
      })
      .on('broadcast', { event: 'test' }, (payload) => {
        log.info(`Broadcast received: ${JSON.stringify(payload)}`);
      });
    
    const status = await new Promise((resolve) => {
      channel.subscribe((status) => {
        resolve(status);
      });
    });
    
    if (status === 'SUBSCRIBED') {
      log.success('Realtime subscription successful');
      testResults.passed.push('Realtime Subscription');
      
      // Test broadcast
      log.test('Testing broadcast');
      await channel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'Hello from test' },
      });
      
      log.success('Broadcast sent successfully');
      testResults.passed.push('Realtime Broadcast');
      
      // Cleanup
      await supabase.removeChannel(channel);
    } else {
      log.error(`Realtime subscription failed with status: ${status}`);
      testResults.failed.push('Realtime Subscription');
    }
  } catch (error) {
    log.error(`Realtime test error: ${error.message}`);
    testResults.failed.push('Realtime');
  }
}

async function testRLSPolicies() {
  log.section('Testing Row Level Security (RLS)');
  
  try {
    // Test without authentication
    log.test('Testing anonymous access (should be restricted)');
    const { data: anonData, error: anonError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (anonError && (anonError.message.includes('Row Level Security') || anonError.message.includes('permission'))) {
      log.success('RLS is properly blocking anonymous access');
      testResults.passed.push('RLS Anonymous Block');
    } else if (!anonError && anonData) {
      log.warning('RLS might not be enabled - anonymous access allowed');
      testResults.warnings.push('RLS Anonymous Access');
    }
    
    // Test with authentication (if we have a session)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      log.test('Testing authenticated access');
      const { data: authData, error: authError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (authData) {
        log.success('Authenticated user can access their own data');
        testResults.passed.push('RLS Authenticated Access');
      } else if (authError) {
        log.warning(`Authenticated access error: ${authError.message}`);
        testResults.warnings.push('RLS Authenticated Access');
      }
    }
  } catch (error) {
    log.error(`RLS test error: ${error.message}`);
    testResults.failed.push('RLS Tests');
  }
}

async function generateReport() {
  log.section('Test Summary Report');
  
  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  
  console.log(`\n${colors.bright}Test Results:${colors.reset}`);
  console.log(`${colors.green}Passed: ${testResults.passed.length}/${totalTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed.length}/${totalTests}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings.length}/${totalTests}${colors.reset}`);
  
  if (testResults.failed.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    testResults.failed.forEach(test => {
      console.log(`  ${colors.red}• ${test}${colors.reset}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
    testResults.warnings.forEach(test => {
      console.log(`  ${colors.yellow}• ${test}${colors.reset}`);
    });
  }
  
  if (testResults.passed.length > 0) {
    console.log(`\n${colors.green}${colors.bright}Passed Tests:${colors.reset}`);
    testResults.passed.forEach(test => {
      console.log(`  ${colors.green}• ${test}${colors.reset}`);
    });
  }
  
  // Recommendations
  console.log(`\n${colors.bright}${colors.blue}Recommendations:${colors.reset}`);
  
  if (testResults.failed.includes('Basic Connection')) {
    console.log(`${colors.red}1. Check your Supabase URL and Anon Key${colors.reset}`);
  }
  
  const missingTables = testResults.failed.filter(t => t.startsWith('Table:'));
  if (missingTables.length > 0) {
    console.log(`${colors.red}2. Create missing database tables:${colors.reset}`);
    missingTables.forEach(table => {
      console.log(`   - ${table.replace('Table: ', '')}`);
    });
  }
  
  const missingFunctions = testResults.failed.filter(t => t.startsWith('Edge Function:'));
  if (missingFunctions.length > 0) {
    console.log(`${colors.red}3. Deploy missing Edge Functions:${colors.reset}`);
    missingFunctions.forEach(func => {
      console.log(`   - ${func.replace('Edge Function: ', '')}`);
    });
  }
  
  if (testResults.warnings.some(w => w.includes('RLS'))) {
    console.log(`${colors.yellow}4. Review Row Level Security policies${colors.reset}`);
  }
  
  if (testResults.failed.includes('Authentication')) {
    console.log(`${colors.red}5. Check authentication configuration and email settings${colors.reset}`);
  }
}

// Main execution
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}Supabase Connection Diagnostic Tool${colors.reset}`);
  console.log(`${colors.dim}Testing project: ${SUPABASE_URL}${colors.reset}\n`);
  
  // Run tests in sequence
  await testBasicConnection();
  await testDatabaseTables();
  await testAuthentication();
  await testEdgeFunctions();
  await testRealtime();
  await testRLSPolicies();
  
  // Generate report
  await generateReport();
  
  console.log(`\n${colors.bright}Test complete!${colors.reset}\n`);
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});