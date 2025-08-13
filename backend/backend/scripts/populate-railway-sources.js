// Populate Railway database with sources
const { Pool } = require('pg');
require('dotenv').config();

async function populateSources() {
  console.log('🚀 Populating Railway Database with Sources...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    
    // Load source configuration from existing file
    const registry = require('../src/services/MasterSourceRegistry.js');
    const sourceConfig = registry.sources;
    
    console.log('📊 Loading source configurations...');
    
    let totalRSS = 0;
    let totalGoogleNews = 0;
    let totalIndustries = 0;
    
    for (const [industry, config] of Object.entries(sourceConfig)) {
      totalIndustries++;
      const sourceData = {
        entity_type: 'industry',
        entity_name: industry,
        entity_data: {
          name: industry,
          rss_feeds: config.rss || [],
          google_news_queries: config.google_news || [],
          websites: config.websites || []
        },
        index_data: {
          rss_count: config.rss?.length || 0,
          google_news_count: config.google_news?.length || 0,
          website_count: config.websites?.length || 0
        },
        source_count: (config.rss?.length || 0) + (config.google_news?.length || 0) + (config.websites?.length || 0)
      };
      
      totalRSS += config.rss?.length || 0;
      totalGoogleNews += config.google_news?.length || 0;
      
      await pool.query(`
        INSERT INTO source_indexes 
        (entity_type, entity_name, entity_data, index_data, source_count)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        sourceData.entity_type,
        sourceData.entity_name,
        JSON.stringify(sourceData.entity_data),
        JSON.stringify(sourceData.index_data),
        sourceData.source_count
      ]);
      
      console.log(`✅ Loaded ${industry}: ${sourceData.source_count} sources`);
    }
    
    console.log('\n📊 Summary:');
    console.log(`  Industries: ${totalIndustries}`);
    console.log(`  RSS Feeds: ${totalRSS}`);
    console.log(`  Google News Queries: ${totalGoogleNews}`);
    console.log(`  Total Sources: ${totalRSS + totalGoogleNews}`);
    
    // Verify the data
    const count = await pool.query('SELECT COUNT(*) FROM source_indexes');
    console.log(`\n✅ Database now contains ${count.rows[0].count} source configurations`);
    
  } catch (error) {
    console.error('❌ Failed to populate sources:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

populateSources();