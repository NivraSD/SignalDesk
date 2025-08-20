import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the API key from environment
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    
    console.log('🔍 Testing API Key Access')
    console.log('API Key exists:', !!ANTHROPIC_API_KEY)
    console.log('API Key length:', ANTHROPIC_API_KEY?.length || 0)
    console.log('First 10 chars:', ANTHROPIC_API_KEY?.substring(0, 10) || 'N/A')
    
    // Test Claude API call
    let claudeTestResult = 'Not tested'
    
    if (ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 100,
            messages: [{
              role: 'user',
              content: 'Say "API working" in 3 words'
            }]
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          claudeTestResult = 'SUCCESS: ' + data.content[0].text
        } else {
          claudeTestResult = `ERROR: ${response.status} - ${await response.text()}`
        }
      } catch (error) {
        claudeTestResult = `EXCEPTION: ${error.message}`
      }
    } else {
      claudeTestResult = 'API key not found in environment'
    }
    
    return new Response(
      JSON.stringify({
        api_key_exists: !!ANTHROPIC_API_KEY,
        api_key_length: ANTHROPIC_API_KEY?.length || 0,
        api_key_prefix: ANTHROPIC_API_KEY?.substring(0, 10) || 'N/A',
        claude_test: claudeTestResult,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})