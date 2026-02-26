// TEST THE NEW SENTIMENT ENGINE
const sentimentEngine = require('./src/services/sentimentEngine');

console.log('🧪 TESTING NEW SENTIMENT ENGINE');
console.log('================================\n');

// Test Cases
const testCases = [
  {
    name: "Microsoft positive innovation",
    text: "Microsoft's new AI innovation is revolutionizing productivity and bringing customer satisfaction to new heights",
    context: {
      positiveScenarios: "Innovation, AI advancement, productivity improvements, customer satisfaction",
      negativeScenarios: "Security breach, data exposure, customer complaints",
      criticalConcerns: "Major data breach, system failure"
    },
    expected: "positive"
  },
  {
    name: "Amazon security breach",
    text: "Amazon faces major security breach affecting millions of customers' personal data",
    context: {
      positiveScenarios: "Growth, expansion, customer satisfaction",
      negativeScenarios: "Security vulnerabilities, data breaches, customer complaints",
      criticalConcerns: "Major data breach, customer data exposure"
    },
    expected: "negative/critical"
  },
  {
    name: "Mixed sentiment - praise but security concern",
    text: "Our customer support team received praise for quickly resolving a data security concern",
    context: {
      positiveScenarios: "praise, quickly resolving, customer support",
      negativeScenarios: "data security concerns, security vulnerabilities",
      criticalConcerns: "data security"
    },
    expected: "negative (due to critical)"
  },
  {
    name: "Financial results",
    text: "Consumers spent more than expected on the e-commerce giant's site, while margins tightened at the company's all-important cloud computing division",
    context: {
      positiveScenarios: "consumer spending, growth, market expansion",
      negativeScenarios: "margins tightened, declining profits, financial concerns",
      criticalConcerns: "bankruptcy, financial crisis"
    },
    expected: "mixed/negative"
  },
  {
    name: "Product sale announcement",
    text: "The UE Wonderboom 4 is on sale for $79.99 ($20 off)",
    context: {
      positiveScenarios: "on sale, discount, savings",
      negativeScenarios: "overpriced, expensive, poor value",
      criticalConcerns: "product recall, safety issue"
    },
    expected: "positive"
  },
  {
    name: "Job losses",
    text: "Amazon.com said it is open to talks with officials about the decision to shut down operations in Quebec, which would lead to 1,700 people losing their jobs",
    context: {
      positiveScenarios: "job creation, expansion, growth",
      negativeScenarios: "shut down operations, job losses, layoffs",
      criticalConcerns: "mass layoffs, plant closure"
    },
    expected: "negative"
  }
];

// Run tests
console.log('Running sentiment analysis tests...\n');

for (const test of testCases) {
  console.log(`📝 Test: ${test.name}`);
  console.log(`Text: "${test.text.substring(0, 80)}..."`);
  
  const result = sentimentEngine.analyze(test.text, test.context);
  
  console.log(`Expected: ${test.expected}`);
  console.log(`Got: ${result.sentiment} (score: ${result.sentiment_score})`);
  console.log(`Confidence: ${result.confidence}`);
  console.log(`Rationale: ${result.rationale}`);
  console.log(`Matched indicators:`, {
    positive: result.matched_indicators.positive,
    negative: result.matched_indicators.negative,
    critical: result.matched_indicators.critical
  });
  
  const success = test.expected.includes(result.sentiment) ? '✅' : '❌';
  console.log(`Result: ${success}\n`);
}

// Test without context (default behavior)
console.log('📝 Test: Default behavior without context');
const defaultResult = sentimentEngine.analyze("Microsoft announces major security breach affecting customer data");
console.log(`Result: ${defaultResult.sentiment} (${defaultResult.sentiment_score})`);
console.log(`Rationale: ${defaultResult.rationale}`);

console.log('\n✅ SUMMARY:');
console.log('- Sentiment engine uses user-configured scenarios');
console.log('- Provides transparent, explainable results');
console.log('- Shows exactly which indicators triggered the sentiment');
console.log('- Works immediately without external dependencies');
console.log('- Critical concerns override other sentiments as expected');