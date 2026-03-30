#!/usr/bin/env node

/**
 * Test relevance stage with real data to see what Firecrawl is actually extracting
 */

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MDMyNzcsImV4cCI6MjA0ODQ3OTI3N30.2TR9FrkuyLtYmYVTJLtVpB3vhqwR8B7TkymSqIHZP-E';

// Test with real monitoring data - let's use Tesla as an example
const testMonitoringData = {
  articles: [
    {
      title: "Tesla Stock Breaks Out Past Buy Point",
      url: "https://www.investors.com/news/tesla-stock-buy-point-2025/",
      published_at: new Date().toISOString(),
      source: "Investor's Business Daily",
      description: "Tesla stock rises on FSD progress and energy storage momentum"
    },
    {
      title: "Tesla Robotaxi Launch and FSD Advancements",
      url: "https://electrek.co/2025/01/11/tesla-robotaxi-fsd/",
      published_at: new Date().toISOString(),
      source: "Electrek",
      description: "Tesla prepares for robotaxi deployment with latest FSD improvements"
    },
    {
      title: "Tesla Megapack Production Expansion",
      url: "https://www.teslarati.com/tesla-megapack-production-expansion/",
      published_at: new Date().toISOString(),
      source: "Teslarati",
      description: "Tesla expands Megapack production capacity to meet growing demand"
    },
    {
      title: "BYD Overtakes Tesla in Global EV Sales",
      url: "https://www.reuters.com/business/autos-transportation/byd-tesla-ev-sales-2025/",
      published_at: new Date().toISOString(),
      source: "Reuters",
      description: "BYD surpasses Tesla in quarterly EV deliveries for the first time"
    },
    {
      title: "Tesla Energy Storage Business Accelerates",
      url: "https://www.bloomberg.com/news/articles/tesla-energy-storage-growth",
      published_at: new Date().toISOString(),
      source: "Bloomberg",
      description: "Tesla's energy storage deployments reach record levels in Q4"
    }
  ]
};

const testProfile = {
  organization_name: 'Tesla',
  industry: 'Electric Vehicles',
  data: {
    monitoring_keywords: ['Tesla', 'EV', 'electric vehicle', 'FSD', 'robotaxi', 'energy storage', 'Megapack'],
    competitors: ['BYD', 'Rivian', 'Lucid', 'GM', 'Ford'],
    topics_of_interest: ['autonomous driving', 'battery technology', 'EV market', 'renewable energy']
  }
};

async function callMonitorStage1() {
  console.log('\n🔬 STAGE 1: Monitor Stage 1 - Getting initial articles...');
  
  // In real pipeline, this would call NewsAPI, etc.
  // For test, we'll use our test data
  console.log(`📊 Input: ${testMonitoringData.articles.length} test articles`);
  
  return testMonitoringData;
}

async function callRelevanceScoring(monitoringData, profile) {
  console.log('\n🔬 STAGE 2: Relevance Scoring with Firecrawl extraction...');
  console.log(`📊 Processing ${monitoringData.articles.length} articles`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      articles: monitoringData.articles, // Relevance expects articles directly
      profile: profile,
      organization_name: profile.organization_name,
      top_k: 50, // Return top 50 articles
      scrape_limit: 5 // Scrape all 5 test articles
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Relevance scoring failed: ${response.status} ${error}`);
  }

  const result = await response.json();
  
  console.log('\n✅ Relevance Response Analysis:');
  console.log('=====================================');
  console.log(`Total articles returned: ${result.articles?.length || 0}`);
  console.log(`High relevance (>70): ${result.articles?.filter(a => a.pr_relevance_score > 70).length || 0}`);
  console.log(`Medium relevance (50-70): ${result.articles?.filter(a => a.pr_relevance_score >= 50 && a.pr_relevance_score <= 70).length || 0}`);
  console.log(`Low relevance (<50): ${result.articles?.filter(a => a.pr_relevance_score < 50).length || 0}`);
  
  // Analyze Firecrawl extraction
  console.log('\n📦 Firecrawl Extraction Analysis:');
  console.log('-----------------------------------');
  
  let articlesWithFullContent = 0;
  let articlesWithExtraction = 0;
  let totalQuotes = 0;
  let totalEntities = 0;
  let totalMetrics = 0;
  let totalKeyPoints = 0;
  
  result.articles?.forEach((article, idx) => {
    console.log(`\n📄 Article ${idx + 1}: ${article.title?.substring(0, 60)}...`);
    console.log(`   Relevance Score: ${article.pr_relevance_score}`);
    console.log(`   Category: ${article.pr_category}`);
    
    // Check full content
    if (article.full_content) {
      articlesWithFullContent++;
      console.log(`   ✓ Full content: ${article.full_content.length} chars`);
    } else {
      console.log(`   ✗ No full content`);
    }
    
    // Check Firecrawl extraction
    if (article.firecrawl_extracted) {
      articlesWithExtraction++;
      const extracted = article.firecrawl_extracted;
      
      console.log(`   ✓ Firecrawl extraction found:`);
      
      // Quotes
      const quotes = extracted.quotes || [];
      console.log(`     - Quotes: ${quotes.length}`);
      if (quotes.length > 0) {
        console.log(`       Sample: "${quotes[0]?.substring(0, 80)}..."`);
      }
      totalQuotes += quotes.length;
      
      // Entities
      const companies = extracted.entities?.companies || extracted.mentioned_entities || [];
      const people = extracted.entities?.people || [];
      console.log(`     - Companies: ${companies.length} [${companies.slice(0, 3).join(', ')}]`);
      console.log(`     - People: ${people.length} [${people.slice(0, 3).join(', ')}]`);
      totalEntities += companies.length + people.length;
      
      // Metrics
      const financial = extracted.metrics?.financial || [];
      const percentages = extracted.metrics?.percentages || [];
      console.log(`     - Financial metrics: ${financial.length} [${financial.slice(0, 2).join(', ')}]`);
      console.log(`     - Percentages: ${percentages.length} [${percentages.slice(0, 2).join(', ')}]`);
      totalMetrics += financial.length + percentages.length;
      
      // Key points
      const keyPoints = extracted.key_points || [];
      console.log(`     - Key points: ${keyPoints.length}`);
      if (keyPoints.length > 0) {
        console.log(`       Sample: "${keyPoints[0]?.substring(0, 80)}..."`);
      }
      totalKeyPoints += keyPoints.length;
      
    } else if (article.pr_extraction) {
      // Check for pr_extraction as fallback
      articlesWithExtraction++;
      console.log(`   ✓ PR extraction found (fallback)`);
    } else {
      console.log(`   ✗ No extraction data`);
    }
  });
  
  console.log('\n📊 EXTRACTION SUMMARY:');
  console.log('======================');
  console.log(`Articles with full content: ${articlesWithFullContent}/${result.articles?.length || 0}`);
  console.log(`Articles with extraction: ${articlesWithExtraction}/${result.articles?.length || 0}`);
  console.log(`Total quotes extracted: ${totalQuotes}`);
  console.log(`Total entities found: ${totalEntities}`);
  console.log(`Total metrics identified: ${totalMetrics}`);
  console.log(`Total key points: ${totalKeyPoints}`);
  
  // Show a sample of the actual data structure
  if (result.articles?.length > 0) {
    console.log('\n🔍 Sample Article Structure (first article with extraction):');
    const sampleArticle = result.articles.find(a => a.firecrawl_extracted) || result.articles[0];
    console.log(JSON.stringify({
      title: sampleArticle.title,
      pr_relevance_score: sampleArticle.pr_relevance_score,
      pr_category: sampleArticle.pr_category,
      has_full_content: !!sampleArticle.full_content,
      full_content_length: sampleArticle.full_content?.length || 0,
      has_firecrawl_extracted: !!sampleArticle.firecrawl_extracted,
      extraction_keys: sampleArticle.firecrawl_extracted ? Object.keys(sampleArticle.firecrawl_extracted) : [],
      quotes_count: sampleArticle.firecrawl_extracted?.quotes?.length || 0,
      entities_count: (sampleArticle.firecrawl_extracted?.entities?.companies?.length || 0) + 
                      (sampleArticle.firecrawl_extracted?.entities?.people?.length || 0)
    }, null, 2));
  }
  
  return result;
}

async function runTest() {
  try {
    console.log('🚀 Testing Relevance Stage with Real Data');
    console.log('==========================================');
    console.log('Organization:', testProfile.organization_name);
    console.log('Industry:', testProfile.industry);
    
    // Get initial articles
    const monitoringData = await callMonitorStage1();
    
    // Call relevance scoring with Firecrawl
    const relevanceResult = await callRelevanceScoring(monitoringData, testProfile);
    
    console.log('\n✅ TEST COMPLETE!');
    console.log('=================');
    
    if (relevanceResult.articles?.some(a => a.firecrawl_extracted)) {
      console.log('✓ Firecrawl extraction is working');
      console.log('✓ Articles have structured data (quotes, entities, metrics)');
    } else {
      console.log('⚠️  WARNING: No Firecrawl extraction found in any articles');
      console.log('   This means enrichment will not have structured data to work with');
    }
    
    // Save the output for further analysis
    const fs = require('fs');
    fs.writeFileSync('relevance-output.json', JSON.stringify(relevanceResult, null, 2));
    console.log('\n📁 Full output saved to relevance-output.json for analysis');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest();