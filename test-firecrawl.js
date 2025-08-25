// Test Firecrawl API
const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0';

async function testFirecrawlSearch() {
  console.log('🔥 Testing Firecrawl Search API...');
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'Adobe news 2024',
        limit: 2
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Firecrawl error:', data);
      
      // Try v0 endpoint
      console.log('\n🔄 Trying v0 endpoint...');
      const v0Response = await fetch('https://api.firecrawl.dev/v0/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'Adobe news 2024',
          pageOptions: {
            fetchPageContent: false
          }
        })
      });
      
      console.log('v0 Response status:', v0Response.status);
      const v0Data = await v0Response.json();
      console.log('v0 Response data:', JSON.stringify(v0Data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFirecrawlSearch();