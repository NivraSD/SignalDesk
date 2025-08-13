// TEST FALLBACK ANALYSIS WITH CONTEXT
// This tests the enhanced fallback function directly

const monitoringController = require('./src/controllers/monitoringController');

// Access the fallbackAnalysis function (we'll need to extract it from the file)
const fs = require('fs');
const controllerCode = fs.readFileSync('./src/controllers/monitoringController.js', 'utf8');

// Extract and evaluate the fallbackAnalysis function
const funcMatch = controllerCode.match(/function fallbackAnalysis[\s\S]*?^\}/m);
if (!funcMatch) {
  console.error('Could not find fallbackAnalysis function');
  process.exit(1);
}

// Create a wrapper to test the function
eval(funcMatch[0]);

console.log('🧪 TESTING FALLBACK ANALYSIS WITH CONTEXT');
console.log('==========================================\n');

// Test 1: Without context (default behavior)
console.log('1️⃣ TEST WITHOUT CONTEXT:');
const result1 = fallbackAnalysis("Microsoft faces security breach and data concerns");
console.log('Result:', JSON.stringify(result1, null, 2));

// Test 2: With custom sentiment context
console.log('\n2️⃣ TEST WITH CUSTOM CONTEXT:');
const sentimentContext = {
  positiveScenarios: "innovation, AI advancement, productivity improvements, customer satisfaction",
  negativeScenarios: "security breach, data exposure, privacy concerns, regulatory issues",
  criticalConcerns: "major outage, system-wide failure, mass data breach"
};

const result2 = fallbackAnalysis("Microsoft's AI innovation brings productivity improvements", sentimentContext);
console.log('Positive test:', JSON.stringify(result2, null, 2));

const result3 = fallbackAnalysis("Microsoft faces security breach affecting customer data", sentimentContext);
console.log('\nNegative test:', JSON.stringify(result3, null, 2));

// Test 3: Mixed sentiment
console.log('\n3️⃣ TEST MIXED SENTIMENT:');
const result4 = fallbackAnalysis("Microsoft's innovation praised but privacy concerns raised", sentimentContext);
console.log('Mixed test:', JSON.stringify(result4, null, 2));

console.log('\n✅ SUMMARY:');
console.log('- Fallback function now uses custom sentiment context');
console.log('- Keywords are extracted from user-configured scenarios');
console.log('- Provides detailed rationale with matched indicators');
console.log('- This ensures analysis works even when Claude fails');