const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:5001/api';
const TEST_TOKEN = 'YOUR_AUTH_TOKEN'; // You'll need to set this from browser localStorage

// Test data
const testText = "Our customer support team received praise for quickly resolving a data security concern.";

// Test 1: Direct sentiment test (hardcoded context)
async function testDirect() {
  console.log('\n=== TEST 1: Direct sentiment test (hardcoded context) ===');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-sentiment`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('Response:', data);
    if (data.parsed) {
      console.log('Sentiment:', data.parsed.sentiment);
      console.log('Score:', data.parsed.sentiment_score);
      console.log('Rationale:', data.parsed.rationale);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 2: Context test (uses saved config)
async function testWithContext() {
  console.log('\n=== TEST 2: Sentiment test with saved context ===');
  try {
    const response = await fetch(`${API_URL}/monitoring/test-sentiment-context`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: testText })
    });
    const data = await response.json();
    console.log('Response:', data);
    if (data.sentimentContext) {
      console.log('Loaded context:', {
        hasPositive: !!data.sentimentContext.positiveScenarios,
        hasNegative: !!data.sentimentContext.negativeScenarios,
        hasCritical: !!data.sentimentContext.criticalConcerns
      });
    }
    if (data.parsed) {
      console.log('Sentiment:', data.parsed.sentiment);
      console.log('Score:', data.parsed.sentiment_score);
      console.log('Rationale:', data.parsed.rationale);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 3: Full analysis flow
async function testFullAnalysis() {
  console.log('\n=== TEST 3: Full analysis flow (as called from frontend) ===');
  try {
    const response = await fetch(`${API_URL}/monitoring/analyze-sentiment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: testText,
        source: 'test',
        brandContext: {
          companyName: "Test Company",
          customContext: "We prioritize customer data security above all else"
        },
        sentimentContext: {
          positiveScenarios: "Customer satisfaction, quick problem resolution, praise from customers",
          negativeScenarios: "Data security concerns, privacy issues, security vulnerabilities",
          criticalConcerns: "Data breaches, security incidents, customer data exposure"
        },
        customInstructions: "Focus on security implications"
      })
    });
    const data = await response.json();
    console.log('Response:', data);
    if (data.analysis) {
      console.log('Sentiment:', data.analysis.sentiment);
      console.log('Score:', data.analysis.sentiment_score);
      console.log('Rationale:', data.analysis.rationale);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test 4: Check saved config
async function checkSavedConfig() {
  console.log('\n=== TEST 4: Check saved configuration ===');
  try {
    const response = await fetch(`${API_URL}/monitoring/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    const data = await response.json();
    console.log('Saved config:', data);
    if (data && data.claude && data.claude.sentimentContext) {
      console.log('Sentiment context exists:', {
        positiveLength: data.claude.sentimentContext.positiveScenarios?.length || 0,
        negativeLength: data.claude.sentimentContext.negativeScenarios?.length || 0,
        criticalLength: data.claude.sentimentContext.criticalConcerns?.length || 0
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting sentiment context tests...');
  console.log('Make sure to set TEST_TOKEN from browser localStorage.getItem("token")');
  
  if (TEST_TOKEN === 'YOUR_AUTH_TOKEN') {
    console.error('\n❌ Please set TEST_TOKEN in the script first!');
    console.log('1. Open browser console');
    console.log('2. Run: localStorage.getItem("token")');
    console.log('3. Copy the token and paste it in this script');
    return;
  }
  
  await checkSavedConfig();
  await testDirect();
  await testWithContext();
  await testFullAnalysis();
}

runTests();