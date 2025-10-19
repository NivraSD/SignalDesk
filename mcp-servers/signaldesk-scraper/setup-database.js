import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same connection string as in the MCPs
const pool = new Pool({
  connectionString: 'postgresql://postgres.zskaxjtyuaqazydouifp:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
});

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables for Opportunity Engine...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          await pool.query(statement + ';');
          console.log('✅ Success\n');
        } catch (err) {
          console.error(`❌ Error: ${err.message}\n`);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('✨ Database setup complete!');
    
    // Verify tables were created
    console.log('\n📋 Verifying tables:');
    const tables = [
      'webpage_snapshots',
      'monitoring_results',
      'detected_opportunities',
      'cascade_predictions',
      'opportunity_patterns',
      'opportunity_outcomes'
    ];
    
    for (const table of tables) {
      const result = await pool.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
        [table]
      );
      const exists = result.rows[0].exists;
      console.log(`  ${table}: ${exists ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();