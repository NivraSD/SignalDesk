#!/usr/bin/env node

/**
 * HTML Garbage Detection Utility
 * Analyzes existing opportunities/events to identify garbage patterns
 */

const https = require('https');

const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM";

function isGarbageContent(text) {
  if (!text) return true;
  
  const garbagePatterns = [
    /<[^>]+>/,  // HTML tags
    /&[^;]+;/,  // HTML entities  
    /^[\s\W]{0,10}$/, // Only punctuation/whitespace
    /^(undefined|null|NaN)$/i,
    /^\[.*\]$/, // Array stringification
    /^{.*}$/,   // Object stringification
    /ond to requests/i, // Known garbage from logs
    /click here|read more|continue reading/i,
    /^.{1,20}$/, // Suspiciously short
    /^\w{1,3}\s/,  // Single/few letters followed by space
  ];
  
  return garbagePatterns.some(pattern => pattern.test(text));
}

function analyzeOpportunities() {
  console.log('🔍 ANALYZING OPPORTUNITIES FOR HTML GARBAGE');
  console.log('===========================================');
  
  const options = {
    hostname: 'zskaxjtyuaqazydouifp.supabase.co',
    path: '/rest/v1/opportunities?order=created_at.desc&limit=50',
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const opportunities = JSON.parse(data);
        
        console.log(`\n📊 Analyzing ${opportunities.length} opportunities...\n`);
        
        let garbageCount = 0;
        let validCount = 0;
        const garbageExamples = [];
        
        opportunities.forEach((opp, i) => {
          const titleGarbage = isGarbageContent(opp.title);
          const descGarbage = isGarbageContent(opp.description);
          
          if (titleGarbage || descGarbage) {
            garbageCount++;
            if (garbageExamples.length < 5) {
              garbageExamples.push({
                id: opp.id,
                title: opp.title,
                description: opp.description?.substring(0, 100),
                title_garbage: titleGarbage,
                desc_garbage: descGarbage
              });
            }
          } else {
            validCount++;
          }
        });
        
        console.log('📈 GARBAGE ANALYSIS RESULTS:');
        console.log(`  Total opportunities: ${opportunities.length}`);
        console.log(`  🗑️  Garbage detected: ${garbageCount} (${(garbageCount/opportunities.length*100).toFixed(1)}%)`);
        console.log(`  ✅ Valid content: ${validCount} (${(validCount/opportunities.length*100).toFixed(1)}%)`);
        
        if (garbageExamples.length > 0) {
          console.log('\n🗑️  SAMPLE GARBAGE CONTENT:');
          garbageExamples.forEach((example, idx) => {
            console.log(`\n  ${idx + 1}. ID: ${example.id}`);
            console.log(`     Title: "${example.title}" ${example.title_garbage ? '[GARBAGE]' : '[OK]'}`);
            console.log(`     Desc: "${example.description}..." ${example.desc_garbage ? '[GARBAGE]' : '[OK]'}`);
          });
        }
        
        if (garbageCount > 0) {
          console.log('\n❌ GARBAGE DETECTED - Pipeline needs fixing');
          console.log('   Run the comprehensive test to identify the source');
        } else {
          console.log('\n✅ NO GARBAGE FOUND - Pipeline appears clean');
        }
        
      } catch (e) {
        console.error('❌ Error analyzing opportunities:', e.message);
      }
    });
  });

  req.on('error', console.error);
  req.end();
}

analyzeOpportunities();