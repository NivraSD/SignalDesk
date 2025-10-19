// Test pattern detector directly to see error
const fetch = require('node-fetch');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';
const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff';

async function testPatternDetector() {
  console.log('🧪 Testing pattern detector...\n');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stakeholder-pattern-detector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        organizationId: openaiOrgId
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const text = await response.text();
    console.log('\nResponse:');
    console.log(text);

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('\nParsed data:');
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPatternDetector();
