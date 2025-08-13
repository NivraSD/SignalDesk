#!/usr/bin/env node

const IntelligenceIndexer = require('../src/services/intelligenceIndexer');

async function buildIntelligenceDatabase() {
  console.log('=====================================');
  console.log('🧠 INTELLIGENCE DATABASE BUILDER');
  console.log('=====================================');
  console.log('This will populate the database with:');
  console.log('• Top 15 industries');
  console.log('• Top 15 companies per industry');
  console.log('• Top 15 topics per industry');
  console.log('• Relevant sources for each');
  console.log('=====================================\n');

  const indexer = new IntelligenceIndexer();
  
  try {
    const startTime = Date.now();
    
    // Build the intelligence database
    const results = await indexer.buildIntelligenceDatabase();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n=====================================');
    console.log('✅ BUILD COMPLETE');
    console.log('=====================================');
    console.log(`Duration: ${duration} seconds`);
    console.log(`Industries indexed: ${results.industries}`);
    console.log(`Companies indexed: ${results.companies}`);
    console.log(`Topics indexed: ${results.topics}`);
    console.log(`Sources indexed: ${results.sources}`);
    console.log('=====================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildIntelligenceDatabase();
}

module.exports = buildIntelligenceDatabase;