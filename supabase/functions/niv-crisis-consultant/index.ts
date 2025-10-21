import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONSULTANT_SYSTEM_PROMPT = `You are an expert crisis management consultant providing strategic guidance.

Your role:
- Provide strategic crisis preparedness advice
- Help develop crisis response plans
- Offer guidance on crisis communication
- Suggest crisis prevention strategies
- Be directive and specific in your recommendations

Keep responses concise (under 250 words) and actionable. Always provide concrete next steps.

Format your responses with clear structure:
- Use bullet points for lists
- Be direct and specific
- Include WHO should do WHAT and WHEN
- Reference best practices when relevant`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      message,
      organization_name,
      conversation_history = []
    } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build messages array with context
    const messages = [
      ...conversation_history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Add organization context to system prompt if provided
    const systemPrompt = organization_name
      ? `${CONSULTANT_SYSTEM_PROMPT}\n\nYou are consulting for: ${organization_name}`
      : CONSULTANT_SYSTEM_PROMPT

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        temperature: 0.3,
        system: systemPrompt,
        messages: messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Claude API error:', error)
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await response.json()
    const content = aiResponse.content[0].text

    return new Response(JSON.stringify({
      success: true,
      response: content,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Crisis consultant error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
