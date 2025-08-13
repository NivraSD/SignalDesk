// Fix duplicate article storage issue
const pool = require('../src/config/db');

async function fixDuplicateHandling() {
  console.log('🔧 Fixing duplicate article handling...\n');
  
  try {
    // 1. Check current duplicate count
    const dupeCheck = await pool.query(`
      SELECT url, COUNT(*) as count 
      FROM intelligence_findings 
      WHERE url IS NOT NULL 
      GROUP BY url 
      HAVING COUNT(*) > 1
      LIMIT 10
    `);
    
    console.log(`Found ${dupeCheck.rows.length} duplicate URLs in database`);
    
    // 2. Remove duplicates, keeping the oldest
    if (dupeCheck.rows.length > 0) {
      console.log('Removing duplicates...');
      
      const result = await pool.query(`
        DELETE FROM intelligence_findings a
        USING intelligence_findings b
        WHERE a.id > b.id 
        AND a.url = b.url
        AND a.url IS NOT NULL
      `);
      
      console.log(`✅ Removed ${result.rowCount} duplicate articles`);
    }
    
    // 3. Check total articles
    const total = await pool.query('SELECT COUNT(*) FROM intelligence_findings');
    console.log(`\n📊 Total articles in database: ${total.rows[0].count}`);
    
    // 4. Show recent articles
    const recent = await pool.query(`
      SELECT 
        COUNT(*) as count,
        DATE_TRUNC('hour', created_at) as hour
      FROM intelligence_findings
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour DESC
      LIMIT 5
    `);
    
    console.log('\n📈 Articles stored in last 24 hours:');
    recent.rows.forEach(row => {
      console.log(`  ${row.hour.toISOString().substring(0, 16)}: ${row.count} articles`);
    });
    
    // 5. Fix the storage function to handle duplicates better
    console.log('\n💡 Recommendation:');
    console.log('The UnifiedMonitoringService should use INSERT ... ON CONFLICT (url) DO NOTHING');
    console.log('This will skip duplicates instead of throwing errors');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDuplicateHandling();