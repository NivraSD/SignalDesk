// Claude Integration Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  prompt: string
  context?: any
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context, maxTokens = 1000, temperature = 0.7, systemPrompt } = await req.json() as RequestBody

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Claude API key from environment
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    // Prepare the messages for Claude
    const messages = []
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }
    
    if (context) {
      messages.push({
        role: 'system',
        content: `Context: ${JSON.stringify(context)}`
      })
    }
    
    messages.push({
      role: 'user',
      content: prompt
    })

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        temperature: temperature,
        messages: messages
      })
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const claudeData = await claudeResponse.json()
    
    // Extract the response text
    const responseText = claudeData.content?.[0]?.text || ''

    // Log the interaction to the database for learning
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        // Get user's organization
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        if (userData?.organization_id) {
          // Store in adaptive learning table
          await supabase
            .from('adaptive_learning')
            .insert({
              organization_id: userData.organization_id,
              model_type: 'claude_integration',
              input_data: { prompt, context },
              output_data: { response: responseText },
              metadata: {
                model: 'claude-sonnet-4-20250514',
                temperature,
                maxTokens
              }
            })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        usage: claudeData.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in claude-integration:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})