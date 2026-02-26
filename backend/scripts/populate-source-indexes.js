/**
 * POPULATE SOURCE INDEXES
 * Loads ALL sources from MasterSourceRegistry into the database
 * Ensures 100% source utilization
 */

const pool = require('../src/config/db');
const MasterSourceRegistry = require('../src/services/MasterSourceRegistry');

async function populateSourceIndexes() {
  console.log('🚀 POPULATING SOURCE INDEXES WITH ALL AVAILABLE SOURCES');
  
  try {
    // Get statistics first
    const stats = MasterSourceRegistry.getSourceStats();
    console.log('\n📊 SOURCE STATISTICS:');
    console.log(`Total RSS Feeds: ${stats.total_rss}`);
    console.log(`Total Google News Queries: ${stats.total_google_news}`);
    console.log(`Total Websites: ${stats.total_websites}`);
    console.log(`GRAND TOTAL: ${stats.grand_total} sources`);
    console.log('\nBy Industry:');
    Object.entries(stats.by_industry).forEach(([industry, counts]) => {
      console.log(`  ${industry}: RSS=${counts.rss}, Google=${counts.google_news}, Web=${counts.websites}`);
    });
    
    // Clear existing source_indexes (optional - comment out to append)
    console.log('\n🗑️ Clearing existing source indexes...');
    await pool.query('DELETE FROM source_indexes');
    
    // Prepare all industry sources
    const industries = Object.keys(MasterSourceRegistry.sources);
    let totalInserted = 0;
    
    for (const industry of industries) {
      console.log(`\n📁 Processing ${industry.toUpperCase()} industry...`);
      
      const industryData = MasterSourceRegistry.getIndustrySources(industry);
      const sourceData = {
        sources: {
          rss_feeds: industryData.rss || [],
          google_news_queries: industryData.google_news || [],
          websites: industryData.websites || [],
          api_endpoints: [],
          social_media: []
        },
        metadata: {
          industry,
          created_at: new Date().toISOString(),
          total_sources: (industryData.rss?.length || 0) + 
                        (industryData.google_news?.length || 0) + 
                        (industryData.websites?.length || 0),
          priority: 'high',
          active: true
        }
      };
      
      // Create index data for searchability
      const indexData = {
        keywords: [industry, ...industryData.google_news || []],
        categories: ['industry', 'monitoring', 'news'],
        search_terms: industryData.google_news || [],
        rss_urls: (industryData.rss || []).map(r => r.url)
      };
      
      // Insert industry sources with both entity_data and index_data
      const result = await pool.query(
        `INSERT INTO source_indexes (entity_type, entity_name, entity_data, index_data, source_count) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        ['industry', industry, JSON.stringify(sourceData), JSON.stringify(indexData), sourceData.metadata.total_sources]
      );
      
      console.log(`  ✅ Inserted ${industry} with ID: ${result.rows[0].id}`);
      console.log(`     RSS: ${sourceData.sources.rss_feeds.length}`);
      console.log(`     Google News: ${sourceData.sources.google_news_queries.length}`);
      console.log(`     Websites: ${sourceData.sources.websites.length}`);
      totalInserted++;
    }
    
    // Add global news sources as a separate entry
    console.log('\n📁 Processing GLOBAL news sources...');
    const globalSourceData = {
      sources: {
        rss_feeds: MasterSourceRegistry.globalSources.major_news,
        google_news_queries: [],
        websites: [],
        api_endpoints: MasterSourceRegistry.globalSources.api_sources,
        social_media: MasterSourceRegistry.globalSources.social_platforms
      },
      metadata: {
        industry: 'global',
        created_at: new Date().toISOString(),
        total_sources: MasterSourceRegistry.globalSources.major_news.length,
        priority: 'critical',
        active: true
      }
    };
    
    // Create index data for global sources
    const globalIndexData = {
      keywords: ['global', 'news', 'business', 'technology', 'finance'],
      categories: ['global', 'major_news', 'api', 'social'],
      search_terms: ['breaking news', 'world news', 'business news'],
      rss_urls: MasterSourceRegistry.globalSources.major_news.map(r => r.url)
    };
    
    const globalResult = await pool.query(
      `INSERT INTO source_indexes (entity_type, entity_name, entity_data, index_data, source_count) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      ['global', 'global_news', JSON.stringify(globalSourceData), JSON.stringify(globalIndexData), 
       globalSourceData.metadata.total_sources]
    );
    
    console.log(`  ✅ Inserted global sources with ID: ${globalResult.rows[0].id}`);
    console.log(`     RSS: ${globalSourceData.sources.rss_feeds.length}`);
    console.log(`     APIs: ${globalSourceData.sources.api_endpoints.length}`);
    console.log(`     Social: ${globalSourceData.sources.social_media.length}`);
    totalInserted++;
    
    // Create a master index entry that references all sources
    console.log('\n📁 Creating MASTER index entry...');
    const allSources = MasterSourceRegistry.getAllSources();
    const allGoogleQueries = MasterSourceRegistry.getAllGoogleNewsQueries();
    
    const masterData = {
      sources: {
        total_rss_feeds: allSources.length,
        total_google_queries: allGoogleQueries.length,
        industries_covered: industries.length,
        last_updated: new Date().toISOString()
      },
      metadata: {
        type: 'master_index',
        version: '2.0',
        description: 'Master index of all monitoring sources across 25 industries',
        stats: stats
      }
    };
    
    // Create master index data
    const masterIndexData = {
      keywords: ['all', 'master', 'complete', ...industries],
      categories: ['master_index'],
      total_sources: stats.grand_total,
      industries: industries
    };
    
    await pool.query(
      `INSERT INTO source_indexes (entity_type, entity_name, entity_data, index_data, source_count) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['master', 'all_sources', JSON.stringify(masterData), JSON.stringify(masterIndexData), stats.grand_total]
    );
    totalInserted++;
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SOURCE INDEX POPULATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total entries created: ${totalInserted}`);
    console.log(`Total RSS sources: ${stats.total_rss}`);
    console.log(`Total Google News queries: ${stats.total_google_news}`);
    console.log(`Total websites: ${stats.total_websites}`);
    console.log(`GRAND TOTAL SOURCES: ${stats.grand_total}`);
    console.log('\n🎯 100% SOURCE UTILIZATION ACHIEVED!');
    
    // Verify the data
    const verifyResult = await pool.query('SELECT COUNT(*) FROM source_indexes');
    console.log(`\n✓ Verified: ${verifyResult.rows[0].count} entries in source_indexes table`);
    
  } catch (error) {
    console.error('❌ ERROR populating source indexes:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  populateSourceIndexes()
    .then(() => {
      console.log('\n👋 Exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = populateSourceIndexes;