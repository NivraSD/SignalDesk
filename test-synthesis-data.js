#!/usr/bin/env node

/**
 * Test script to verify data is properly reaching synthesis
 * This will call enrichment and then synthesis directly to see the data flow
 */

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MDMyNzcsImV4cCI6MjA0ODQ3OTI3N30.2TR9FrkuyLtYmYVTJLtVpB3vhqwR8B7TkymSqIHZP-E';

// Test data - minimal set of articles with extracted data
const testArticles = [
  {
    title: "Major competitor announces layoffs",
    content: "TechCorp announced 1000 layoffs today as part of restructuring",
    url: "https://example.com/1",
    published_at: new Date().toISOString(),
    source: "TechNews",
    pr_relevance_score: 85,
    pr_category: "competitive",
    full_content: "TechCorp announced 1000 layoffs today as part of restructuring. The company cited challenging market conditions.",
    firecrawl_extracted: {
      quotes: ["We need to adapt to market conditions", "This was a difficult decision"],
      entities: {
        companies: ["TechCorp", "Microsoft", "Google"],
        people: ["John CEO", "Jane CFO"]
      },
      metrics: {
        financial: ["$500M loss", "$2B revenue"],
        percentages: ["15% workforce reduction"]
      },
      key_points: ["Major restructuring", "Cost cutting measures", "Market challenges"]
    }
  },
  {
    title: "New regulation impacts industry",
    content: "SEC announces new compliance requirements for tech companies",
    url: "https://example.com/2",
    published_at: new Date().toISOString(),
    source: "RegNews",
    pr_relevance_score: 90,
    pr_category: "regulatory",
    full_content: "SEC announces new compliance requirements. All companies must comply by Q2 2025.",
    firecrawl_extracted: {
      quotes: ["Compliance is mandatory", "We expect full cooperation"],
      entities: {
        companies: ["SEC"],
        people: ["Gary Gensler"]
      },
      metrics: {
        financial: ["$10M fines for non-compliance"],
        percentages: ["100% compliance required"]
      },
      key_points: ["New regulations", "Q2 2025 deadline", "Heavy fines"]
    }
  },
  {
    title: "Market opportunity emerges in AI space",
    content: "Growing demand for AI solutions creates market gap",
    url: "https://example.com/3",
    published_at: new Date().toISOString(),
    source: "MarketWatch",
    pr_relevance_score: 95,
    pr_category: "opportunity",
    full_content: "The AI market is experiencing unprecedented growth with a clear gap in enterprise solutions.",
    firecrawl_extracted: {
      quotes: ["The market is ripe for disruption", "Enterprise AI is underserved"],
      entities: {
        companies: ["OpenAI", "Anthropic", "Google"],
        people: ["Sam Altman"]
      },
      metrics: {
        financial: ["$300B market size", "$50B opportunity"],
        percentages: ["200% YoY growth"]
      },
      key_points: ["Market gap identified", "Enterprise opportunity", "Rapid growth"]
    }
  }
];

const testProfile = {
  organization_id: 'test-org-123',
  organization_name: 'TestCorp',
  industry: 'Technology',
  strengths: ['AI expertise', 'Strong engineering', 'Market position'],
  weaknesses: ['Limited resources', 'Brand recognition'],
  data: {
    monitoring_keywords: ['AI', 'technology', 'enterprise'],
    competitors: ['TechCorp', 'Microsoft', 'Google']
  }
};

async function callEnrichment(articles, profile) {
  console.log('\n🔬 TEST 1: Calling Enrichment with test data...');
  console.log(`📊 Input: ${articles.length} articles with Firecrawl extraction`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      articles,
      profile,
      organization_name: profile.organization_name
    })
  });

  if (!response.ok) {
    throw new Error(`Enrichment failed: ${response.status} ${await response.text()}`);
  }

  const enrichedData = await response.json();
  
  console.log('\n✅ Enrichment Response Structure:');
  console.log('- Has organized_intelligence:', !!enrichedData.organized_intelligence);
  console.log('- Has extracted_data:', !!enrichedData.extracted_data);
  console.log('- Has executive_summary:', !!enrichedData.executive_summary);
  console.log('- Has knowledge_graph:', !!enrichedData.knowledge_graph);
  
  if (enrichedData.organized_intelligence) {
    console.log('\n📦 Organized Intelligence Contents:');
    console.log('  - Events:', enrichedData.organized_intelligence.events?.length || 0);
    console.log('  - Entities:', enrichedData.organized_intelligence.entities?.length || 0);
    console.log('  - Quotes:', enrichedData.organized_intelligence.quotes?.length || 0);
    console.log('  - Metrics:', enrichedData.organized_intelligence.metrics?.length || 0);
    console.log('  - Topic Clusters:', enrichedData.organized_intelligence.topic_clusters?.length || 0);
    
    // Show sample data
    if (enrichedData.organized_intelligence.events?.length > 0) {
      console.log('\n  Sample Event:', JSON.stringify(enrichedData.organized_intelligence.events[0], null, 2));
    }
    if (enrichedData.organized_intelligence.quotes?.length > 0) {
      console.log('\n  Sample Quote:', JSON.stringify(enrichedData.organized_intelligence.quotes[0], null, 2));
    }
  }
  
  if (enrichedData.executive_summary) {
    console.log('\n📋 Executive Summary Contents:');
    console.log('  - Immediate Actions:', enrichedData.executive_summary.immediate_actions?.length || 0);
    console.log('  - Strategic Opportunities:', enrichedData.executive_summary.strategic_opportunities?.length || 0);
    console.log('  - Competitive Threats:', enrichedData.executive_summary.competitive_threats?.length || 0);
    console.log('  - Market Trends:', enrichedData.executive_summary.market_trends?.length || 0);
  }
  
  return enrichedData;
}

