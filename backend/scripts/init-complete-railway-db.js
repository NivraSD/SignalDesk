// Initialize COMPLETE Railway Database with ALL platform tables
const { Pool } = require('pg');
require('dotenv').config();

async function initCompleteDatabase() {
  console.log('🚀 Initializing COMPLETE SignalDesk Database...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    console.log('\n📊 Creating ALL platform tables...\n');
    
    // ========================================
    // USER MANAGEMENT TABLES
    // ========================================
    console.log('Creating User Management tables...');
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        organization_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        settings JSONB DEFAULT '{}'
      )
    `);
    
    // Sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);
    
    // ========================================
    // CAMPAIGN MANAGEMENT TABLES
    // ========================================
    console.log('Creating Campaign Management tables...');
    
    // Campaigns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'draft',
        strategy_type VARCHAR(100),
        objectives TEXT[],
        target_audience JSONB,
        budget DECIMAL(10,2),
        start_date DATE,
        end_date DATE,
        metrics JSONB DEFAULT '{}',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Campaign actions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        action_type VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        content TEXT,
        scheduled_at TIMESTAMP,
        executed_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        results JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // ========================================
    // CONTENT MANAGEMENT TABLES
    // ========================================
    console.log('Creating Content Management tables...');
    
    // Content library
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        type VARCHAR(50),
        title VARCHAR(500),
        content TEXT,
        metadata JSONB DEFAULT '{}',
        tags TEXT[],
        status VARCHAR(50) DEFAULT 'draft',
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Media assets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        file_name VARCHAR(255),
        file_type VARCHAR(50),
        file_size INTEGER,
        url TEXT,
        thumbnail_url TEXT,
        metadata JSONB DEFAULT '{}',
        uploaded_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // ========================================
    // PROJECT MANAGEMENT TABLES
    // ========================================
    console.log('Creating Project Management tables...');
    
    // Projects
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        priority VARCHAR(20) DEFAULT 'medium',
        start_date DATE,
        due_date DATE,
        completed_at TIMESTAMP,
        created_by UUID REFERENCES users(id),
        assigned_to UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Tasks/Todos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        completed_at TIMESTAMP,
        assigned_to UUID REFERENCES users(id),
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // ========================================
    // ANALYTICS TABLES
    // ========================================
    console.log('Creating Analytics tables...');
    
    // Analytics events
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        event_type VARCHAR(100),
        event_name VARCHAR(255),
        event_data JSONB DEFAULT '{}',
        user_id UUID REFERENCES users(id),
        session_id UUID REFERENCES sessions(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Performance metrics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        metric_type VARCHAR(100),
        metric_name VARCHAR(255),
        value DECIMAL,
        unit VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // ========================================
    // ORCHESTRATOR TABLES
    // ========================================
    console.log('Creating Orchestrator tables...');
    
    // Orchestration flows
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orchestration_flows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        name VARCHAR(255),
        description TEXT,
        flow_type VARCHAR(100),
        trigger_type VARCHAR(100),
        trigger_config JSONB DEFAULT '{}',
        steps JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Orchestration executions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orchestration_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        flow_id UUID REFERENCES orchestration_flows(id),
        status VARCHAR(50) DEFAULT 'running',
        input_data JSONB DEFAULT '{}',
        output_data JSONB DEFAULT '{}',
        error_message TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    
    // ========================================
    // MONITORING TABLES (Already created)
    // ========================================
    console.log('Ensuring Monitoring tables exist...');
    
    // Organizations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Intelligence findings (already exists)
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
    
    // ========================================
    // CREATE INDEXES
    // ========================================
    console.log('\n📑 Creating indexes for performance...');
    
    // User indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id)');
    
    // Campaign indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)');
    
    // Content indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_content_org ON content_library(organization_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_content_type ON content_library(type)');
    
    // Project indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)');
    
    // Analytics indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_analytics_org ON analytics_events(organization_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)');
    
    // ========================================
    // INSERT DEFAULT DATA
    // ========================================
    console.log('\n📝 Inserting default data...');
    
    // Demo organization
    await pool.query(`
      INSERT INTO organizations (id, name) 
      VALUES ('demo-org', 'Demo Organization')
      ON CONFLICT (id) DO NOTHING
    `);
    
    // Demo user (password: 'password')
    await pool.query(`
      INSERT INTO users (email, password, name, role, organization_id) 
      VALUES (
        'demo@signaldesk.com',
        '$2a$10$8KqDkPe5Y3mwVq5lRceXouTVecPPNYKqQoVvwqGxFOVvV8Gvz3Cge',
        'Demo User',
        'admin',
        'demo-org'
      )
      ON CONFLICT (email) DO NOTHING
    `);
    
    // ========================================
    // DISPLAY RESULTS
    // ========================================
    console.log('\n✅ Database initialization complete!\n');
    console.log('📊 Tables created:');
    
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.tablename}`);
    });
    
    console.log(`\n✅ Total tables: ${tables.rows.length}`);
    
    // Count records in key tables
    const counts = [
      'users', 'organizations', 'campaigns', 'projects', 
      'intelligence_findings', 'opportunity_queue'
    ];
    
    console.log('\n📈 Record counts:');
    for (const table of counts) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ${table}: ${count.rows[0].count} records`);
      } catch (e) {
        // Table might not exist
      }
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initCompleteDatabase();