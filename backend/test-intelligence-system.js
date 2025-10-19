#!/usr/bin/env node

/**
 * Test script to verify the intelligence gathering system is working
 * Run with: node test-intelligence-system.js
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:5001/api';
const TEST_ORG_ID = 'test-org-' + Date.now();

// Your auth token (you'll need to get this from browser dev tools or login)
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_TOKEN_HERE';

async function testIntelligenceSystem() {
  console.log('\n========================================');
  console.log('🧪 TESTING INTELLIGENCE GATHERING SYSTEM');
  console.log('========================================\n');
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Step 1: Test Organization Analysis
    console.log('📍 Step 1: Testing Organization Analysis...');
    try {
      const analysisResponse = await axios.post(
        `${API_BASE}/intelligence/analyze-organization`,
        {
          company: 'EventBrite',
          url: 'https://www.eventbrite.com',
          requestType: 'discover'
        },
        { headers }
      );
      console.log('✅ Organization Analysis:', analysisResponse.data.industry);
      console.log('   Competitors found:', analysisResponse.data.competitors.length);
      console.log('   Topics found:', analysisResponse.data.topics.length);
    } catch (error) {
      console.error('❌ Organization Analysis failed:', error.response?.data || error.message);
    }
    
    // Step 2: Create Intelligence Target
    console.log('\n📍 Step 2: Creating Intelligence Target...');
    try {
      const targetResponse = await axios.post(
        `${API_BASE}/intelligence/targets`,
        {
          organization_id: TEST_ORG_ID,
          name: 'Eventbrite',
          type: 'competitor',
          priority: 'high',
          keywords: ['eventbrite', 'event management', 'ticketing'],
          topics: ['virtual events', 'hybrid events'],
          active: true
        },
        { headers }
      );
      console.log('✅ Target created:', targetResponse.data.success);
    } catch (error) {
      console.error('❌ Target creation failed:', error.response?.data || error.message);
    }
    
    // Step 3: Trigger Monitoring Scan
    console.log('\n📍 Step 3: Triggering Monitoring Scan...');
    try {
      const scanResponse = await axios.post(
        `${API_BASE}/intelligence/monitor/trigger`,
        { organizationId: TEST_ORG_ID },
        { headers }
      );
      console.log('✅ Monitoring scan completed:');
      console.log('   Findings:', scanResponse.data.findings_count);
      console.log('   Opportunities:', scanResponse.data.opportunities_count);
    } catch (error) {
      console.error('❌ Monitoring scan failed:', error.response?.data || error.message);
    }
    
    // Step 4: Get Intelligence Findings
    console.log('\n📍 Step 4: Getting Intelligence Findings...');
    try {
      const findingsResponse = await axios.get(
        `${API_BASE}/intelligence/findings?organizationId=${TEST_ORG_ID}&limit=5`,
        { headers }
      );
      console.log('✅ Findings retrieved:', findingsResponse.data.length);
      if (findingsResponse.data.length > 0) {
        console.log('   Sample finding:', findingsResponse.data[0].title);
      }
    } catch (error) {
      console.error('❌ Getting findings failed:', error.response?.data || error.message);
    }
    
    // Step 5: Test V2 Intelligence Summary (used by frontend)
    console.log('\n📍 Step 5: Testing V2 Intelligence Summary...');
    try {
      const summaryResponse = await axios.get(
        `${API_BASE}/monitoring/v2/intelligence-summary/${TEST_ORG_ID}`,
        { headers }
      );
      console.log('✅ Intelligence Summary received:');
      console.log('   Total articles:', summaryResponse.data.executiveSummary?.totalArticles);
      console.log('   Organization news:', summaryResponse.data.organizationIntelligence?.articles?.length || 0);
      console.log('   Competitor news:', summaryResponse.data.competitiveIntelligence?.articles?.length || 0);
    } catch (error) {
      console.error('❌ Intelligence summary failed:', error.response?.data || error.message);
    }
    
    // Step 6: Test Opportunity Detection
    console.log('\n📍 Step 6: Testing Opportunity Detection...');
    try {
      const oppResponse = await axios.post(
        `${API_BASE}/monitoring/v2/scan-opportunities`,
        { organizationId: TEST_ORG_ID },
        { headers }
      );
      console.log('✅ Opportunities detected:', oppResponse.data.opportunities?.length || 0);
      if (oppResponse.data.opportunities?.length > 0) {
        const opp = oppResponse.data.opportunities[0];
        console.log('   Sample opportunity:', opp.title);
        console.log('   Pattern:', opp.pattern_name);
        console.log('   Urgency:', opp.urgency);
      }
    } catch (error) {
      console.error('❌ Opportunity detection failed:', error.response?.data || error.message);
    }
    
    console.log('\n========================================');
    console.log('✅ Intelligence System Test Complete!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend is running on port 5001');
    console.log('2. You have a valid auth token');
    console.log('3. Database is connected');
    console.log('4. API keys are configured in .env');
  }
}

// Run the test
testIntelligenceSystem();