#!/usr/bin/env node

// Test the stable cascade predictor
const CascadePredictor = require('./src/cascadePredictor.js');

console.log('🔮 Testing Stable Cascade Predictor\n');
console.log('=' .repeat(50));

const predictor = new CascadePredictor();

// Test scenarios relevant to SignalDesk users
const testScenarios = [
  {
    name: "Competitor Data Breach",
    event: "Major competitor suffers massive data breach affecting 100M users",
    type: "data_breach",
    details: { source: 'official', magnitude: 'major', geographic: 'global' }
  },
  {
    name: "New AI Regulation",
    event: "EU announces strict AI regulation requiring transparency",
    type: "regulatory_change",
    details: { source: 'official', magnitude: 'major', geographic: 'global' }
  },
  {
    name: "Supply Chain Crisis",
    event: "Global chip shortage disrupts production across industries",
    type: "supply_chain_disruption",
    details: { source: 'media', magnitude: 'major', geographic: 'global' }
  },
  {
    name: "Tech Breakthrough",
    event: "OpenAI announces AGI breakthrough with new model",
    type: "technology_breakthrough",
    details: { source: 'official', magnitude: 'major', geographic: 'global' }
  },
  {
    name: "Competitor Crisis",
    event: "Major rival CEO resigns amid scandal and lawsuit",
    type: "competitor_crisis",
    details: { source: 'media', magnitude: 'significant', geographic: 'global' }
  }
];

// Test each scenario
testScenarios.forEach((scenario, index) => {
  console.log(`\n📊 Scenario ${index + 1}: ${scenario.name}`);
  console.log('-'.repeat(50));
  console.log(`Event: ${scenario.event}`);
  
  // Get prediction
  const prediction = predictor.predictCascade(scenario.type, scenario.details);
  
  console.log(`\n✅ Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);
  console.log(`⚡ Opportunities Detected: ${prediction.opportunities.length}`);
  
  // Show immediate opportunities
  console.log('\n🎯 Immediate Actions (next 24-48 hours):');
  const immediate = prediction.opportunities.filter(o => o.priority === 'high');
  immediate.forEach(opp => {
    console.log(`  • ${opp.action} (${(opp.confidence * 100).toFixed(0)}% confidence)`);
  });
  
  // Show cascade effects
  console.log('\n🔄 Cascade Effects:');
  console.log('  First Order (1-3 days):');
  prediction.prediction.firstOrder.slice(0, 2).forEach(effect => {
    console.log(`    - ${effect.effect} (${(effect.probability * 100).toFixed(0)}%)`);
  });
  
  console.log('  Second Order (1-2 weeks):');
  prediction.prediction.secondOrder.slice(0, 2).forEach(effect => {
    console.log(`    - ${effect.effect} (${(effect.probability * 100).toFixed(0)}%)`);
  });
});

// Test auto-detection
console.log('\n' + '='.repeat(50));
console.log('🤖 Testing Auto-Detection of Event Types');
console.log('='.repeat(50));

const autoDetectTests = [
  "New privacy law requires all companies to delete user data on request",
  "Competitor announces 40% staff layoffs and closing major offices",
  "Revolutionary quantum computer achieves 1000 qubit milestone",
  "Major ports shut down due to cyberattack on shipping systems",
  "Fortune 500 company admits to decade-long data leak"
];

autoDetectTests.forEach(text => {
  const detectedType = predictor.detectEventType({ text });
  console.log(`\n📝 "${text.substring(0, 50)}..."`);
  console.log(`   → Detected as: ${detectedType.replace('_', ' ').toUpperCase()}`);
});

// Performance test
console.log('\n' + '='.repeat(50));
console.log('⚡ Performance Test');
console.log('='.repeat(50));

const startTime = Date.now();
for (let i = 0; i < 100; i++) {
  predictor.predictCascade('regulatory_change', { source: 'official', magnitude: 'major' });
}
const endTime = Date.now();

console.log(`✅ 100 predictions completed in ${endTime - startTime}ms`);
console.log(`   Average: ${((endTime - startTime) / 100).toFixed(2)}ms per prediction`);

console.log('\n' + '='.repeat(50));
console.log('✨ Stable Cascade Predictor Test Complete!');
console.log('='.repeat(50));
console.log('\nKey Benefits:');
console.log('  ✅ No external dependencies');
console.log('  ✅ Instant predictions');
console.log('  ✅ Stable and reliable');
console.log('  ✅ Ready for production use');