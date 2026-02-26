const { createClient } = require('@supabase/supabase-js');

async function setupTables() {
  console.log('🔧 Setting up discovery and search tables...\n');

  // Use direct PostgreSQL connection
  const { Client } = require('pg');

  // Connection string components
  const dbPassword = 'WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';
  const connectionString = `postgresql://postgres.zskaxjtyuaqazydouifp:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create mcp_discovery table
    console.log('\n📊 Creating mcp_discovery table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mcp_discovery (
        organization_id TEXT PRIMARY KEY,
        organization_name TEXT,
        industry TEXT,
        competition JSONB,
        keywords TEXT[],
        stakeholders JSONB,
        monitoring_config JSONB,
        trending JSONB,
        business_focus JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ mcp_discovery table created');

    // Create fireplexity_searches table
    console.log('\n📊 Creating fireplexity_searches table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS fireplexity_searches (
        id SERIAL PRIMARY KEY,
        organization_id TEXT,
        query TEXT,
        results JSONB,
        strategy TEXT,
        cached BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ fireplexity_searches table created');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_mcp_discovery_org_name ON mcp_discovery(organization_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_org ON fireplexity_searches(organization_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_query ON fireplexity_searches(query)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fireplexity_searches_created ON fireplexity_searches(created_at DESC)`);
    console.log('✅ Indexes created');

    console.log('\n🎉 All tables created successfully!');
    console.log('Now run: node create-openai-discovery.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupTables();