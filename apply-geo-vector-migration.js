// Apply GEO_VECTOR_CAMPAIGN migration directly via raw SQL
const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

// Parse Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('❌ Could not parse project ref from SUPABASE_URL')
  process.exit(1)
}

const client = new Client({
  host: `aws-0-us-east-1.pooler.supabase.com`,
  port: 6543,
  database: 'postgres',
  user: `postgres.${projectRef}`,
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
})

async function applyMigration() {
  console.log('🔧 Applying GEO_VECTOR_CAMPAIGN migration...')
  console.log('📡 Connecting to:', `postgres.${projectRef}@aws-0-us-east-1.pooler.supabase.com`)

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Drop old constraint
    console.log('🗑️  Dropping old constraint...')
    await client.query(`
      ALTER TABLE campaign_builder_sessions
      DROP CONSTRAINT IF EXISTS campaign_builder_sessions_selected_approach_check;
    `)
    console.log('✅ Dropped old constraint')

    // Add new constraint
    console.log('➕ Adding new constraint with GEO_VECTOR_CAMPAIGN...')
    await client.query(`
      ALTER TABLE campaign_builder_sessions
      ADD CONSTRAINT campaign_builder_sessions_selected_approach_check
      CHECK (selected_approach IN ('PR_CAMPAIGN', 'VECTOR_CAMPAIGN', 'GEO_VECTOR_CAMPAIGN'));
    `)
    console.log('✅ Added new constraint')

    // Add comment
    await client.query(`
      COMMENT ON COLUMN campaign_builder_sessions.selected_approach IS
      'Campaign type: PR_CAMPAIGN (traditional PR), VECTOR_CAMPAIGN (standard VECTOR), or GEO_VECTOR_CAMPAIGN (VECTOR with AI query ownership)';
    `)
    console.log('✅ Added column comment')

    console.log('🎉 Migration completed successfully!')

  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyMigration()
