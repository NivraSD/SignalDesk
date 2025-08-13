#!/usr/bin/env node

/**
 * Script to run the opportunity detection database migration
 * Run with: node scripts/run-opportunity-migration.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigration() {
  console.log('🚀 Running Opportunity Detection Migration...');
  
  try {
    // Execute individual CREATE TABLE statements
    console.log('\n📦 Creating opportunity tables...');
    
    // 1. Create opportunity_patterns table
    console.log('Creating opportunity_patterns table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_patterns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50),
        description TEXT,
        signals JSONB,
        action_window VARCHAR(50),
        recommended_action TEXT,
        success_rate FLOAT DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ opportunity_patterns table created');
    
    // 2. Create opportunity_queue table
    console.log('Creating opportunity_queue table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id VARCHAR(255),
        pattern_id UUID REFERENCES opportunity_patterns(id),
        pattern_name VARCHAR(100),
        source_type VARCHAR(50),
        source_name VARCHAR(255),
        source_url TEXT,
        score FLOAT,
        confidence FLOAT,
        window_start TIMESTAMP DEFAULT NOW(),
        window_end TIMESTAMP,
        urgency VARCHAR(20),
        title VARCHAR(500),
        description TEXT,
        key_points JSONB,
        recommended_actions JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to VARCHAR(255),
        acted_upon_at TIMESTAMP,
        outcome VARCHAR(50),
        outcome_notes TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ opportunity_queue table created');
    
    // 3. Create cascade_predictions table
    console.log('Creating cascade_predictions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cascade_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID REFERENCES opportunity_queue(id),
        trigger_event JSONB,
        first_order_effects JSONB,
        second_order_effects JSONB,
        third_order_effects JSONB,
        predicted_timeline JSONB,
        confidence_scores JSONB,
        opportunities_identified JSONB,
        risks_identified JSONB,
        accuracy_score FLOAT,
        validated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ cascade_predictions table created');
    
    // 4. Create source_performance table
    console.log('Creating source_performance table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS source_performance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_type VARCHAR(50),
        source_name VARCHAR(255),
        source_url TEXT,
        signals_generated INTEGER DEFAULT 0,
        opportunities_created INTEGER DEFAULT 0,
        opportunities_acted_upon INTEGER DEFAULT 0,
        false_positives INTEGER DEFAULT 0,
        signal_quality_score FLOAT DEFAULT 0,
        average_relevance FLOAT DEFAULT 0,
        exclusive_finds INTEGER DEFAULT 0,
        average_lead_time_hours FLOAT,
        fastest_detection_hours FLOAT,
        last_checked TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(source_type, source_name)
      )
    `);
    console.log('✅ source_performance table created');
    
    // 5. Create opportunity_feedback table
    console.log('Creating opportunity_feedback table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS opportunity_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        opportunity_id UUID REFERENCES opportunity_queue(id),
        pattern_id UUID REFERENCES opportunity_patterns(id),
        was_valuable BOOLEAN,
        action_taken TEXT,
        result_achieved TEXT,
        roi_estimate FLOAT,
        pattern_accuracy FLOAT,
        timing_accuracy FLOAT,
        score_accuracy FLOAT,
        user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
        user_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
      )
    `);
    console.log('✅ opportunity_feedback table created');
    
    // Create indexes
    console.log('\n🔍 Creating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_org_status ON opportunity_queue(organization_id, status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_window ON opportunity_queue(window_end)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_score ON opportunity_queue(score DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_urgency ON opportunity_queue(urgency)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_created ON opportunity_queue(created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_queue_org_window ON opportunity_queue(organization_id, window_end)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_queue_pattern ON opportunity_queue(pattern_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_feedback_pattern ON opportunity_feedback(pattern_id)');
    console.log('✅ Indexes created');
    
    // Insert initial patterns
    console.log('\n📝 Inserting initial opportunity patterns...');
    await pool.query(`
      INSERT INTO opportunity_patterns (name, type, description, signals, action_window, recommended_action) VALUES
      ('Competitor Stumble', 'competitive', 'Negative news about competitor creates positioning opportunity', 
       '{"triggers": ["negative sentiment", "executive departure", "product failure", "lawsuit"], "threshold": 0.7}',
       '24-48 hours', 'Position as stable alternative, offer expert commentary'),
      ('Narrative Vacuum', 'thought_leadership', 'Topic trending with no clear expert voice',
       '{"triggers": ["high search volume", "journalist queries", "no dominant voice"], "threshold": 0.6}',
       '3-5 days', 'Provide expert commentary, publish thought leadership'),
      ('News Hijacking', 'reactive', 'Breaking news tangentially related to your expertise',
       '{"triggers": ["breaking news", "industry relevance", "unique angle"], "threshold": 0.8}',
       '2-6 hours', 'Rapid response with unique perspective'),
      ('Regulatory Change', 'strategic', 'New regulations affecting your industry',
       '{"triggers": ["policy announcement", "comment period", "industry impact"], "threshold": 0.5}',
       '2-4 weeks', 'Publish analysis, offer expert testimony'),
      ('Viral Moment', 'social', 'Rapidly spreading content relevant to brand',
       '{"triggers": ["viral velocity", "sentiment alignment", "brand relevance"], "threshold": 0.75}',
       '6-12 hours', 'Amplify with brand perspective, engage authentically'),
      ('Cascade Event', 'predictive', 'Event likely to trigger downstream effects',
       '{"triggers": ["supply chain disruption", "market shift", "technology breakthrough"], "threshold": 0.65}',
       '1-7 days', 'Position ahead of cascade, prepare responses')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Initial patterns inserted');
    
    // Create trigger function
    console.log('\n🔧 Creating trigger function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✅ Trigger function created');
    
    // Add triggers
    console.log('Creating update triggers...');
    await pool.query('DROP TRIGGER IF EXISTS update_opportunity_patterns_updated_at ON opportunity_patterns');
    await pool.query(`
      CREATE TRIGGER update_opportunity_patterns_updated_at 
      BEFORE UPDATE ON opportunity_patterns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await pool.query('DROP TRIGGER IF EXISTS update_opportunity_queue_updated_at ON opportunity_queue');
    await pool.query(`
      CREATE TRIGGER update_opportunity_queue_updated_at 
      BEFORE UPDATE ON opportunity_queue
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    await pool.query('DROP TRIGGER IF EXISTS update_source_performance_updated_at ON source_performance');
    await pool.query(`
      CREATE TRIGGER update_source_performance_updated_at 
      BEFORE UPDATE ON source_performance
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Triggers created')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tables = [
      'opportunity_patterns',
      'opportunity_queue', 
      'cascade_predictions',
      'source_performance',
      'opportunity_feedback'
    ];
    
    for (const table of tables) {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' not found`);
      }
    }
    
    // Create stakeholder tables if they don't exist
    console.log('\n🔍 Creating stakeholder tables if needed...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stakeholder_profiles (
        id SERIAL PRIMARY KEY,
        company_id VARCHAR(255),
        stakeholder_name VARCHAR(255),
        stakeholder_type VARCHAR(50),
        influence_score DECIMAL(3,2),
        predictability_score DECIMAL(3,2),
        typical_response_time_days INTEGER,
        behavioral_profile JSONB,
        historical_actions JSONB,
        trigger_patterns JSONB,
        communication_style JSONB,
        network_connections JSONB,
        last_action_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Stakeholder profiles table ready');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_status (
        id SERIAL PRIMARY KEY,
        organization_id VARCHAR(255) UNIQUE,
        monitoring BOOLEAN DEFAULT false,
        active_targets INTEGER DEFAULT 0,
        active_sources INTEGER DEFAULT 0,
        health VARCHAR(20) DEFAULT 'good',
        last_scan TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Monitoring status table ready');
    
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Navigate to the Opportunity Dashboard in the frontend');
    console.log('3. Click "Start Monitoring" to begin detecting opportunities');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();