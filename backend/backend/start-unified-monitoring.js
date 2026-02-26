#!/usr/bin/env node

/**
 * START UNIFIED MONITORING
 * Launches the continuous monitoring service that uses ALL 352+ sources
 */

const UnifiedMonitoringService = require('./src/services/UnifiedMonitoringService');

async function startMonitoring() {
  console.log('🚀 UNIFIED MONITORING SYSTEM STARTUP');
  console.log('=' .repeat(60));
  console.log('This service will:');
  console.log('  ✓ Monitor 154 RSS feeds across 25 industries');
  console.log('  ✓ Query 192 Google News searches');
  console.log('  ✓ Process data every 5 minutes');
  console.log('  ✓ Store all articles in database');
  console.log('  ✓ Detect opportunities in real-time');
  console.log('=' .repeat(60));
  console.log('');
  
  // Start with 5 minute intervals
  await UnifiedMonitoringService.startContinuousMonitoring(5);
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n\n⚠️ Shutting down monitoring service...');
    UnifiedMonitoringService.stopMonitoring();
    process.exit(0);
  });
  
  // Log status every 30 seconds
  setInterval(async () => {
    const status = await UnifiedMonitoringService.getMonitoringStatus();
    console.log(`\n📊 Status Update: ${new Date().toISOString()}`);
    console.log(`  Active: ${status.is_monitoring}`);
    console.log(`  Total Fetches: ${status.fetch_stats.total_fetches}`);
    console.log(`  Successful: ${status.fetch_stats.successful_fetches}`);
    console.log(`  Articles Collected: ${status.fetch_stats.total_articles}`);
  }, 30000);
  
  console.log('\n✅ Monitoring service is running. Press Ctrl+C to stop.\n');
}

// Run
startMonitoring().catch(error => {
  console.error('❌ Failed to start monitoring:', error);
  process.exit(1);
});