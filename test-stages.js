// Test individual pipeline stages
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM';

async function testStage(stageName, endpoint, body) {
  console.log(`\nTesting ${stageName}...`);
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ ${stageName} responded in ${elapsed}ms - Status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ Error: ${text.substring(0, 200)}`);
      return null;
    }
    
    const result = await response.json();
    console.log(`✅ ${stageName} completed successfully`);
    return result;
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    if (error.name === 'AbortError') {
      console.log(`⏱️ ${stageName} TIMEOUT after ${elapsed}ms`);
    } else {
      console.log(`❌ ${stageName} error: ${error.message}`);
    }
    return null;
  }
}

async function runTests() {
  console.log('Testing individual pipeline stages to identify timeout...');
  
  // Test MCP Discovery
  await testStage('MCP Discovery', 'mcp-discovery', {
    organization: 'Anthropic'
  });
  
  // Test Monitor Stage 1
  await testStage('Monitor Stage 1', 'monitor-stage-1', {
    organization_name: 'Anthropic',
    search_query: 'Anthropic AI',
    limit: 10
  });
  
  // Test a simple synthesis
  await testStage('MCP Executive Synthesis', 'mcp-executive-synthesis', {
    method: 'tools/call',
    params: {
      name: 'synthesize_executive_intelligence',
      arguments: {
        organization_name: 'Anthropic',
        enriched_data: {
          organized_intelligence: {
            events: [
              { type: 'product', description: 'Test event' }
            ]
          }
        }
      }
    }
  });
  
  // Test opportunity detector
  await testStage('MCP Opportunity Detector', 'mcp-opportunity-detector', {
    organization_name: 'Anthropic',
    organization_id: '1',
    enriched_data: {
      organized_intelligence: {
        events: [
          { type: 'competitor_negative', description: 'Test' }
        ]
      }
    }
  });
  
  // Test opportunity orchestrator
  await testStage('Opportunity Orchestrator', 'opportunity-orchestrator', {
    organization_name: 'Anthropic',
    organization_id: '1',
    opportunities: []
  });
}

runTests();
