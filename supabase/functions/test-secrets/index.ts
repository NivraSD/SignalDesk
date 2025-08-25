import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Test what environment variables are accessible
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        has_anthropic_key: !!anthropicKey,
        anthropic_key_length: anthropicKey?.length || 0,
        anthropic_key_prefix: anthropicKey?.substring(0, 10) || 'NOT_SET',
        has_supabase_url: !!supabaseUrl,
        has_supabase_anon_key: !!supabaseAnonKey,
        deno_deployment_id: Deno.env.get('DENO_DEPLOYMENT_ID'),
      },
      test_claude_call: false,
      claude_response: null
    }

    // If we have the key, try to make a simple Claude call
    if (anthropicKey) {
      console.log('Testing Claude API with key...')
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: 'Say "API key works!" in exactly 3 words.'
          }]
        })
      })

      if (claudeResponse.ok) {
        const data = await claudeResponse.json()
        result.test_claude_call = true
        result.claude_response = data.content[0].text
      } else {
        result.test_claude_call = false
        result.claude_response = `Error: ${claudeResponse.status} ${await claudeResponse.text()}`
      }
    }

    return new Response(
      JSON.stringify(result, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in test-secrets:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})