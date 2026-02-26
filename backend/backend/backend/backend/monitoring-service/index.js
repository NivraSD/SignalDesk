// SignalDesk Monitoring Service
// Runs independently to collect news and generate opportunities
import cron from 'node-cron';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Simple monitoring function
async function runMonitoring() {
  console.log(`[${new Date().toISOString()}] Starting monitoring cycle...`);
  
  try {
    // Get active organizations
    const orgsResult = await pool.query('SELECT id, name FROM organizations WHERE active = true');
    console.log(`Found ${orgsResult.rows.length} active organizations`);
    
    for (const org of orgsResult.rows) {
      console.log(`Monitoring ${org.name}...`);
      
      // Here you would:
      // 1. Fetch news from RSS feeds and Google News
      // 2. Store articles in database
      // 3. Run analysis
      // 4. Generate opportunities
      
      // For now, just log
      console.log(`✓ Completed monitoring for ${org.name}`);
    }
    
    console.log('Monitoring cycle complete');
  } catch (error) {
    console.error('Monitoring error:', error);
  }
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', runMonitoring);

// Run once on startup
runMonitoring();

console.log('🚀 SignalDesk Monitoring Service Started');
console.log('⏰ Monitoring will run every 5 minutes');