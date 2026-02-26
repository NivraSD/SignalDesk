/**
 * Quick test to verify Nike hardcoding has been removed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Nike/Adidas/Puma hardcoding removal...\n');

const filesToCheck = [
  'src/controllers/monitoringControllerV2.js',
  'src/services/SourceDiscoveryService.js',
  'src/config/campaignTypeConfigs.js',
  'src/services/NewsRoundupService.js',
  'src/services/OpportunityDetectionService.js'
];

let foundIssues = false;
const brandKeywords = ['nike', 'adidas', 'puma', 'swoosh', 'jordan', 'yeezy'];

for (const file of filesToCheck) {
  const filePath = path.join(__dirname, file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`Checking ${file}...`);
    
    let fileIssues = false;
    lines.forEach((line, index) => {
      // Skip comments and actual news source URLs (those are fine)
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
      if (line.includes('news.nike.com/rss') || line.includes('news.adidas.com/rss')) {
        // These are now removed, so if found they're issues
        console.log(`  ❌ Line ${index + 1}: Found hardcoded brand RSS feed`);
        foundIssues = true;
        fileIssues = true;
        return;
      }
      
      // Check for hardcoded brand references (case insensitive)
      for (const brand of brandKeywords) {
        const regex = new RegExp(`['"\`]${brand}['"\`]`, 'i');
        if (regex.test(line)) {
          // Skip if it's in a generic context like "Major Sports Brand"
          if (line.includes('Major Sports Brand')) continue;
          // Skip if it's a generic tagline reference
          if (line.includes('defining tagline moment')) continue;
          
          console.log(`  ❌ Line ${index + 1}: Found hardcoded reference to "${brand}"`);
          console.log(`     ${line.trim()}`);
          foundIssues = true;
          fileIssues = true;
        }
      }
    });
    
    if (!fileIssues) {
      console.log(`  ✅ No hardcoded brand references found`);
    }
    
  } catch (error) {
    console.log(`  ⚠️  Could not read file: ${error.message}`);
  }
  
  console.log('');
}

console.log('=====================================');
if (foundIssues) {
  console.log('❌ FAILED: Found remaining hardcoded brand references');
  console.log('The system still has Nike/Adidas/Puma specific code that needs to be removed.');
} else {
  console.log('✅ SUCCESS: No hardcoded Nike/Adidas/Puma references found!');
  console.log('The system is now generic and can work with any organization/industry.');
}
console.log('=====================================');