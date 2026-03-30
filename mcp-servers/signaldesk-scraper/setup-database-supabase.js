import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Setting up Opportunity Engine database tables...\n');

// Since we can't run raw SQL directly through Supabase client with anon key,
// let's create a simpler version that checks what tables exist
async function checkTables() {
  console.log('📋 Checking existing tables in Supabase:\n');
  
  const tablesToCheck = [
    'organizations',
    'intelligence_targets', 
    'intelligence_findings',
    'opportunities',
    'webpage_snapshots',
    'monitoring_results',
    'detected_opportunities',
    'cascade_predictions',
    'opportunity_patterns',
    'opportunity_outcomes'
  ];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ${table}: ❌ Not found or no access`);
      } else {
        console.log(`  ${table}: ✅ Exists`);
      }
    } catch (err) {
      console.log(`  ${table}: ❌ Error checking`);
    }
  }
  
  console.log('\n⚠️  Note: Some tables may need to be created via Supabase Dashboard SQL Editor');
  console.log('📝 SQL file location: /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-scraper/setup.sql');
  console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/editor');
}

checkTables().catch(console.error);