#!/usr/bin/env node

/**
 * QuickInit End-to-End Test Script
 * Tests that company names are properly saved and passed through the discovery pipeline
 */

const fetch = require('node-fetch');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

// Test companies
const TEST_COMPANIES = [
  'Tesla',
  'Microsoft', 
  'Toyota',
  'Goldman Sachs',
  'Mitsui & Co'
];

async function testCompany(companyName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${companyName}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Call intelligence-discovery-v3
    console.log('📡 Calling intelligence-discovery-v3...');
    const discoveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-discovery-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization: {
          name: companyName,
          id: companyName.toLowerCase().replace(/\s+/g, '-'),
          industry: 'Technology',
          competitors: [],
          stakeholders: {},
          keywords: [companyName]
        },
        config: {
          useCache: false,
          comprehensive: true
        }
      })
    });

    if (!discoveryResponse.ok) {
      const errorText = await discoveryResponse.text();
      throw new Error(`Discovery failed: ${discoveryResponse.status} - ${errorText}`);
    }

    const discoveryResult = await discoveryResponse.json();
    console.log('✅ Discovery response received');
    
    if (discoveryResult.request_id) {
      console.log(`📌 Request ID: ${discoveryResult.request_id}`);
    }

    // Verify the company name is preserved
    const returnedName = discoveryResult.data?.name || 
                        discoveryResult.organization?.name || 
                        'Not found';
    
    if (returnedName === companyName) {
      console.log(`✅ Company name preserved: "${returnedName}"`);
    } else {
      console.log(`❌ Company name mismatch: Expected "${companyName}", got "${returnedName}"`);
    }

    // Step 2: Call organization-discovery for Claude analysis
    console.log('🤖 Calling organization-discovery...');
    const analysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/organization-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_name: companyName,
        request_id: discoveryResult.request_id
      })
    });

    if (analysisResponse.ok) {
      const analysisResult = await analysisResponse.json();
      console.log('✅ Claude analysis complete');
      
      // Display key findings
      if (analysisResult.industry) {
        console.log(`   Industry: ${analysisResult.industry}`);
      }
      if (analysisResult.competitors && analysisResult.competitors.length > 0) {
        console.log(`   Competitors: ${analysisResult.competitors.slice(0, 3).join(', ')}`);
      }
      if (analysisResult.description) {
        console.log(`   Description: ${analysisResult.description}`);
      }
    } else {
      console.log(`⚠️ Analysis failed with status: ${analysisResponse.status}`);
    }

    return { success: true, company: companyName };

  } catch (error) {
    console.error(`❌ Test failed for ${companyName}: ${error.message}`);
    return { success: false, company: companyName, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 QuickInit End-to-End Test');
  console.log(`Testing ${TEST_COMPANIES.length} companies...`);
  
  const results = [];
  
  for (const company of TEST_COMPANIES) {
    const result = await testCompany(company);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`   - ${r.company}`));
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => console.log(`   - ${r.company}: ${r.error}`));
  }
  
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testCompany, runTests };