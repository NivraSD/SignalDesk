import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    // Support both 'message' and 'prompt' fields for backwards compatibility
    const { message, prompt, model = 'claude-sonnet-4-20250514', max_tokens = 1000, ...options } = requestBody
    const userPrompt = message || prompt || ''
    
    if (!userPrompt) {
      throw new Error('No message or prompt provided')
    }

    // Get Anthropic API key from environment
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [{ role: 'user', content: userPrompt }],
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        content: data.content?.[0]?.text || '',
        usage: data.usage,
        model: data.model 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Claude chat error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})