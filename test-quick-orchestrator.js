const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function test() {
  console.log('Quick orchestrator test...');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(SUPABASE_URL + '/functions/v1/intelligence-orchestrator-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({
        organization_name: 'Test',
        skip_enrichment: true,
        skip_synthesis: true,
        skip_opportunities: true,
        monitoring_data: {
          findings: [{title: 'Test', content: 'Test content'}]
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Orchestrator responding!');
    } else {
      const text = await response.text();
      console.log('Error:', text.substring(0, 200));
    }
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      console.log('❌ TIMEOUT - orchestrator still hanging');
    } else {
      console.log('Error:', e.message);
    }
  }
}

test();
