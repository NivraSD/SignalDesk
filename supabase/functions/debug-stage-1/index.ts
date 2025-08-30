import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Debug: Check environment variables
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    
    const debugInfo = {
      has_anthropic_key: !!ANTHROPIC_API_KEY,
      anthropic_key_length: ANTHROPIC_API_KEY?.length || 0,
      anthropic_key_prefix: ANTHROPIC_API_KEY?.substring(0, 10) || 'NO KEY',
      has_claude_key: !!CLAUDE_API_KEY,
      claude_key_length: CLAUDE_API_KEY?.length || 0,
      all_env_keys: Object.keys(Deno.env.toObject()).filter(k => 
        k.includes('ANTHROPIC') || k.includes('CLAUDE') || k.includes('API')
      )
    };

    // Try to call Claude if we have a key
    let claudeTest = { success: false, error: null, response: null };
    
    const API_KEY = ANTHROPIC_API_KEY || CLAUDE_API_KEY;
    if (API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 50,
            messages: [{
              role: 'user',
              content: 'Just say "Claude 4 is working!"'
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          claudeTest.success = true;
          claudeTest.response = data.content[0].text;
        } else {
          const error = await response.text();
          claudeTest.error = error;
        }
      } catch (error) {
        claudeTest.error = error.message;
      }
    } else {
      claudeTest.error = 'No API key found in environment';
    }

    return new Response(JSON.stringify({
      success: true,
      debug: debugInfo,
      claude_test: claudeTest,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});