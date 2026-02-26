// Debug Helper for Intelligence Display Issue
// Add this to your browser console to see what data is available

// Check what's in localStorage
console.log('🔍 Checking cached data...');
const keys = ['signaldesk_synthesis', 'signaldesk_complete_profile', 'signaldesk_organization'];
keys.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`✅ ${key}:`, parsed);
    } catch (e) {
      console.log(`❌ ${key}: Invalid JSON`);
    }
  } else {
    console.log(`⚠️ ${key}: Not found`);
  }
});

// Check if finalIntelligence is being set
console.log('🎯 To debug the display issue:');
console.log('1. Open browser DevTools Console');
console.log('2. Run the pipeline again');
console.log('3. Look for these log messages:');
console.log('   - "🔄 ELABORATE SYNTHESIS: Combining insights from all stages..."');
console.log('   - "📈 Extracted data from stages:"');
console.log('   - "📁 Generated tabs:"');
console.log('4. Check what finalIntelligence contains');

// Function to extract and display the current state
window.debugIntelligence = function() {
  const synthesis = localStorage.getItem('signaldesk_synthesis');
  if (synthesis) {
    const data = JSON.parse(synthesis);
    console.log('📊 Current synthesis data structure:', {
      hasAnalysis: !!data.analysis,
      hasTabs: !!data.tabs,
      tabKeys: data.tabs ? Object.keys(data.tabs) : [],
      analysisKeys: data.analysis ? Object.keys(data.analysis) : [],
      hasOpportunities: !!data.opportunities,
      opportunityCount: data.opportunities?.length || 0
    });
    
    if (data.tabs) {
      console.log('📑 Tab contents:');
      Object.entries(data.tabs).forEach(([key, value]) => {
        console.log(`  ${key}:`, value);
      });
    }
  }
};

console.log('💡 Run window.debugIntelligence() to see current data structure');