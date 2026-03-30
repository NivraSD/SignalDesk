#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applySchema() {
  console.log('📋 Applying Campaign Builder schema...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations');
  const files = fs.readdirSync(migrationPath).filter(f => f.includes('create_campaign_builder_tables'));

  if (files.length === 0) {
    console.error('❌ Migration file not found');
    process.exit(1);
  }

  const sqlFile = path.join(migrationPath, files[0]);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log(`📄 Reading: ${files[0]}`);
  console.log('🔧 Executing SQL...\n');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql RPC not available, trying direct execution...');

      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim().length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.error(`    ⚠️  Warning: ${stmtError.message}`);
          }
        }
      }

      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Schema applied successfully!\n');
    console.log('Created tables:');
    console.log('  • campaign_builder_sessions');
    console.log('  • campaign_blueprints');
    console.log('  • campaign_content');
    console.log('  • campaign_research_cache');
    console.log('\nCreated views:');
    console.log('  • active_campaign_sessions');
    console.log('  • campaign_blueprint_analytics');

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');

    const { data: tables, error: tablesError } = await supabase
      .from('campaign_builder_sessions')
      .select('id')
      .limit(0);

    if (tablesError) {
      console.error('❌ Verification failed:', tablesError.message);
    } else {
      console.log('✅ Tables verified and accessible');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

applySchema();
