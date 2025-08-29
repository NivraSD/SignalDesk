#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * Checks if the current Supabase database matches the V3 schema requirements
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// Required tables for V3
const REQUIRED_TABLES = [
  'organizations',
  'profiles', 
  'intelligence_runs',
  'intelligence_stage_results',
  'opportunities',
  'campaigns',
  'memoryvault',
  'memoryvault_attachments',
  'monitoring_alerts',
  'canvas_states',
  'exports_log',
  'niv_interactions'
];

// Required columns per table
const REQUIRED_COLUMNS = {
  organizations: ['id', 'name', 'domain', 'industry', 'size', 'config', 'created_at', 'updated_at'],
  profiles: ['id', 'user_id', 'organization_id', 'role', 'preferences', 'created_at', 'updated_at'],
  intelligence_runs: ['id', 'organization_id', 'status', 'stages_complete', 'total_stages', 'results', 'duration_ms', 'created_at', 'completed_at'],
  opportunities: ['id', 'organization_id', 'title', 'description', 'score', 'urgency', 'time_window', 'source', 'data', 'status', 'created_at'],
  campaigns: ['id', 'organization_id', 'opportunity_id', 'title', 'status', 'content', 'visuals', 'media_list', 'social_posts', 'exports', 'created_at'],
  memoryvault: ['id', 'organization_id', 'type', 'content', 'embedding', 'patterns', 'success_metrics', 'created_at'],
  monitoring_alerts: ['id', 'organization_id', 'type', 'severity', 'title', 'message', 'data', 'status', 'created_at'],
  canvas_states: ['id', 'user_id', 'organization_id', 'components', 'scale', 'scroll_position', 'active_tab', 'created_at', 'updated_at'],
  exports_log: ['id', 'organization_id', 'campaign_id', 'export_type', 'format', 'watermark_applied', 'file_url', 'created_at'],
  niv_interactions: ['id', 'organization_id', 'user_id', 'context', 'query', 'response', 'data_context', 'created_at']
};

async function verifySchema() {
  console.log(chalk.blue.bold('\n🔍 SignalDesk V3 Database Schema Verification\n'));

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(chalk.red('❌ Missing Supabase credentials in environment variables'));
    console.log(chalk.yellow('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'));
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let allTablesExist = true;
  let allColumnsExist = true;
  const missingTables = [];
  const missingColumns = {};

  console.log(chalk.cyan('Checking tables...\n'));

  // Check each required table
  for (const tableName of REQUIRED_TABLES) {
    try {
      // Try to query the table with limit 0 to check if it exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(chalk.red(`❌ Table missing: ${tableName}`));
          missingTables.push(tableName);
          allTablesExist = false;
        } else {
          console.log(chalk.yellow(`⚠️  Table ${tableName}: ${error.message}`));
        }
      } else {
        console.log(chalk.green(`✅ Table exists: ${tableName}`));
        
        // Check columns if table exists
        if (REQUIRED_COLUMNS[tableName]) {
          const { data: tableInfo, error: infoError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!infoError && tableInfo && tableInfo.length > 0) {
            const existingColumns = Object.keys(tableInfo[0]);
            const requiredCols = REQUIRED_COLUMNS[tableName];
            const missing = requiredCols.filter(col => !existingColumns.includes(col));
            
            if (missing.length > 0) {
              console.log(chalk.yellow(`   ⚠️  Missing columns: ${missing.join(', ')}`));
              missingColumns[tableName] = missing;
              allColumnsExist = false;
            }
          }
        }
      }
    } catch (err) {
      console.log(chalk.red(`❌ Error checking ${tableName}: ${err.message}`));
      allTablesExist = false;
    }
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Verification Summary\n'));
  
  if (allTablesExist && allColumnsExist) {
    console.log(chalk.green.bold('✅ Database schema is complete and ready for V3!'));
  } else {
    if (missingTables.length > 0) {
      console.log(chalk.red.bold(`\n❌ Missing ${missingTables.length} tables:`));
      missingTables.forEach(table => {
        console.log(chalk.red(`   - ${table}`));
      });
    }

    if (Object.keys(missingColumns).length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  Tables with missing columns:'));
      Object.entries(missingColumns).forEach(([table, columns]) => {
        console.log(chalk.yellow(`   ${table}: ${columns.join(', ')}`));
      });
    }

    console.log(chalk.cyan.bold('\n💡 To fix the schema issues:'));
    console.log(chalk.cyan('1. Run the schema migration: npx supabase db push'));
    console.log(chalk.cyan('2. Or apply manually: supabase/schema_v3.sql'));
  }

  // Check for RLS
  console.log(chalk.blue.bold('\n🔒 Row Level Security Check\n'));
  
  try {
    // This is a simplified check - in production you'd query system tables
    console.log(chalk.yellow('⚠️  RLS verification requires database admin access'));
    console.log(chalk.cyan('   Please verify RLS is enabled in Supabase Dashboard'));
  } catch (err) {
    console.log(chalk.yellow('Could not verify RLS status'));
  }

  // Check for indexes
  console.log(chalk.blue.bold('\n🚀 Performance Indexes\n'));
  console.log(chalk.cyan('Recommended indexes for optimal performance:'));
  console.log(chalk.gray('   - idx_organizations_domain'));
  console.log(chalk.gray('   - idx_intelligence_runs_org'));
  console.log(chalk.gray('   - idx_opportunities_org'));
  console.log(chalk.gray('   - idx_campaigns_org'));
  console.log(chalk.gray('   - idx_memoryvault_org'));
  console.log(chalk.gray('   - idx_alerts_org_status'));

  console.log(chalk.blue.bold('\n✨ Verification complete!\n'));
}

// Run verification
verifySchema().catch(console.error);