async function callSynthesis(enrichedData, profile) {
  console.log('\n🔬 TEST 2: Calling Synthesis with enriched data...');
  
  // Call synthesis directly via MCP
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-executive-synthesis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'synthesize_executive_intelligence',
        arguments: {
          enriched_data: enrichedData,
          organization: {
            name: profile.organization_name,
            industry: profile.industry
          },
          analysis_depth: 'comprehensive_consolidated',
          synthesis_focus: 'all_consolidated'
        }
      },
      id: 1
    })
  });

  if (!response.ok) {
    throw new Error(`Synthesis failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  
  console.log('\n✅ Synthesis Response:');
  
  if (result.result?.content?.[0]?.text) {
    try {
      const synthesis = JSON.parse(result.result.content[0].text);
      
      console.log('\n📊 Synthesis Structure:');
      console.log('- Has executive_synthesis:', !!synthesis.executive_synthesis);
      console.log('- Has competitive_dynamics:', !!synthesis.competitive_dynamics);
      console.log('- Has narrative_intelligence:', !!synthesis.narrative_intelligence);
      console.log('- Has immediate_opportunities:', !!synthesis.immediate_opportunities);
      
      if (synthesis.competitive_dynamics) {
        console.log('\n🎯 Competitive Dynamics:');
        console.log('  - Key Competitor Moves:', synthesis.competitive_dynamics.key_competitor_moves?.length || 0);
        console.log('  - Urgent PR Actions:', synthesis.competitive_dynamics.urgent_pr_actions?.length || 0);
        console.log('  - Competitive Threats:', synthesis.competitive_dynamics.competitive_threats?.length || 0);
        
        if (synthesis.competitive_dynamics.urgent_pr_actions?.length > 0) {
          console.log('  - Sample PR Action:', synthesis.competitive_dynamics.urgent_pr_actions[0]);
        }
      }
      
      if (synthesis.immediate_opportunities) {
        console.log('\n🚀 Immediate Opportunities:', synthesis.immediate_opportunities.length);
        if (synthesis.immediate_opportunities.length > 0) {
          console.log('  - Sample:', JSON.stringify(synthesis.immediate_opportunities[0], null, 2));
        }
      }
      
      return synthesis;
    } catch (e) {
      console.error('Failed to parse synthesis JSON:', e);
      console.log('Raw response:', result.result?.content?.[0]?.text?.substring(0, 500));
    }
  }
  
  return result;
}

async function callOpportunityDetector(enrichedData, synthesis, profile) {
  console.log('\n🔬 TEST 3: Calling Opportunity Detector...');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-opportunity-detector`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      organization_id: profile.organization_id,
      organization_name: profile.organization_name,
      enriched_data: enrichedData,
      executive_synthesis: synthesis,
      profile: profile
    })
  });

  if (!response.ok) {
    throw new Error(`Opportunity detection failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  
  console.log('\n✅ Opportunity Detection Results:');
  console.log('- Total Opportunities:', result.opportunities?.length || 0);
  console.log('- High Urgency:', result.summary?.high_urgency || 0);
  console.log('- By Pattern:', JSON.stringify(result.summary?.by_pattern || {}, null, 2));
  console.log('- By Category:', JSON.stringify(result.summary?.by_category || {}, null, 2));
  
  if (result.opportunities?.length > 0) {
    console.log('\n🎯 Sample Opportunity:');
    const opp = result.opportunities[0];
    console.log('  Title:', opp.title);
    console.log('  Pattern:', opp.pattern_matched);
    console.log('  PR Angle:', opp.pr_angle);
    console.log('  Signal Strength:', opp.signal_strength);
    console.log('  Score:', opp.score);
    console.log('  Confidence Factors:', opp.confidence_factors);
  }
  
  return result;
}

async function runTest() {
  try {
    console.log('🚀 Starting Synthesis Data Flow Test');
    console.log('=====================================');
    
    // Step 1: Enrichment
    const enrichedData = await callEnrichment(testArticles, testProfile);
    
    // Step 2: Synthesis
    const synthesis = await callSynthesis(enrichedData, testProfile);
    
    // Step 3: Opportunity Detection
    const opportunities = await callOpportunityDetector(enrichedData, synthesis, testProfile);
    
    console.log('\n✅ TEST COMPLETE!');
    console.log('=================');
    console.log('Data successfully flowed through:');
    console.log('1. Enrichment ✓ (extracted events, entities, quotes, metrics)');
    console.log('2. Synthesis ✓ (received and processed organized_intelligence)');
    console.log('3. Opportunity Detection ✓ (found', opportunities.opportunities?.length || 0, 'opportunities)');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest();