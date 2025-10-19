#!/usr/bin/env node

/**
 * COMPREHENSIVE PIPELINE TEST
 * Tests each stage individually and validates data quality at every step
 * Designed to catch HTML garbage before it flows downstream
 */

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MDMyNzcsImV4cCI6MjA0ODQ3OTI3N30.2TR9FrkuyLtYmYVTJLtVpB3vhqwR8B7TkymSqIHZP-E';

const testProfile = {
  organization_name: 'Tesla',
  industry: 'Electric Vehicles',
  monitoring_config: {
    keywords: ['Tesla', 'EV', 'electric vehicle', 'Elon Musk', 'robotaxi', 'FSD'],
    all_sources: [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        type: 'rss',
        priority: 'critical'
      },
      {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        type: 'rss',
        priority: 'high'
      }
    ]
  },
  competitors: ['BYD', 'Rivian', 'Lucid', 'GM', 'Ford'],
  stakeholders: ['SEC', 'NHTSA', 'EPA']
};

/**
 * Content validation utilities
 */
function isValidContent(text) {
  if (!text || text.length < 20) return false;
  
  // Check for HTML garbage patterns
  const htmlGarbagePatterns = [
    /<[^>]+>/,  // Contains HTML tags
    /&[^;]+;/,  // Contains HTML entities
    /^[\s\W]{0,10}$/, // Only whitespace/punctuation
    /^(undefined|null|NaN)$/i, // Invalid values
    /^\[.*\]$/,  // Looks like array stringification
    /^{.*}$/,    // Looks like object stringification
    /^ond to requests/i, // Known garbage pattern from logs
  ];
  
  return !htmlGarbagePatterns.some(pattern => pattern.test(text));
}

function validateArticleData(article, stage) {
  const issues = [];
  
  // Validate title
  if (!isValidContent(article.title)) {
    issues.push(`Invalid title: "${article.title}"`);
  }
  
  // Validate URL
  if (!article.url || !article.url.startsWith('http')) {
    issues.push(`Invalid URL: "${article.url}"`);
  }
  
  // Validate description/summary
  if (article.description && !isValidContent(article.description)) {
    issues.push(`Invalid description: "${article.description?.substring(0, 50)}..."`);
  }
  
  if (article.summary && !isValidContent(article.summary)) {
    issues.push(`Invalid summary: "${article.summary?.substring(0, 50)}..."`);
  }
  
  // Stage-specific validations
  if (stage === 'enrichment') {
    // Validate full content if present
    if (article.full_content && !isValidContent(article.full_content)) {
      issues.push(`Invalid full_content: "${article.full_content?.substring(0, 50)}..."`);
    }
    
    // Check for extraction data quality
    if (article.firecrawl_extracted?.quotes) {
      article.firecrawl_extracted.quotes.forEach((quote, idx) => {
        if (!isValidContent(quote)) {
          issues.push(`Invalid quote ${idx}: "${quote?.substring(0, 50)}..."`);
        }
      });
    }
  }
  
  return issues;
}

function validateEvents(events, stage) {
  const issues = [];
  
  events.forEach((event, idx) => {
    // Validate event description
    if (!isValidContent(event.description)) {
      issues.push(`Event ${idx}: Invalid description: "${event.description?.substring(0, 50)}..."`);
    }
    
    // Check for suspiciously short events (often HTML fragments)
    if (event.description && event.description.length < 30) {
      issues.push(`Event ${idx}: Suspiciously short description: "${event.description}"`);
    }
    
    // Check for known garbage patterns
    if (event.description && /ond to requests|click here|read more/i.test(event.description)) {
      issues.push(`Event ${idx}: Contains garbage text: "${event.description?.substring(0, 50)}..."`);
    }
  });
  
  return issues;
}

async function testStage1() {
  console.log('\n🔬 TESTING STAGE 1: Monitor Stage 1');
  console.log('=====================================');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      organization_name: testProfile.organization_name,
      profile: testProfile
    })
  });

  if (!response.ok) {
    throw new Error(`Stage 1 failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  
  console.log(`✅ Stage 1 Results:`);
  console.log(`   Articles collected: ${result.articles?.length || 0}`);
  console.log(`   Sources used: RSS=${result.metadata?.sources_used?.rss || 0}, API=${result.metadata?.sources_used?.api || 0}`);
  
  // Validate article quality
  let validationIssues = 0;
  result.articles?.slice(0, 10).forEach((article, idx) => {
    const issues = validateArticleData(article, 'stage1');
    if (issues.length > 0) {
      console.log(`   ⚠️  Article ${idx}: ${issues.join(', ')}`);
      validationIssues++;
    }
  });
  
  console.log(`   Validation: ${validationIssues} issues found in first 10 articles`);
  
  return result;
}

async function testStage2(articles) {
  console.log('\n🔬 TESTING STAGE 2: Relevance + Firecrawl');
  console.log('==========================================');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/monitor-stage-2-relevance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      articles: articles.slice(0, 15), // Test with 15 articles
      profile: testProfile,
      organization_name: testProfile.organization_name,
      top_k: 10
    })
  });

  if (!response.ok) {
    throw new Error(`Stage 2 failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  
  console.log(`✅ Stage 2 Results:`);
  console.log(`   Articles processed: ${result.articles?.length || 0}`);
  console.log(`   High relevance: ${result.articles?.filter(a => a.pr_relevance_score > 70).length || 0}`);
  
  // Analyze Firecrawl success
  let withFullContent = 0;
  let withExtraction = 0;
  let validationIssues = 0;
  
  result.articles?.forEach((article, idx) => {
    if (article.has_full_content) withFullContent++;
    if (article.firecrawl_extracted) withExtraction++;
    
    const issues = validateArticleData(article, 'relevance');
    if (issues.length > 0) {
      console.log(`   ⚠️  Article ${idx}: ${issues.join(', ')}`);
      validationIssues++;
    }
  });
  
  console.log(`   Firecrawl: ${withFullContent} with content, ${withExtraction} with extraction`);
  console.log(`   Validation: ${validationIssues} issues found`);
  
  return result;
}

async function testStage3(articles) {
  console.log('\n🔬 TESTING STAGE 3: Enrichment');
  console.log('===============================');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/monitoring-stage-2-enrichment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      articles: articles,
      profile: testProfile,
      organization_name: testProfile.organization_name
    })
  });

  if (!response.ok) {
    throw new Error(`Stage 3 failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  
  console.log(`✅ Stage 3 Results:`);
  console.log(`   Events extracted: ${result.extracted_data?.events?.length || 0}`);
  console.log(`   Entities found: ${result.extracted_data?.entities?.length || 0}`);
  console.log(`   Quotes extracted: ${result.extracted_data?.quotes?.length || 0}`);
  console.log(`   Articles with full content: ${result.statistics?.articles_with_real_content || 0}`);
  console.log(`   Extraction success rate: ${result.statistics?.extraction_success_rate || '0%'}`);
  
  // Validate event quality - THIS IS THE CRITICAL TEST
  const eventValidationIssues = validateEvents(result.extracted_data?.events || [], 'enrichment');
  if (eventValidationIssues.length > 0) {
    console.log('\n❌ EVENT VALIDATION ISSUES FOUND:');
    eventValidationIssues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ All events passed validation - no HTML garbage detected');
  }
  
  // Show sample events for manual inspection
  console.log('\n📊 Sample Events (first 5):');
  result.extracted_data?.events?.slice(0, 5).forEach((event, idx) => {
    console.log(`   ${idx + 1}. [${event.type}] ${event.description?.substring(0, 100)}...`);
  });
  
  return result;
}

async function runComprehensiveTest() {
  try {
    console.log('🚀 COMPREHENSIVE PIPELINE TEST - HTML GARBAGE DETECTION');
    console.log('=========================================================');
    console.log('Organization:', testProfile.organization_name);
    
    // Stage 1: Monitor Stage 1
    const stage1Result = await testStage1();
    
    if (!stage1Result.articles || stage1Result.articles.length === 0) {
      throw new Error('Stage 1 returned no articles');
    }
    
    // Stage 2: Relevance + Firecrawl
    const stage2Result = await testStage2(stage1Result.articles);
    
    if (!stage2Result.articles || stage2Result.articles.length === 0) {
      throw new Error('Stage 2 returned no articles');
    }
    
    // Stage 3: Enrichment (THE CRITICAL TEST)
    const stage3Result = await testStage3(stage2Result.articles);
    
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('====================');
    
    const hasValidEvents = stage3Result.extracted_data?.events?.some(event => 
      isValidContent(event.description) && event.description.length > 30
    );
    
    const hasGarbageEvents = stage3Result.extracted_data?.events?.some(event => 
      !isValidContent(event.description) || /ond to requests|click here/i.test(event.description)
    );
    
    if (hasGarbageEvents) {
      console.log('❌ HTML GARBAGE DETECTED IN EVENTS');
      console.log('   The pipeline is still contaminating events with HTML fragments');
      console.log('   Check the enrichment stage for issues');
    } else if (hasValidEvents) {
      console.log('✅ PIPELINE IS CLEAN');
      console.log('   All events contain valid, readable content');
      console.log('   No HTML garbage detected');
    } else {
      console.log('⚠️  NO EVENTS EXTRACTED');
      console.log('   Pipeline may be too restrictive or Firecrawl failed');
    }
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('comprehensive-test-results.json', JSON.stringify({
      stage1: { article_count: stage1Result.articles.length },
      stage2: { 
        article_count: stage2Result.articles.length,
        firecrawl_success: stage2Result.articles.filter(a => a.has_full_content).length
      },
      stage3: {
        events: stage3Result.extracted_data?.events || [],
        validation_passed: !hasGarbageEvents && hasValidEvents
      }
    }, null, 2));
    
    console.log('\n📁 Full results saved to comprehensive-test-results.json');
    
  } catch (error) {
    console.error('\n❌ COMPREHENSIVE TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runComprehensiveTest();