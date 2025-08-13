// RESET SCRIPT: Clear all monitoring data and start fresh
// Run this in browser console to reset the monitoring system

(function resetMonitoring() {
  console.log('🔄 RESETTING MONITORING SYSTEM...\n');
  
  // Clear localStorage
  console.log('1️⃣ Clearing localStorage...');
  localStorage.removeItem('aiMonitorConfig');
  localStorage.removeItem('aiMonitorMentions');
  console.log('✅ localStorage cleared');
  
  // Clear session storage
  console.log('\n2️⃣ Clearing sessionStorage...');
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
  
  console.log('\n✅ RESET COMPLETE!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Refresh the page (F5 or Cmd+R)');
  console.log('2. Go to AI Monitoring');
  console.log('3. In Data Sources tab:');
  console.log('   - Add your monitoring keywords');
  console.log('   - Click "Save Data Source Configuration"');
  console.log('4. In AI Config tab:');
  console.log('   - Add positive scenarios (what\'s good for your brand)');
  console.log('   - Add negative scenarios (what\'s concerning)');
  console.log('   - Add critical concerns (crisis situations)');
  console.log('   - Click "Save AI Configuration"');
  console.log('5. In Live Feed tab:');
  console.log('   - Click "Fetch Mentions"');
  console.log('   - Click "Analyze All"');
  console.log('\n💡 TIP: Check browser console for detailed logs');
  console.log('   Look for messages starting with "===" to trace the flow');
  
  return 'Reset complete - please refresh the page';
})();