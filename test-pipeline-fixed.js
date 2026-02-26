#!/usr/bin/env node

/**
 * Test the fixed SignalDesk V3 pipeline
 * Run with: node test-pipeline-fixed.js
 */

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function runPipeline() {
  console.log('🚀 Starting SignalDesk V3 Pipeline Test...\n');
  
  try {
    // Step 1: Create Profile
    console.log('📋 Step 1: Creating organization profile for Tesla...');
    const profileResponse = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        tool: 'create_organization_profile',
        arguments: {
          organization_name: 'Tesla',
          industry_hint: 'automotive',
          save_to_persistence: false
        }
      })
    });
    
    if (!profileResponse.ok) {
      throw new Error(`Discovery failed: ${await profileResponse.text()}`);
    }
    
    const profileResult = await profileResponse.json();
    const profile = profileResult.profile;
    console.log(`✅ Profile created with ${profile.competition?.direct_competitors?.length || 0} competitors\n`);
    
    // Step 2: Monitor Stage 1
    console.log('📡 Step 2: Collecting articles from sources...');
    const monitorResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_name: 'Tesla',
        profile: profile
      })
    });
    
    if (!monitorResponse.ok) {
      throw new Error(`Monitor Stage 1 failed: ${await monitorResponse.text()}`);
    }
    
    const monitorResult = await monitorResponse.json();
    console.log(`✅ Collected ${monitorResult.total_articles} articles`);
    console.log(`📊 Coverage: ${monitorResult.metadata?.discovery_coverage?.competitors_covered || 0}/${monitorResult.metadata?.discovery_coverage?.total_competitors || 0} competitors\n`);
    
    // Step 3: Relevance + Firecrawl
    console.log('🎯 Step 3: Scoring relevance and running Firecrawl...');
    const relevanceResponse = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        articles: monitorResult.articles,
        profile: profile,
        organization_name: 'Tesla',
        top_k: 60
      })
    });
    
    if (!relevanceResponse.ok) {
      throw new Error(`Relevance failed: ${await relevanceResponse.text()}`);
    }
    
    const relevanceResult = await relevanceResponse.json();
    const articlesWithContent = relevanceResult.findings?.filter(a => a.has_full_content) || [];
    console.log(`✅ Scored ${relevanceResult.findings?.length || 0} articles`);
    console.log(`📄 Firecrawl scraped ${articlesWithContent.length} articles with full content\n`);
    
    // Step 4: Intelligence Orchestrator V2
    console.log('🚀 Step 4: Running Intelligence Orchestrator V2...');
    console.log('   This coordinates: Enrichment → Synthesis → Opportunities');
    
    const orchestratorResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        organization_name: 'Tesla',
        profile: profile,
        monitoring_data: {
          findings: relevanceResult.findings || [],
          total_articles: relevanceResult.total_articles || 0,
          articles_processed: relevanceResult.findings?.length || 0
        },
        skip_enrichment: false,
        skip_opportunity_engine: false,
        articles_limit: 200
      })
    });
    
    if (!orchestratorResponse.ok) {
      throw new Error(`Intelligence Orchestrator V2 failed: ${await orchestratorResponse.text()}`);
    }
    
    const orchestratorResult = await orchestratorResponse.json();
    
    // Display results
    if (orchestratorResult.intelligence) {
      const stats = orchestratorResult.intelligence.statistics || {};
      console.log(`\n✅ Intelligence Extraction Complete:`);
      console.log(`   - ${stats.unique_events || 0} events extracted`);
      console.log(`   - ${stats.unique_entities || 0} entities found`);
      console.log(`   - ${stats.articles_with_full_content || 0} articles with full content`);
      console.log(`   - ${stats.articles_with_partial_content || 0} articles with partial content`);
      
      if (orchestratorResult.intelligence.executive_synthesis) {
        console.log(`\n🧠 Executive Synthesis Generated`);
        const synthesis = orchestratorResult.intelligence.executive_synthesis;
        if (synthesis.competitive_dynamics) {
          console.log(`   - ${Object.keys(synthesis.competitive_dynamics).length} competitive insights`);
        }
        if (synthesis.trending_narratives) {
          console.log(`   - ${Object.keys(synthesis.trending_narratives).length} trending topics`);
        }
      }
      
      if (orchestratorResult.opportunities?.length > 0) {
        console.log(`\n💡 ${orchestratorResult.opportunities.length} Opportunities Generated:`);
        orchestratorResult.opportunities.slice(0, 3).forEach(opp => {
          console.log(`   - [${opp.urgency}] ${opp.title}`);
        });
      }
    } else {
      console.log('\n⚠️ No intelligence generated - check logs for errors');
    }
    
    console.log('\n✅ Pipeline test complete!');
    
  } catch (error) {
    console.error(`\n❌ Pipeline test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
runPipeline();