#!/usr/bin/env node

/**
 * Supabase Project Verification Script for SignalDesk
 * 
 * This script verifies all required Supabase features are configured:
 * 1. Authentication setup
 * 2. Database tables and RLS policies
 * 3. Edge Functions deployment
 * 4. Storage buckets (if needed)
 * 5. Real-time subscriptions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}══════ ${msg} ══════${colors.reset}`)
};

// Verification results
const results = {
  auth: { status: 'pending', details: [] },
  database: { status: 'pending', details: [] },
  edgeFunctions: { status: 'pending', details: [] },
  realtime: { status: 'pending', details: [] },
  storage: { status: 'pending', details: [] }
};

// 1. Verify Authentication
async function verifyAuth() {
  log.section('Authentication Verification');
  
  try {
    // Test login with the specified user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin2@signaldesk.com',
      password: 'Admin123!@#'  // You'll need to provide the correct password
    });

    if (error) {
      log.error(`Authentication failed: ${error.message}`);
      log.warning('Please ensure admin2@signaldesk.com user exists with correct password');
      results.auth.status = 'failed';
      results.auth.details.push('User authentication failed');
      
      // Try to check if auth is at least configured
      const { data: settings } = await supabase.auth.getSession();
      if (settings !== null) {
        log.info('Auth system is configured but user login failed');
        results.auth.details.push('Auth system is active');
      }
    } else {
      log.success('Successfully authenticated as admin2@signaldesk.com');
      results.auth.status = 'success';
      results.auth.details.push('User authentication successful');
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*, organization:organizations(*)')
        .eq('id', data.user.id)
        .single();
      
      if (profile) {
        log.success(`User profile found: ${profile.email}`);
        if (profile.organization) {
          log.success(`Organization: ${profile.organization.name || profile.organization.id}`);
        }
      } else {
        log.warning('User profile not found in users table');
        results.auth.details.push('User profile missing');
      }
      
      // Sign out for clean state
      await supabase.auth.signOut();
    }
  } catch (err) {
    log.error(`Auth verification error: ${err.message}`);
    results.auth.status = 'error';
    results.auth.details.push(err.message);
  }
}

// 2. Verify Database Tables
async function verifyDatabase() {
  log.section('Database Tables Verification');
  
  const requiredTables = [
    'users',
    'organizations',
    'intelligence_findings',
    'intelligence_targets',
    'monitoring_runs',
    'opportunity_queue',
    'projects',
    'content',
    'memoryvault_items'
  ];
  
  let tablesFound = 0;
  let tablesMissing = [];
  
  for (const table of requiredTables) {
    try {
      // Try to query each table (will fail if table doesn't exist or no RLS)
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          log.error(`Table missing: ${table}`);
          tablesMissing.push(table);
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          log.warning(`Table exists but RLS may be restrictive: ${table}`);
          tablesFound++;
          results.database.details.push(`${table}: RLS configured (restrictive)`);
        } else {
          log.warning(`Table ${table}: ${error.message}`);
          results.database.details.push(`${table}: ${error.message}`);
        }
      } else {
        log.success(`Table verified: ${table}`);
        tablesFound++;
        results.database.details.push(`${table}: OK`);
      }
    } catch (err) {
      log.error(`Error checking table ${table}: ${err.message}`);
      results.database.details.push(`${table}: Error - ${err.message}`);
    }
  }
  
  if (tablesMissing.length === 0) {
    log.success(`All ${requiredTables.length} required tables present`);
    results.database.status = 'success';
  } else {
    log.error(`Missing ${tablesMissing.length} tables: ${tablesMissing.join(', ')}`);
    results.database.status = 'partial';
  }
}

// 3. Verify Edge Functions
async function verifyEdgeFunctions() {
  log.section('Edge Functions Verification');
  
  const requiredFunctions = [
    { name: 'claude-chat', testPayload: { prompt: 'test', max_tokens: 10 } },
    { name: 'monitor-intelligence', testPayload: { organizationId: 'test' } },
    { name: 'niv-chat', testPayload: { message: 'test', mode: 'analysis' } }
  ];
  
  for (const func of requiredFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke(func.name, {
        body: func.testPayload
      });
      
      if (error) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          log.error(`Edge Function not deployed: ${func.name}`);
          results.edgeFunctions.details.push(`${func.name}: Not deployed`);
        } else if (error.message.includes('API key') || error.message.includes('unauthorized')) {
          log.warning(`Edge Function ${func.name} deployed but needs API key configuration`);
          results.edgeFunctions.details.push(`${func.name}: Needs API key`);
        } else {
          log.warning(`Edge Function ${func.name}: ${error.message}`);
          results.edgeFunctions.details.push(`${func.name}: ${error.message}`);
        }
      } else {
        log.success(`Edge Function operational: ${func.name}`);
        results.edgeFunctions.details.push(`${func.name}: OK`);
      }
    } catch (err) {
      log.error(`Error testing ${func.name}: ${err.message}`);
      results.edgeFunctions.details.push(`${func.name}: Error - ${err.message}`);
    }
  }
  
  results.edgeFunctions.status = results.edgeFunctions.details.every(d => d.includes('OK')) 
    ? 'success' 
    : results.edgeFunctions.details.some(d => d.includes('OK')) 
      ? 'partial' 
      : 'failed';
}

// 4. Verify Real-time Subscriptions
async function verifyRealtime() {
  log.section('Real-time Subscriptions Verification');
  
  try {
    // Test creating a channel subscription
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'intelligence_findings' },
        (payload) => {
          log.info('Real-time event received');
        }
      );
    
    const status = await channel.subscribe();
    
    if (status === 'SUBSCRIBED') {
      log.success('Real-time subscriptions working');
      results.realtime.status = 'success';
      results.realtime.details.push('Successfully subscribed to changes');
    } else {
      log.warning(`Real-time subscription status: ${status}`);
      results.realtime.status = 'partial';
      results.realtime.details.push(`Subscription status: ${status}`);
    }
    
    // Clean up
    await supabase.removeChannel(channel);
  } catch (err) {
    log.error(`Real-time verification error: ${err.message}`);
    results.realtime.status = 'failed';
    results.realtime.details.push(err.message);
  }
}

// 5. Check Storage Buckets (if needed)
async function verifyStorage() {
  log.section('Storage Verification');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      log.warning('Storage access limited (normal for anon key)');
      results.storage.status = 'limited';
      results.storage.details.push('Storage configured but limited access');
    } else if (buckets && buckets.length > 0) {
      log.success(`Found ${buckets.length} storage bucket(s)`);
      buckets.forEach(b => log.info(`  - ${b.name}`));
      results.storage.status = 'success';
      results.storage.details.push(`${buckets.length} buckets configured`);
    } else {
      log.info('No storage buckets configured (may not be needed)');
      results.storage.status = 'not_configured';
      results.storage.details.push('No buckets configured');
    }
  } catch (err) {
    log.warning(`Storage check error: ${err.message}`);
    results.storage.status = 'error';
    results.storage.details.push(err.message);
  }
}

// Generate final report
function generateReport() {
  log.section('VERIFICATION SUMMARY');
  
  const statusEmoji = {
    success: '✅',
    partial: '⚠️',
    failed: '❌',
    error: '❌',
    pending: '⏳',
    limited: '🔒',
    not_configured: '➖'
  };
  
  console.log('\n┌─────────────────────┬──────────┬──────────────────────────────────────┐');
  console.log('│ Component           │ Status   │ Details                              │');
  console.log('├─────────────────────┼──────────┼──────────────────────────────────────┤');
  
  Object.entries(results).forEach(([component, data]) => {
    const emoji = statusEmoji[data.status] || '❓';
    const status = `${emoji} ${data.status.padEnd(7)}`;
    const details = data.details[0] || 'No details';
    console.log(`│ ${component.padEnd(19)} │ ${status} │ ${details.substring(0, 36).padEnd(36)} │`);
  });
  
  console.log('└─────────────────────┴──────────┴──────────────────────────────────────┘');
  
  // Action items
  log.section('ACTION ITEMS');
  
  const actions = [];
  
  if (results.auth.status === 'failed') {
    actions.push('1. Create user admin2@signaldesk.com in Supabase Auth');
    actions.push('   - Go to Authentication > Users in Supabase dashboard');
    actions.push('   - Click "Invite user" and add admin2@signaldesk.com');
  }
  
  if (results.database.status !== 'success') {
    actions.push('2. Run database migrations to create missing tables');
    actions.push('   - Check /supabase/migrations folder for SQL files');
    actions.push('   - Run migrations via Supabase CLI or dashboard');
  }
  
  if (results.edgeFunctions.status !== 'success') {
    actions.push('3. Deploy Edge Functions');
    actions.push('   - Install Supabase CLI: npm install -g supabase');
    actions.push('   - Run: supabase functions deploy claude-chat');
    actions.push('   - Run: supabase functions deploy monitor-intelligence');
    actions.push('   - Run: supabase functions deploy niv-chat');
    actions.push('   - Add ANTHROPIC_API_KEY to Edge Function secrets');
  }
  
  if (actions.length > 0) {
    actions.forEach(action => console.log(action));
  } else {
    log.success('All systems operational! Your Supabase project is ready.');
  }
  
  // Configuration details
  log.section('CONFIGURATION DETAILS');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Project Ref: ${supabaseUrl.split('.')[0].replace('https://', '')}`);
  console.log(`Region: ${supabaseUrl.includes('supabase.co') ? 'Supabase Cloud' : 'Self-hosted'}`);
}

// Main execution
async function main() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       SignalDesk Supabase Verification Script           ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}`);
  
  log.info(`Checking Supabase project: ${supabaseUrl}`);
  
  // Run all verifications
  await verifyAuth();
  await verifyDatabase();
  await verifyEdgeFunctions();
  await verifyRealtime();
  await verifyStorage();
  
  // Generate report
  generateReport();
}

// Run the verification
main().catch(err => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});