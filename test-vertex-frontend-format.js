// Test vertex-ai-visual with exact frontend format
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

async function testFrontendFormat() {
  console.log('Testing vertex-ai-visual with MCP format (as frontend sends)...')
  
  // Test 1: MCP format (what frontend sends)
  const mcpRequest = {
    tool: 'generate_image',
    arguments: {
      prompt: 'Tesla electric car on Mars with Earth in background. Professional business image.',
      style: 'corporate',
      aspectRatio: '16:9'
    },
    conversation: []
  }
  
  console.log('\n1️⃣ Testing MCP format:', JSON.stringify(mcpRequest, null, 2))
  
  const mcpResponse = await fetch(SUPABASE_URL + '/functions/v1/vertex-ai-visual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify(mcpRequest)
  })
  
  console.log('MCP Response status:', mcpResponse.status)
  const mcpResult = await mcpResponse.json()
  console.log('MCP Result:', JSON.stringify(mcpResult, null, 2).substring(0, 500))
  
  // Test 2: Direct format (what vertex-ai-visual expects)
  const directRequest = {
    type: 'image',
    prompt: 'Tesla electric car on Mars with Earth in background',
    style: 'photorealistic',
    aspectRatio: '16:9'
  }
  
  console.log('\n2️⃣ Testing direct format:', JSON.stringify(directRequest, null, 2))
  
  const directResponse = await fetch(SUPABASE_URL + '/functions/v1/vertex-ai-visual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    body: JSON.stringify(directRequest)
  })
  
  console.log('Direct Response status:', directResponse.status)
  const directResult = await directResponse.json()
  console.log('Direct Result:', JSON.stringify(directResult, null, 2).substring(0, 500))
}

testFrontendFormat().catch(console.error)
