// Parse JournalistUpdate.md properly to extract outlet info
const fs = require('fs');

const content = fs.readFileSync('JournalistUpdate.md', 'utf8');

const journalists = [];
let currentOutlet = '';

// Split by lines and parse
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Detect outlet names (e.g., 'New York Times': {)
  const outletMatch = line.match(/^['"]([^'"]+)['"]\s*:\s*\{/);
  if (outletMatch) {
    currentOutlet = outletMatch[1];
    continue;
  }
  
  // Parse journalist objects
  const journalistMatch = line.match(/\{\s*name:\s*['"]([^'"]+)['"],\s*beat:\s*['"]([^'"]+)['"]/);
  if (journalistMatch) {
    const name = journalistMatch[1];
    const beat = journalistMatch[2];
    
    // Extract twitter and email from the same line or nearby
    const twitterMatch = line.match(/twitter:\s*['"]([^'"]+)['"]/);
    const emailMatch = line.match(/email:\s*['"]([^'"]+)['"]/);
    
    journalists.push({
      name,
      outlet: currentOutlet || 'Unknown',
      beat,
      twitter: twitterMatch ? twitterMatch[1] : '',
      email: emailMatch ? emailMatch[1] : ''
    });
  }
}

console.log(`Found ${journalists.length} journalists`);
console.log('Sample outlets:', [...new Set(journalists.map(j => j.outlet))].slice(0, 10));

// Create CSV with proper headers
const csv = ['name,outlet,beat,twitter_handle,email,tier,industry'];

journalists.forEach(j => {
  // Infer industry from beat
  let industry = 'technology'; // default
  const beatLower = j.beat.toLowerCase();
  
  if (beatLower.includes('advertising') || beatLower.includes('marketing') || beatLower.includes('martech')) {
    industry = 'advertising';
  } else if (beatLower.includes('health') || beatLower.includes('biotech')) {
    industry = 'healthcare';
  } else if (beatLower.includes('finance') || beatLower.includes('fintech')) {
    industry = 'fintech';
  } else if (beatLower.includes('crypto') || beatLower.includes('blockchain')) {
    industry = 'cryptocurrency';
  } else if (beatLower.includes('climate') || beatLower.includes('energy')) {
    industry = 'climate';
  } else if (beatLower.includes('real estate') || beatLower.includes('housing')) {
    industry = 'real_estate';
  } else if (beatLower.includes('retail') || beatLower.includes('ecommerce')) {
    industry = 'retail';
  }
  
  csv.push(`"${j.name}","${j.outlet}","${j.beat}","${j.twitter}","${j.email}","tier1","${industry}"`);
});

fs.writeFileSync('journalists.csv', csv.join('\n'));
console.log(`\nCreated journalists.csv with ${journalists.length} rows`);
console.log('Check first few rows:');
console.log(csv.slice(0, 5).join('\n'));
