// Initialize Railway Database
const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
  console.log('🚀 Initializing Railway Database...');
  
  // Use DATABASE_URL if available (Railway), otherwise use individual vars
  const connectionString = process.env.DATABASE_URL;
  
  const pool = connectionString 
    ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
    : new Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
      });

  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    // Create tables if they don't exist
    console.log('📊 Creating tables...');
    
    // Create necessary tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS intelligence_findings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        target_id UUID,
        organization_id VARCHAR(255),
        title VARCHAR(500) NOT NULL,
        content TEXT,
        source VARCHAR(255),
        url TEXT,
        sentiment_score NUMERIC(3,2),
        relevance_score NUMERIC(3,2),
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        pattern_id UUID,
        pattern_name VARCHAR(100),
        title VARCHAR(500),
        description TEXT,
        source_type VARCHAR(50),
        source_name VARCHAR(255),
        source_url TEXT,
        score FLOAT,
        confidence FLOAT,
        window_start TIMESTAMP DEFAULT NOW(),
        window_end TIMESTAMP,
        urgency VARCHAR(20),
        recommended_actions TEXT[],
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        source_data JSONB DEFAULT '{}',
        detected_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS source_indexes (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50),
        entity_name VARCHAR(255),
        entity_data JSONB,
        index_data JSONB DEFAULT '{}',
        source_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255) UNIQUE NOT NULL,
        monitoring BOOLEAN DEFAULT false,
        last_scan TIMESTAMP,
        health INTEGER DEFAULT 100,
        active_targets INTEGER DEFAULT 0,
        active_sources INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS intelligence_targets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        name VARCHAR(255),
        type VARCHAR(50),
        priority VARCHAR(20),
        keywords TEXT[],
        topics TEXT[],
        sources TEXT[],
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create indexes
    console.log('📑 Creating indexes...');
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_findings_org ON intelligence_findings(organization_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_findings_created ON intelligence_findings(created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunity_queue(status, created_at DESC)');
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_findings_url ON intelligence_findings(url) WHERE url IS NOT NULL');
    
    // Insert demo organization
    await pool.query(`
      INSERT INTO organizations (id, name) 
      VALUES ('demo-org', 'Demo Organization')
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('✅ Database initialization complete!');
    
    // Check table counts
    const tables = ['organizations', 'intelligence_findings', 'opportunity_queue', 'source_indexes'];
    for (const table of tables) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`📊 ${table}: ${count.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();