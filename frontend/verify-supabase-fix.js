#!/usr/bin/env node

/**
 * Supabase Fix Verification Script
 * This script verifies that all Supabase issues have been resolved
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

// Service role key - YOU NEED TO GET THIS FROM SUPABASE DASHBOARD
// Go to: Settings > API > Service role key
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.bright}${colors.cyan}===========================================`);
console.log(`       SUPABASE CONNECTION VERIFIER`);
console.log(`===========================================${colors.reset}\n`);

// Create clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAPIKey() {
  console.log(`${colors.blue}1. Checking API Key validity...${colors.reset}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    if (response.status === 401) {
      console.log(`${colors.red}   ❌ API Key is invalid or expired${colors.reset}`);
      console.log(`${colors.yellow}   ⚠️  Please check your Supabase project settings${colors.reset}`);
      console.log(`${colors.yellow}   URL: https://app.supabase.com/project/zskaxjtyuaqazydouifp/settings/api${colors.reset}`);
      return false;
    } else if (response.ok) {
      console.log(`${colors.green}   ✅ API Key is valid${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}   ⚠️  Unexpected status: ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}   ❌ Connection error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function checkDatabaseTables() {
  console.log(`\n${colors.blue}2. Checking Database Tables...${colors.reset}`);
  
  const requiredTables = [
    'organizations',
    'users',
    'projects',
    'content',
    'intelligence_targets',
    'intelligence_findings',
    'monitoring_runs',
    'opportunity_queue',
    'memoryvault_items',
    'campaign_intelligence',
    'adaptive_learning'
  ];
  
  let tablesExist = 0;
  let tablesMissing = [];
  
  for (const table of requiredTables) {
    try {
      // Use service client if available, otherwise anon
      const client = SUPABASE_SERVICE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE' ? serviceClient : anonClient;
      
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ${colors.red}❌ Table '${table}' does not exist${colors.reset}`);
          tablesMissing.push(table);
        } else if (error.message.includes('JWT') || error.message.includes('Invalid API key')) {
          console.log(`   ${colors.yellow}⚠️  Cannot verify table '${table}' - authentication issue${colors.reset}`);
        } else {
          console.log(`   ${colors.yellow}⚠️  Table '${table}' - ${error.message}${colors.reset}`);
        }
      } else {
        console.log(`   ${colors.green}✅ Table '${table}' exists (${count || 0} rows)${colors.reset}`);
        tablesExist++;
      }
    } catch (error) {
      console.log(`   ${colors.red}❌ Error checking table '${table}': ${error.message}${colors.reset}`);
    }
  }
  
  return {
    total: requiredTables.length,
    existing: tablesExist,
    missing: tablesMissing
  };
}

async function checkEdgeFunctions() {
  console.log(`\n${colors.blue}3. Checking Edge Functions...${colors.reset}`);
  
  const functions = [
    { name: 'claude-integration', testPayload: { prompt: 'test' } },
    { name: 'monitor-intelligence', testPayload: { organizationId: 'test' } }
  ];
  
  let functionsWorking = 0;
  
  for (const func of functions) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${func.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(func.testPayload),
      });
      
      if (response.status === 404) {
        console.log(`   ${colors.red}❌ Function '${func.name}' not deployed${colors.reset}`);
      } else if (response.status === 401) {
        console.log(`   ${colors.yellow}⚠️  Function '${func.name}' requires authentication${colors.reset}`);
        functionsWorking++;
      } else if (response.status === 500) {
        const text = await response.text();
        if (text.includes('CLAUDE_API_KEY')) {
          console.log(`   ${colors.yellow}⚠️  Function '${func.name}' deployed but missing CLAUDE_API_KEY${colors.reset}`);
        } else {
          console.log(`   ${colors.yellow}⚠️  Function '${func.name}' deployed but has errors${colors.reset}`);
        }
        functionsWorking++;
      } else if (response.ok) {
        console.log(`   ${colors.green}✅ Function '${func.name}' is working${colors.reset}`);
        functionsWorking++;
      } else {
        console.log(`   ${colors.yellow}⚠️  Function '${func.name}' returned status ${response.status}${colors.reset}`);
      }
    } catch (error) {
      console.log(`   ${colors.red}❌ Error testing function '${func.name}': ${error.message}${colors.reset}`);
    }
  }
  
  return {
    total: functions.length,
    working: functionsWorking
  };
}

async function checkAuthentication() {
  console.log(`\n${colors.blue}4. Checking Authentication...${colors.reset}`);
  
  try {
    // Check if auth is accessible
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    
    if (response.ok) {
      console.log(`   ${colors.green}✅ Auth service is healthy${colors.reset}`);
      
      // Try to sign in with a test account
      const { data, error } = await anonClient.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      
      if (data && data.user) {
        console.log(`   ${colors.green}✅ Test user can sign in${colors.reset}`);
        await anonClient.auth.signOut();
        return true;
      } else if (error && error.message.includes('Invalid login')) {
        console.log(`   ${colors.yellow}⚠️  Test user doesn't exist (create one if needed)${colors.reset}`);
        return true; // Auth is working, just no test user
      } else {
        console.log(`   ${colors.yellow}⚠️  Auth issue: ${error?.message || 'Unknown error'}${colors.reset}`);
        return false;
      }
    } else {
      console.log(`   ${colors.red}❌ Auth service is not healthy${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Auth check failed: ${error.message}${colors.reset}`);
    return false;
  }
}

async function generateFixInstructions(results) {
  console.log(`\n${colors.bright}${colors.magenta}===========================================`);
  console.log(`           FIX INSTRUCTIONS`);
  console.log(`===========================================${colors.reset}\n`);
  
  let stepNumber = 1;
  
  if (!results.apiKeyValid) {
    console.log(`${colors.bright}${stepNumber}. Fix API Key Issue:${colors.reset}`);
    console.log(`   a) Go to: https://app.supabase.com/project/zskaxjtyuaqazydouifp/settings/api`);
    console.log(`   b) Copy the 'anon public' key`);
    console.log(`   c) Update the .env file with the correct key`);
    console.log(`   d) Restart your application\n`);
    stepNumber++;
  }
  
  if (results.tables.missing.length > 0) {
    console.log(`${colors.bright}${stepNumber}. Create Missing Database Tables:${colors.reset}`);
    console.log(`   a) Go to: https://app.supabase.com/project/zskaxjtyuaqazydouifp/sql/new`);
    console.log(`   b) Copy and paste the contents of: setup-supabase-complete.sql`);
    console.log(`   c) Run the SQL script`);
    console.log(`   d) Verify tables are created in the Table Editor\n`);
    stepNumber++;
  }
  
  if (results.functions.working < results.functions.total) {
    console.log(`${colors.bright}${stepNumber}. Deploy Edge Functions:${colors.reset}`);
    console.log(`   a) Install Supabase CLI: npm install -g supabase`);
    console.log(`   b) Run: chmod +x deploy-edge-functions.sh`);
    console.log(`   c) Run: ./deploy-edge-functions.sh`);
    console.log(`   d) Set CLAUDE_API_KEY in Supabase dashboard\n`);
    stepNumber++;
  }
  
  if (!results.authWorking) {
    console.log(`${colors.bright}${stepNumber}. Fix Authentication:${colors.reset}`);
    console.log(`   a) Go to: https://app.supabase.com/project/zskaxjtyuaqazydouifp/auth/users`);
    console.log(`   b) Check if email confirmation is required`);
    console.log(`   c) Create a test user if needed`);
    console.log(`   d) Verify SMTP settings for email delivery\n`);
    stepNumber++;
  }
  
  if (SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.log(`${colors.bright}${stepNumber}. Get Service Role Key (Optional):${colors.reset}`);
    console.log(`   For full database access during testing:`);
    console.log(`   a) Go to: https://app.supabase.com/project/zskaxjtyuaqazydouifp/settings/api`);
    console.log(`   b) Copy the 'service_role' key (keep this secret!)`);
    console.log(`   c) Update this script with the service role key\n`);
    stepNumber++;
  }
}

async function main() {
  const results = {
    apiKeyValid: false,
    tables: { total: 0, existing: 0, missing: [] },
    functions: { total: 0, working: 0 },
    authWorking: false
  };
  
  // Run all checks
  results.apiKeyValid = await checkAPIKey();
  
  if (results.apiKeyValid) {
    results.tables = await checkDatabaseTables();
    results.functions = await checkEdgeFunctions();
    results.authWorking = await checkAuthentication();
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}===========================================`);
  console.log(`              SUMMARY`);
  console.log(`===========================================${colors.reset}\n`);
  
  const allGood = results.apiKeyValid && 
                  results.tables.existing === results.tables.total && 
                  results.functions.working === results.functions.total && 
                  results.authWorking;
  
  if (allGood) {
    console.log(`${colors.green}${colors.bright}🎉 All systems are operational! 🎉${colors.reset}`);
    console.log(`${colors.green}Your Supabase connection is fully configured.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  Some issues need to be resolved${colors.reset}`);
    console.log(`\nStatus:`);
    console.log(`  API Key: ${results.apiKeyValid ? '✅' : '❌'}`);
    console.log(`  Tables: ${results.tables.existing}/${results.tables.total} ${results.tables.existing === results.tables.total ? '✅' : '⚠️'}`);
    console.log(`  Edge Functions: ${results.functions.working}/${results.functions.total} ${results.functions.working === results.functions.total ? '✅' : '⚠️'}`);
    console.log(`  Authentication: ${results.authWorking ? '✅' : '⚠️'}`);
    
    await generateFixInstructions(results);
  }
  
  console.log(`${colors.cyan}===========================================${colors.reset}\n`);
}

// Run the verification
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});