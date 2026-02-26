// TEST FALLBACK ANALYSIS FUNCTION ONLY

// Standalone fallback analysis function (copied from monitoringController.js)
function fallbackAnalysis(text, sentimentContext = null) {
  const lowerText = text.toLowerCase();
  
  // Default keywords
  let positiveKeywords = ['excellent', 'amazing', 'love', 'great', 'fantastic', 'success', 'innovation', 'growth'];
  let negativeKeywords = ['terrible', 'awful', 'hate', 'disappointed', 'issue', 'problem', 'concern', 'fail'];
  let criticalKeywords = ['breach', 'lawsuit', 'fraud', 'outage', 'crisis', 'scandal', 'investigation'];
  
  // Extract keywords from sentiment context if provided
  if (sentimentContext) {
    if (sentimentContext.positiveScenarios) {
      const contextPositive = sentimentContext.positiveScenarios.toLowerCase()
        .split(/[,.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      positiveKeywords = [...positiveKeywords, ...contextPositive];
    }
    if (sentimentContext.negativeScenarios) {
      const contextNegative = sentimentContext.negativeScenarios.toLowerCase()
        .split(/[,.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      negativeKeywords = [...negativeKeywords, ...contextNegative];
    }
    if (sentimentContext.criticalConcerns) {
      const contextCritical = sentimentContext.criticalConcerns.toLowerCase()
        .split(/[,.\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      criticalKeywords = [...criticalKeywords, ...contextCritical];
    }
  }
  
  let positiveCount = 0;
  let negativeCount = 0;
  let criticalCount = 0;
  let matchedKeywords = [];
  
  positiveKeywords.forEach(keyword => {
    if (keyword && lowerText.includes(keyword)) {
      positiveCount++;
      matchedKeywords.push(`+${keyword}`);
    }
  });
  
  negativeKeywords.forEach(keyword => {
    if (keyword && lowerText.includes(keyword)) {
      negativeCount++;
      matchedKeywords.push(`-${keyword}`);
    }
  });
  
  criticalKeywords.forEach(keyword => {
    if (keyword && lowerText.includes(keyword)) {
      criticalCount++;
      matchedKeywords.push(`!${keyword}`);
    }
  });
  
  let sentiment = 'neutral';
  let sentimentScore = 0;
  let rationale = '';
  
  if (criticalCount > 0) {
    sentiment = 'negative';
    sentimentScore = -80;
    rationale = `Critical concerns detected: ${matchedKeywords.filter(k => k.startsWith('!')).join(', ')}`;
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
    sentimentScore = Math.min(positiveCount * 20, 80);
    rationale = `Positive indicators found: ${matchedKeywords.filter(k => k.startsWith('+')).join(', ')}`;
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    sentimentScore = Math.max(negativeCount * -20, -80);
    rationale = `Negative indicators found: ${matchedKeywords.filter(k => k.startsWith('-')).join(', ')}`;
  } else {
    rationale = matchedKeywords.length > 0 
      ? `Mixed indicators: ${matchedKeywords.join(', ')}` 
      : 'No clear sentiment indicators found in text';
  }
  
  return {
    sentiment,
    sentiment_score: sentimentScore,
    confidence: 0.6,
    summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} sentiment detected.`,
    rationale: rationale,
    key_topics: matchedKeywords.map(k => k.substring(1)),
    urgency_level: criticalCount > 0 ? 'high' : (negativeCount > 2 ? 'medium' : 'low'),
    actionable_insights: null,
    recommended_action: null,
    is_fallback: true
  };
}

console.log('🧪 TESTING ENHANCED FALLBACK ANALYSIS');
console.log('=====================================\n');

// Test 1: Default behavior (no context)
console.log('1️⃣ DEFAULT BEHAVIOR (NO CONTEXT):');
console.log('Text: "Microsoft faces security breach"');
const result1 = fallbackAnalysis("Microsoft faces security breach");
console.log('Result:', result1.sentiment, '(', result1.sentiment_score, ')');
console.log('Rationale:', result1.rationale);

// Test 2: With user's custom context
console.log('\n2️⃣ WITH CUSTOM SENTIMENT CONTEXT:');
const customContext = {
  positiveScenarios: "AI innovation, productivity improvements, customer satisfaction, market leadership",
  negativeScenarios: "security breach, data exposure, privacy concerns, regulatory issues",
  criticalConcerns: "major outage, system failure, mass data breach"
};

console.log('\nPositive test: "Microsoft\'s AI innovation brings productivity improvements"');
const result2 = fallbackAnalysis("Microsoft's AI innovation brings productivity improvements", customContext);
console.log('Result:', result2.sentiment, '(', result2.sentiment_score, ')');
console.log('Rationale:', result2.rationale);
console.log('Matched topics:', result2.key_topics);

console.log('\nNegative test: "Microsoft faces security breach with data exposure"');
const result3 = fallbackAnalysis("Microsoft faces security breach with data exposure", customContext);
console.log('Result:', result3.sentiment, '(', result3.sentiment_score, ')');
console.log('Rationale:', result3.rationale);
console.log('Matched topics:', result3.key_topics);

console.log('\nMixed test: "Microsoft\'s innovation praised but privacy concerns raised"');
const result4 = fallbackAnalysis("Microsoft's innovation praised but privacy concerns raised", customContext);
console.log('Result:', result4.sentiment, '(', result4.sentiment_score, ')');
console.log('Rationale:', result4.rationale);
console.log('Matched topics:', result4.key_topics);

// Test 3: Real example from user
console.log('\n3️⃣ REAL EXAMPLE FROM USER:');
console.log('Text: "Our customer support team received praise for quickly resolving a data security concern."');
const userContext = {
  positiveScenarios: "praise, quickly resolving, customer support",
  negativeScenarios: "data security concerns, security vulnerabilities",
  criticalConcerns: "data security"
};

const result5 = fallbackAnalysis("Our customer support team received praise for quickly resolving a data security concern.", userContext);
console.log('Result:', result5.sentiment, '(', result5.sentiment_score, ')');
console.log('Rationale:', result5.rationale);
console.log('Matched topics:', result5.key_topics);

console.log('\n✅ SUMMARY:');
console.log('- Fallback now extracts keywords from user-configured scenarios');
console.log('- Provides clear rationale explaining which indicators were found');
console.log('- Works even when Claude is unavailable or returns invalid JSON');
console.log('- Uses the same sentiment context configured in AI Config tab');