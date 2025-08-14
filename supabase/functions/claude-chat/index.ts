// Supabase Edge Function: Claude AI Chat
// Handles all Claude AI interactions for the platform

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { prompt, model, max_tokens, temperature, system } = await req.json()

    // Get Anthropic API key
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    let userId = null
    let organizationId = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        userId = user.id
        // Get user's organization
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userId)
          .single()
        organizationId = userData?.organization_id
      }
    }

    console.log(`🤖 Claude request from user: ${userId}, org: ${organizationId}`)

    // Prepare Claude API request
    const messages = []
    
    // Add system message if provided
    if (system) {
      messages.push({
        role: 'assistant',
        content: system
      })
    }

    // Add user message
    messages.push({
      role: 'user',
      content: prompt
    })

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: max_tokens || 1000,
        temperature: temperature || 0.7,
        messages: messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.content[0].text

    // Log usage to database if user is authenticated
    if (userId && organizationId) {
      try {
        await supabase
          .from('ai_usage_logs')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            model: model || 'claude-3-haiku-20240307',
            prompt_tokens: data.usage?.input_tokens || 0,
            completion_tokens: data.usage?.output_tokens || 0,
            total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            purpose: 'chat',
            metadata: {
              model: model,
              max_tokens: max_tokens
            }
          })
      } catch (logError) {
        console.error('Failed to log usage:', logError)
        // Don't fail the request if logging fails
      }
    }

    // Return Claude's response
    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        usage: data.usage,
        model: data.model
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Error in claude-chat function:', error)
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