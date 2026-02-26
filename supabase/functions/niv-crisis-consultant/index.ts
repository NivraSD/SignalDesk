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
      conversation_history = [],
      crisis = null
    } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build crisis context string
    let crisisContext = ''
    if (crisis && crisis.id !== 'preview') {
      crisisContext = `\n\nACTIVE CRISIS CONTEXT:
- Crisis Type: ${crisis.crisis_type || 'Unknown'}
- Title: ${crisis.title || 'Unknown'}
- Severity: ${crisis.severity || 'medium'} (${crisis.severity === 'critical' ? '🔴 CRITICAL' : crisis.severity === 'high' ? '🟠 HIGH' : crisis.severity === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'})
- Status: ${crisis.status || 'active'}
- Duration: ${crisis.started_at ? getElapsedTime(crisis.started_at) : 'Unknown'}
- Trigger: ${crisis.trigger_source === 'manual' ? 'Manually activated' : crisis.trigger_source || 'Unknown'}

Timeline Events: ${crisis.timeline?.length || 0} events recorded
Decisions Made: ${crisis.decisions?.length || 0} decisions
Communications Sent: ${crisis.communications?.length || 0} communications
Active Tasks: ${crisis.tasks?.filter((t: any) => t.status !== 'completed').length || 0} tasks

Provide guidance specific to THIS active crisis situation.`
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

    // Add organization and crisis context to system prompt
    let systemPrompt = CONSULTANT_SYSTEM_PROMPT
    if (organization_name) {
      systemPrompt += `\n\nYou are consulting for: ${organization_name}`
    }
    if (crisisContext) {
      systemPrompt += crisisContext
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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

// Helper function to calculate elapsed time
function getElapsedTime(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) {
    return `${diffMins} minutes`
  } else if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  } else {
    const days = Math.floor(diffMins / 1440)
    const hours = Math.floor((diffMins % 1440) / 60)
    return `${days}d ${hours}h`
  }
}
